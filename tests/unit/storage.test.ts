import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllEntries,
  createEmptyEntry,
  exportAllEntriesJson,
  exportEntryMarkdown,
  getStorageKey,
  importEntriesJson,
  MAX_IMPORT_FILE_SIZE_BYTES,
  previewImportJson,
  readStore,
  saveEntry,
  searchEntries,
  validateImportFile,
} from "@/lib/storage";

type StorageMap = Map<string, string>;

function createLocalStorageMock(seed?: StorageMap) {
  const store = seed ?? new Map<string, string>();

  return {
    store,
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

beforeEach(() => {
  const localStorage = createLocalStorageMock();

  vi.stubGlobal("window", {
    localStorage,
    setTimeout,
    URL: {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    },
  });

  vi.stubGlobal("document", {
    body: {
      appendChild: vi.fn(),
    },
    createElement: vi.fn(() => ({
      href: "",
      download: "",
      click: vi.fn(),
      remove: vi.fn(),
    })),
  });
});

describe("storage helpers", () => {
  it("returns an empty store when localStorage has no data", () => {
    expect(readStore()).toEqual({ entries: [] });
  });

  it("returns an empty store for invalid JSON", () => {
    window.localStorage.setItem(getStorageKey(), "{broken");

    expect(readStore()).toEqual({ entries: [] });
  });

  it("filters invalid entries and normalizes missing fields", () => {
    window.localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        entries: [
          {
            date: "2026-04-10",
            tags: ["工作", 12, ""],
            answers: { event: "起波澜" },
          },
          {
            date: "bad-date",
            tags: "oops",
            answers: null,
          },
        ],
      }),
    );

    const store = readStore();

    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].tags).toEqual(["工作"]);
    expect(store.entries[0].answers.event).toBe("起波澜");
    expect(store.entries[0].answers.choice).toBe("");
    expect(store.entries[0].createdAt).toBeTruthy();
    expect(store.entries[0].updatedAt).toBeTruthy();
  });

  it("normalizes tags and answers when saving", () => {
    const entry = createEmptyEntry("2026-04-10");

    const saved = saveEntry({
      ...entry,
      tags: ["工作", "", "关系"] as unknown as string[],
      answers: {
        ...entry.answers,
        event: "今天起了波澜",
        fear: 42 as unknown as string,
      },
    });

    expect(saved.tags).toEqual(["工作", "关系"]);
    expect(saved.answers.event).toBe("今天起了波澜");
    expect(saved.answers.fear).toBe("");
  });

  it("clears all entries while preserving the storage shape", () => {
    saveEntry({
      ...createEmptyEntry("2026-04-10"),
      answers: {
        event: "需要被清空",
        reaction: "",
        thought: "",
        fear: "",
        reason: "",
        stone: "",
        choice: "",
      },
    });

    clearAllEntries();

    expect(readStore()).toEqual({ entries: [] });
    expect(window.localStorage.getItem(getStorageKey())).toBe(JSON.stringify({ entries: [] }));
  });
});

