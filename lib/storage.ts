import { QUESTIONS } from "@/lib/questions";
import { JournalEntry, JournalStore, QuestionId } from "@/lib/types";

const STORAGE_KEY = "daily-daohen-store";

export type ImportStrategy = "overwrite" | "merge";

export type ImportResult =
  | {
      ok: true;
      importedCount: number;
      totalCount: number;
      strategy: ImportStrategy;
    }
  | {
      ok: false;
      message: string;
    };

function blankAnswers(): Record<QuestionId, string> {
  return QUESTIONS.reduce(
    (acc, question) => {
      acc[question.id] = "";
      return acc;
    },
    {} as Record<QuestionId, string>,
  );
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeTags(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}

function normalizeAnswers(value: unknown) {
  const input =
    value && typeof value === "object" ? (value as Partial<Record<QuestionId, unknown>>) : {};

  return QUESTIONS.reduce(
    (acc, question) => {
      acc[question.id] = normalizeString(input[question.id]);
      return acc;
    },
    {} as Record<QuestionId, string>,
  );
}

function normalizeTimestamp(value: unknown, fallback: string) {
  const text = normalizeString(value);
  return text || fallback;
}

function normalizeEntry(value: unknown): JournalEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<JournalEntry>;
  const date = normalizeString(entry.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = normalizeTimestamp(entry.createdAt, now);
  const updatedAt = normalizeTimestamp(entry.updatedAt, createdAt);

  return {
    date,
    tags: normalizeTags(entry.tags),
    answers: normalizeAnswers(entry.answers),
    createdAt,
    updatedAt,
  };
}

function sortEntries(entries: JournalEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

function timestampValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function pickLatestEntry(current: JournalEntry, candidate: JournalEntry) {
  const currentTime = timestampValue(current.updatedAt);
  const candidateTime = timestampValue(candidate.updatedAt);

  return candidateTime >= currentTime ? candidate : current;
}

function dedupeEntries(entries: JournalEntry[]) {
  const map = new Map<string, JournalEntry>();

  for (const entry of entries) {
    const existing = map.get(entry.date);
    map.set(entry.date, existing ? pickLatestEntry(existing, entry) : entry);
  }

  return sortEntries(Array.from(map.values()));
}

function parseImportEntries(content: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false as const,
      message: "导入失败：文件不是合法的 JSON。",
    };
  }

  const rawEntries = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as JournalStore).entries)
      ? (parsed as JournalStore).entries
      : null;

  if (!rawEntries) {
    return {
      ok: false as const,
      message: "导入失败：文件格式不正确，应为导出的 JSON 数组。",
    };
  }

  const entries = rawEntries
    .map((item) => normalizeEntry(item))
    .filter((entry): entry is JournalEntry => entry !== null);

  if (entries.length === 0) {
    return {
      ok: false as const,
      message: "导入失败：文件中没有可恢复的有效记录。",
    };
  }

  return {
    ok: true as const,
    entries: dedupeEntries(entries),
  };
}

export function createEmptyEntry(date: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    date,
    tags: [],
    answers: blankAnswers(),
    createdAt: now,
    updatedAt: now,
  };
}

export function readStore(): JournalStore {
  if (typeof window === "undefined") {
    return { entries: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { entries: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<JournalStore>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(normalizeEntry).filter((entry): entry is JournalEntry => entry !== null)
      : [];

    return { entries: sortEntries(entries) };
  } catch {
    return { entries: [] };
  }
}

export function writeStore(store: JournalStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ entries: dedupeEntries(store.entries) }),
  );
}

export function importEntriesJson(content: string, strategy: ImportStrategy): ImportResult {
  if (typeof window === "undefined") {
    return {
      ok: false,
      message: "导入失败：当前环境不支持浏览器本地恢复。",
    };
  }

  const parsed = parseImportEntries(content);
  if (!parsed.ok) {
    return parsed;
  }

  const currentEntries = readStore().entries;
  const nextEntries =
    strategy === "overwrite"
      ? parsed.entries
      : dedupeEntries([...currentEntries, ...parsed.entries]);

  writeStore({ entries: nextEntries });

  return {
    ok: true,
    importedCount: parsed.entries.length,
    totalCount: nextEntries.length,
    strategy,
  };
}

export function getEntryByDate(date: string): JournalEntry {
  const store = readStore();
  return store.entries.find((entry) => entry.date === date) ?? createEmptyEntry(date);
}

export function saveEntry(entry: JournalEntry) {
  const store = readStore();
  const current = store.entries.find((item) => item.date === entry.date);
  const nextEntry: JournalEntry = {
    ...entry,
    tags: normalizeTags(entry.tags),
    answers: normalizeAnswers(entry.answers),
    createdAt: current?.createdAt ?? entry.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const filtered = store.entries.filter((item) => item.date !== entry.date);
  writeStore({ entries: [nextEntry, ...filtered] });
  return nextEntry;
}

export function searchEntries(keyword: string) {
  const store = readStore();
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return store.entries;
  }

  return store.entries.filter((entry) => {
    const haystack = [entry.date, entry.tags.join(" "), ...Object.values(entry.answers)]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function exportEntryMarkdown(entry: JournalEntry) {
  const lines = [
    `# ${entry.date} 道痕`,
    "",
    `- 标签：${entry.tags.length ? entry.tags.join(" / ") : "未设置"}`,
    `- 创建时间：${entry.createdAt}`,
    `- 更新时间：${entry.updatedAt}`,
    "",
  ];

  for (const question of QUESTIONS) {
    lines.push(`## ${question.label}`);
    lines.push("");
    lines.push(entry.answers[question.id] || "（空）");
    lines.push("");
  }

  return lines.join("\n");
}

export function exportAllEntriesJson() {
  return JSON.stringify(readStore().entries, null, 2);
}

export function downloadFile(filename: string, content: string, type: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function formatDisplayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${month} 月 ${day} 日`;
}

export function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStorageKey() {
  return STORAGE_KEY;
}
