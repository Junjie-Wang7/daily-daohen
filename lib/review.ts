import { getRecentStreakInfo, getTopTags } from "@/lib/calendar";
import { JournalEntry } from "@/lib/types";

export type ReviewRange = "7d" | "30d" | "all";

export type ReviewStone = {
  stone: string;
  count: number;
};

export type ReviewKeyword = {
  keyword: string;
  count: number;
};

export type ReviewSummary = {
  recordCount: number;
  recentStreak: number;
  topTags: Array<{ tag: string; count: number }>;
  topStones: ReviewStone[];
  topKeywords: ReviewKeyword[];
  streakInfo: {
    days: number;
    startDate: string;
    endDate: string;
  } | null;
};

export type ReviewFilter = {
  tag: string | null;
  stone: string | null;
  keyword: string | null;
};

const REVIEW_KEYWORD_SOURCE_IDS = ["event", "thought", "fear", "stone"] as const;

const PREFIX_FILLERS = [
  "告诉自己",
  "主石头是",
  "主石头",
  "石头是",
  "别",
  "其实",
  "今天",
  "明天",
  "昨天",
  "然后",
  "但是",
  "不过",
  "因为",
  "所以",
  "如果",
  "还是",
  "先",
  "我",
  "自己",
  "想",
  "觉得",
  "会",
  "要",
  "有点",
  "一点点",
  "一点",
  "正在",
  "已经",
  "可能",
  "好像",
  "就是",
  "告诉",
] as const;

const SUFFIX_FILLERS = [
  "一下",
  "一点点",
  "一点",
  "起来",
  "着",
  "了",
  "过",
  "吧",
  "呢",
  "啊",
  "呀",
  "吗",
  "的",
] as const;