describe("search and export", () => {
  beforeEach(() => {
    const entry = createEmptyEntry("2026-04-10");
    saveEntry({
      ...entry,
      tags: ["工作", "关系"],
      answers: {
        ...entry.answers,
        event: "今天和同事起了波澜",
        stone: "看见自己的防御",
      },
    });
  });

  it("searches by date, tag, and answer content", () => {
    expect(searchEntries("2026-04-10")).toHaveLength(1);
    expect(searchEntries("工作")).toHaveLength(1);
    expect(searchEntries("防御")).toHaveLength(1);
    expect(searchEntries("不存在")).toHaveLength(0);
  });

  it("exports markdown with stable structure", () => {
    const [entry] = readStore().entries;
    const markdown = exportEntryMarkdown(entry);

    expect(markdown.startsWith("# 2026-04-10 道痕")).toBe(true);
    expect((markdown.match(/^## /gm) || []).length).toBe(7);
    expect(markdown).toContain("标签：工作 / 关系");
  });

  it("exports all entries as recoverable json", () => {
    const json = exportAllEntriesJson();
    const parsed = JSON.parse(json) as Array<{ date: string; tags: string[] }>;

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].date).toBe("2026-04-10");
    expect(parsed[0].tags).toEqual(["工作", "关系"]);
  });
});

describe("import preview and import", () => {
  beforeEach(() => {
    saveEntry({
      ...createEmptyEntry("2026-04-10"),
      answers: {
        event: "本地旧记录",
        reaction: "",
        thought: "",
        fear: "",
        reason: "",
        stone: "",
        choice: "",
      },
    });
  });

  it("creates merge preview statistics", () => {
    const preview = previewImportJson(
      JSON.stringify([
        {
          date: "2026-04-10",
          tags: ["导入"],
          answers: {
            event: "重复日期",
            reaction: "",
            thought: "",
            fear: "",
            reason: "",
            stone: "",
            choice: "",
          },
          createdAt: "2026-04-10T08:00:00.000Z",
          updatedAt: "2099-04-10T08:30:00.000Z",
        },
        {
          date: "2026-04-09",
          tags: ["新增"],
          answers: {
            event: "新增记录",
            reaction: "",
            thought: "",
            fear: "",
            reason: "",
            stone: "",
            choice: "",
          },
          createdAt: "2026-04-09T08:00:00.000Z",
          updatedAt: "2026-04-09T08:30:00.000Z",
        },
      ]),
      "merge",
    );

    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.summary.totalRecords).toBe(2);
      expect(preview.summary.newRecords).toBe(1);
      expect(preview.summary.duplicateDates).toBe(1);
      expect(preview.summary.finalTotal).toBe(2);
      expect(preview.summary.replacedRecords).toBe(0);
      expect(preview.conflicts).toHaveLength(1);
      expect(preview.conflicts[0].date).toBe("2026-04-10");
      expect(preview.conflicts[0].resolution).toContain("导入记录");
    }
  });

  it("creates overwrite preview statistics", () => {
    const preview = previewImportJson(
      JSON.stringify([
        {
          date: "2026-04-09",
          tags: ["覆盖"],
          answers: {
            event: "覆盖后记录",
            reaction: "",
            thought: "",
            fear: "",
            reason: "",
            stone: "",
            choice: "",
          },
          createdAt: "2026-04-09T08:00:00.000Z",
          updatedAt: "2026-04-09T08:30:00.000Z",
        },
      ]),
      "overwrite",
    );

    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.summary.totalRecords).toBe(1);
      expect(preview.summary.newRecords).toBe(1);
      expect(preview.summary.duplicateDates).toBe(0);
      expect(preview.summary.replacedRecords).toBe(1);
      expect(preview.summary.finalTotal).toBe(1);
      expect(preview.conflicts).toEqual([]);
    }
  });

  it("lists conflict details for overwrite preview", () => {
    const preview = previewImportJson(
      JSON.stringify([
        {
          date: "2026-04-10",
          tags: ["覆盖"],
          answers: {
            event: "覆盖本地",
            reaction: "",
            thought: "",
            fear: "",
            reason: "",
            stone: "",
            choice: "",
          },
          createdAt: "2026-04-10T08:00:00.000Z",
          updatedAt: "2026-04-10T08:30:00.000Z",
        },
      ]),
      "overwrite",
    );

    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.conflicts).toHaveLength(1);
      expect(preview.conflicts[0].resolution).toBe("将覆盖本地记录");
    }
  });

  it("imports a valid exported json array", () => {
    const result = importEntriesJson(
      JSON.stringify([
        {
          date: "2026-04-09",
          tags: ["复盘"],
          answers: {
            event: "昨天起波澜",
            reaction: "",
            thought: "",
            fear: "",
            reason: "",
            stone: "",
            choice: "",
          },
          createdAt: "2026-04-09T08:00:00.000Z",
          updatedAt: "2026-04-09T08:30:00.000Z",
        },
      ]),
      "overwrite",
    );

    expect(result.ok).toBe(true);
    expect(readStore().entries).toHaveLength(1);
    expect(readStore().entries[0].date).toBe("2026-04-09");
  });

  it("rejects invalid json content", () => {
    const preview = previewImportJson("{bad", "merge");

    expect(preview).toEqual({
      ok: false,
      message: "导入失败：文件不是合法的 JSON。",
    });
  });

  it("rejects invalid structure", () => {
    const preview = previewImportJson(JSON.stringify({ bad: [] }), "merge");

    expect(preview).toEqual({
      ok: false,
      message: "导入失败：JSON 结构不符合要求，应为导出的 JSON 数组。",
    });
  });

  it("rejects empty data", () => {
    const preview = previewImportJson("[]", "merge");

    expect(preview).toEqual({
      ok: false,
      message: "导入失败：文件中没有可恢复的有效记录。",
    });
  });

  it("rejects non-json file names", () => {
    const validation = validateImportFile("records.txt", 10);

    expect(validation).toEqual({
      ok: false,
      message: "无法导入：请选择 .json 格式的文件。",
    });
  });

  it("rejects files that exceed the size limit", () => {
    const validation = validateImportFile("records.json", MAX_IMPORT_FILE_SIZE_BYTES + 1);

    expect(validation).toEqual({
      ok: false,
      message: "无法导入：文件大小超过限制，当前仅支持不超过 1 MB 的 JSON 文件。",
    });
  });
});
