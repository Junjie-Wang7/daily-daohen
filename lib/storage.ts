import { QUESTIONS } from "@/lib/questions";
import { JournalEntry, JournalStore, QuestionId } from "@/lib/types";

const STORAGE_KEY = "daily-daohen-store";
export const MAX_IMPORT_FILE_SIZE_BYTES = 1024 * 1024;

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

export type ImportPreviewResult =
  | {
      ok: true;
      entries: JournalEntry[];
      summary: {
        totalRecords: number;
        newRecords: number;
        duplicateDates: number;
        replacedRecords: number;
        finalTotal: number;
      };
      conflicts: Array<{
        date: string;
        localUpdatedAt: string;
        importUpdatedAt: string;
        resolution: string;
      }>;
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

export function mergeJournalEntries(entries: JournalEntry[]) {
  return dedupeEntries(entries);
}

function parseImportEntries(content: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false as const,
      message: "恢复失败：这个备份文件无法读取。",
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
      message: "恢复失败：这个文件不像“每日道痕”的备份。",
    };
  }

  const entries = rawEntries
    .map((item) => normalizeEntry(item))
    .filter((entry): entry is JournalEntry => entry !== null);

  if (entries.length === 0) {
    return {
      ok: false as const,
      message: "恢复失败：没有找到可以恢复的记录。",
    };
  }

  return {
    ok: true as const,
    entries: dedupeEntries(entries),
  };
}

export function validateImportFile(fileName: string, fileSize: number) {
  if (!fileName.toLowerCase().endsWith(".json")) {
    return {
      ok: false as const,
      message: "无法恢复：请选择从“每日道痕”备份出的文件。",
    };
  }

  if (fileSize > MAX_IMPORT_FILE_SIZE_BYTES) {
    return {
      ok: false as const,
      message: `无法恢复：备份文件过大，当前仅支持不超过 ${Math.floor(
        MAX_IMPORT_FILE_SIZE_BYTES / 1024 / 1024,
      )} MB 的备份文件。`,
    };
  }

  return { ok: true as const };
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

export function restoreEntries(entries: JournalEntry[]) {
  writeStore({ entries });
}

export function clearAllEntries() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: [] }));
}

export function previewImportJson(
  content: string,
  strategy: ImportStrategy,
): ImportPreviewResult {
  if (typeof window === "undefined") {
    return {
      ok: false,
      message: "恢复失败：当前环境不支持浏览器本地恢复。",
    };
  }

  const parsed = parseImportEntries(content);
  if (!parsed.ok) {
    return parsed;
  }

  const currentEntries = readStore().entries;
  const currentMap = new Map(currentEntries.map((entry) => [entry.date, entry]));
  const currentDates = new Set(currentEntries.map((entry) => entry.date));
  const duplicateDates = parsed.entries.filter((entry) => currentDates.has(entry.date)).length;
  const newRecords = parsed.entries.length - duplicateDates;
  const finalTotal =
    strategy === "overwrite"
      ? parsed.entries.length
      : dedupeEntries([...currentEntries, ...parsed.entries]).length;
  const conflicts = parsed.entries
    .filter((entry) => currentDates.has(entry.date))
    .map((entry) => {
      const localEntry = currentMap.get(entry.date)!;
      const keepImported = timestampValue(entry.updatedAt) >= timestampValue(localEntry.updatedAt);

      return {
        date: entry.date,
        localUpdatedAt: localEntry.updatedAt,
        importUpdatedAt: entry.updatedAt,
        resolution:
          strategy === "overwrite"
            ? "将覆盖当前记录"
            : keepImported
              ? "将按更新时间保留备份中的较新记录"
              : "将按更新时间保留当前浏览器中的较新记录",
      };
    });

  return {
    ok: true,
    entries: parsed.entries,
    strategy,
    summary: {
      totalRecords: parsed.entries.length,
      newRecords,
      duplicateDates,
      replacedRecords: strategy === "overwrite" ? currentEntries.length : 0,
      finalTotal,
    },
    conflicts,
  };
}

export function importEntriesJson(content: string, strategy: ImportStrategy): ImportResult {
  const preview = previewImportJson(content, strategy);
  if (!preview.ok) {
    return preview;
  }

  const nextEntries =
    strategy === "overwrite"
      ? preview.entries
      : dedupeEntries([...readStore().entries, ...preview.entries]);

  writeStore({ entries: nextEntries });

  return {
    ok: true,
    importedCount: preview.entries.length,
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
