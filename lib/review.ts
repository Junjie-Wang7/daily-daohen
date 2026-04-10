import { JournalEntry } from "@/lib/types";
import { getRecentStreakInfo, getTopTags } from "@/lib/calendar";

export type ReviewRange = "7d" | "30d" | "all";

export type ReviewStone = {
  stone: string;
  count: number;
};

export type ReviewSummary = {
  recordCount: number;
  recentStreak: number;
  topTags: Array<{ tag: string; count: number }>;
  topStones: ReviewStone[];
  streakInfo: {
    days: number;
    startDate: string;
    endDate: string;
  } | null;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
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
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const stone = entry.answers.stone.trim();
    if (!stone) {
      continue;
    }

    counts.set(stone, (counts.get(stone) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
    .slice(0, limit)
    .map(([stone, count]) => ({ stone, count }));
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
    streakInfo,
  };
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
  return tags || "暂无标签";
}

export function getReviewAnchorDate(entry: JournalEntry) {
  return toDate(entry.date);
}