const STOP_KEYWORDS = new Set([
  "我",
  "自己",
  "今天",
  "明天",
  "昨天",
  "其实",
  "然后",
  "但是",
  "不过",
  "因为",
  "所以",
  "如果",
  "还是",
  "先",
  "想",
  "觉得",
  "会",
  "要",
  "有点",
  "一点",
  "一点点",
  "已经",
  "可能",
  "好像",
  "就是",
  "告诉",
  "告诉自己",
  "主石头",
  "主石头是",
  "石头是",
  "事情",
  "问题",
  "情况",
  "东西",
  "这个",
  "那个",
  "这里",
  "那里",
  "一下",
  "起来",
]);

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function sortEntries(entries: JournalEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

function getRangeStart(range: ReviewRange, referenceDate: Date) {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 6 : 29;
  const cursor = new Date(referenceDate);
  cursor.setDate(cursor.getDate() - days);
  return toLocalDateString(cursor);
}

function normalizeKeywordCandidate(text: string) {
  let candidate = text.trim().replace(/\s+/g, "");
  if (!candidate) {
    return "";
  }

  let trimmed = true;
  while (trimmed) {
    trimmed = false;
    for (const prefix of PREFIX_FILLERS) {
      if (candidate.startsWith(prefix) && candidate.length > prefix.length + 1) {
        candidate = candidate.slice(prefix.length);
        trimmed = true;
        break;
      }
    }
  }

  trimmed = true;
  while (trimmed) {
    trimmed = false;
    for (const suffix of SUFFIX_FILLERS) {
      if (candidate.endsWith(suffix) && candidate.length > suffix.length + 1) {
        candidate = candidate.slice(0, -suffix.length);
        trimmed = true;
        break;
      }
    }
  }

  candidate = candidate.trim().replace(/\s+/g, "");

  if (!candidate || candidate.length < 2 || candidate.length > 16) {
    return "";
  }

  if (STOP_KEYWORDS.has(candidate)) {
    return "";
  }

  return candidate;
}

function collectEntryKeywords(entry: JournalEntry) {
  const rawAnswers = REVIEW_KEYWORD_SOURCE_IDS.map((id) => entry.answers[id]).join(" ");
  const segments = rawAnswers.split(/[，,。！？!?；;：:\n\r\t（）()【】\[\]“”"'`、/\\|]+/g);
  const keywords = new Set<string>();

  for (const segment of segments) {
    const keyword = normalizeKeywordCandidate(segment);
    if (keyword) {
      keywords.add(keyword);
    }
  }

  return [...keywords];
}

export function extractReviewKeywords(entry: JournalEntry) {
  return collectEntryKeywords(entry);
}

export function filterEntriesByRange(
  entries: JournalEntry[],
  range: ReviewRange,
  referenceDate = new Date(),
) {
  const sorted = sortEntries(entries);
  const startDate = getRangeStart(range, referenceDate);
  if (!startDate) {
    return sorted;
  }

  const today = toLocalDateString(referenceDate);
  return sorted.filter((entry) => entry.date >= startDate && entry.date <= today);
}

export function getTopStones(entries: JournalEntry[], limit = 5): ReviewStone[] {
  const counts = new Map<string, { count: number; lastSeen: string }>();

  for (const entry of entries) {
    const stone = entry.answers.stone.trim();
    if (!stone) {
      continue;
    }

    const current = counts.get(stone);
    counts.set(stone, {
      count: (current?.count ?? 0) + 1,
      lastSeen: current?.lastSeen && current.lastSeen > entry.date ? current.lastSeen : entry.date,
    });
  }

  return [...counts.entries()]
    .sort(
      (a, b) =>
        b[1].count - a[1].count ||
        b[1].lastSeen.localeCompare(a[1].lastSeen) ||
        a[0].localeCompare(b[0], "zh-Hans-CN"),
    )
    .slice(0, limit)
    .map(([stone, value]) => ({ stone, count: value.count }));
}

export function getTopKeywords(entries: JournalEntry[], limit = 6): ReviewKeyword[] {
  const counts = new Map<string, { count: number; lastSeen: string }>();

  for (const entry of entries) {
    const keywords = collectEntryKeywords(entry);
    for (const keyword of keywords) {
      const current = counts.get(keyword);
      counts.set(keyword, {
        count: (current?.count ?? 0) + 1,
        lastSeen: current?.lastSeen && current.lastSeen > entry.date ? current.lastSeen : entry.date,
      });
    }
  }

  return [...counts.entries()]
    .sort(
      (a, b) =>
        b[1].count - a[1].count ||
        b[1].lastSeen.localeCompare(a[1].lastSeen) ||
        a[0].localeCompare(b[0], "zh-Hans-CN"),
    )
    .slice(0, limit)
    .map(([keyword, value]) => ({ keyword, count: value.count }));
}

export function getReviewSummary(
  entries: JournalEntry[],
  range: ReviewRange,
  referenceDate = new Date(),
): ReviewSummary {
  const scopedEntries = filterEntriesByRange(entries, range, referenceDate);
  const streakInfo = getRecentStreakInfo(scopedEntries, referenceDate);

  return {
    recordCount: scopedEntries.length,
    recentStreak: streakInfo?.days ?? 0,
    topTags: getTopTags(scopedEntries, 5),
    topStones: getTopStones(scopedEntries, 5),
    topKeywords: getTopKeywords(scopedEntries, 6),
    streakInfo,
  };
}

export function filterEntriesByReview(
  entries: JournalEntry[],
  range: ReviewRange,
  filters: ReviewFilter,
  referenceDate = new Date(),
) {
  return filterEntriesByRange(entries, range, referenceDate).filter((entry) => {
    const tagMatch = !filters.tag || entry.tags.includes(filters.tag);
    const stoneMatch = !filters.stone || entry.answers.stone.trim() === filters.stone;
    const keywordMatch = !filters.keyword || collectEntryKeywords(entry).includes(filters.keyword);
    return tagMatch && stoneMatch && keywordMatch;
  });
}

export function formatRangeLabel(range: ReviewRange) {
  if (range === "7d") {
    return "最近 7 天";
  }

  if (range === "30d") {
    return "最近 30 天";
  }

  return "全部";
}

export function getReviewEntryTitle(entry: JournalEntry) {
  return entry.answers.stone.trim() || entry.answers.event.trim() || "未命名记录";
}

export function getReviewEntrySubtitle(entry: JournalEntry) {
  const tags = entry.tags.map((tag) => `#${tag}`).join(" ");
  return tags || "尚未留下标签";
}

export function getReviewAnchorDate(entry: JournalEntry) {
  return new Date(`${entry.date}T00:00:00`);
}

export function getReviewEmptyMessage(range: ReviewRange, hasEntries: boolean) {
  if (!hasEntries) {
    return "这里还没有留下道痕。先从今天开始写下第一笔，再慢慢回来看见它们。";
  }

  if (range === "7d") {
    return "最近 7 天还没有留下痕迹。可以先写今天，或者切换到最近 30 天看看。";
  }

  if (range === "30d") {
    return "最近 30 天还没有留下痕迹。可以先写今天，或者切换到“全部”看看更早的内容。";
  }

  return "当前范围内还没有可显示的记录。可以切换时间范围，或者先写下今天的道痕。";
}
