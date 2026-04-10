import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllEntries,
  createEmptyEntry,
  exportAllEntriesJson,
  exportEntryMarkdown,
  getStorageKey,
  importEntriesJson,
  readStore,
  saveEntry,
  searchEntries,
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

describe("json import", () => {
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
    const result = importEntriesJson("{bad", "merge");

    expect(result).toEqual({
      ok: false,
      message: "导入失败：文件不是合法的 JSON。",
    });
  });

  it("rejects empty data", () => {
    const result = importEntriesJson("[]", "merge");

    expect(result).toEqual({
      ok: false,
      message: "导入失败：文件中没有可恢复的有效记录。",
    });
  });

  it("merges duplicate dates by keeping the latest updatedAt", () => {
    saveEntry({
      ...createEmptyEntry("2026-04-10"),
      updatedAt: "2026-04-10T08:00:00.000Z",
      answers: {
        event: "旧内容",
        reaction: "",
        thought: "",
        fear: "",
        reason: "",
        stone: "",
        choice: "",
      },
    });

    const result = importEntriesJson(
      JSON.stringify([
        {
          date: "2026-04-10",
          tags: ["导入"],
          answers: {
            event: "新内容",
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
      ]),
      "merge",
    );

    expect(result.ok).toBe(true);
    expect(readStore().entries).toHaveLength(1);
    expect(readStore().entries[0].answers.event).toBe("新内容");
    expect(readStore().entries[0].tags).toEqual(["导入"]);
  });
});
