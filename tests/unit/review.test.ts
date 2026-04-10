import { describe, expect, it } from "vitest";
import {
  extractReviewKeywords,
  filterEntriesByRange,
  filterEntriesByReview,
  getReviewEmptyMessage,
  getReviewSummary,
  getTopKeywords,
  getTopStones,
} from "@/lib/review";
import { createEmptyEntry } from "@/lib/storage";

function makeEntry(date: string, stone: string, tags: string[] = [], answers?: Partial<Record<"event" | "thought" | "fear" | "stone", string>>) {
  return {
    ...createEmptyEntry(date),
    tags,
    answers: {
      event: "",
      reaction: "",
      thought: "",
      fear: "",
      reason: "",
      stone,
      choice: "",
      ...answers,
    },
  };
}

describe("review helpers", () => {
  const referenceDate = new Date(2026, 3, 10);

  it("filters entries by time range", () => {
    const entries = [
      makeEntry("2026-04-10", "A"),
      makeEntry("2026-04-06", "B"),
      makeEntry("2026-03-11", "C"),
    ];

    expect(filterEntriesByRange(entries, "7d", referenceDate)).toEqual([
      expect.objectContaining({ date: "2026-04-10" }),
      expect.objectContaining({ date: "2026-04-06" }),
    ]);
    expect(filterEntriesByRange(entries, "30d", referenceDate)).toHaveLength(2);
    expect(filterEntriesByRange(entries, "all", referenceDate)).toHaveLength(3);
  });

  it("extracts lightweight keywords from the main answers", () => {
    const entry = makeEntry("2026-04-10", "先暂停", [], {
      event: "我先想解释自己，别急着下结论。",
      thought: "其实我担心被误解。",
      fear: "我害怕关系变得紧张。",
      stone: "主石头是先暂停，不急着回应。",
    });

    expect(extractReviewKeywords(entry)).toEqual([
      "解释自己",
      "急着下结论",
      "担心被误解",
      "害怕关系变得紧张",
      "暂停",
      "不急着回应",
    ]);
  });

  it("deduplicates and ranks keywords by frequency then recency", () => {
    const entries = [
      makeEntry("2026-04-10", "A", [], {
        event: "先暂停，先暂停。",
        thought: "先确认事实。",
      }),
      makeEntry("2026-04-09", "B", [], {
        event: "先暂停。",
      }),
      makeEntry("2026-04-08", "C", [], {
        event: "关系变得紧张。",
      }),
    ];

    expect(getTopKeywords(entries, 3)).toEqual([
      { keyword: "暂停", count: 2 },
      { keyword: "确认事实", count: 1 },
      { keyword: "关系变得紧张", count: 1 },
    ]);
  });

  it("counts representative top stones and ignores blank stones", () => {
    const entries = [
      makeEntry("2026-04-10", "先暂停"),
      makeEntry("2026-04-09", "先暂停"),
      makeEntry("2026-04-08", "先确认"),
      makeEntry("2026-04-07", "先确认"),
      makeEntry("2026-04-06", " "),
    ];

    expect(getTopStones(entries)).toEqual([
      { stone: "先暂停", count: 2 },
      { stone: "先确认", count: 2 },
    ]);
  });

  it("summarizes a review range and applies keyword filters", () => {
    const entries = [
      makeEntry("2026-04-10", "先暂停", ["工作"], {
        event: "我先想解释自己。",
        thought: "其实我担心被误解。",
        fear: "我害怕关系变得紧张。",
      }),
      makeEntry("2026-04-09", "先暂停", ["工作", "复盘"], {
        event: "我先想解释自己。",
        thought: "我害怕关系变得紧张。",
        fear: "先确认事实。",
      }),
      makeEntry("2026-04-06", "先观察", ["工作"], {
        event: "先确认事实。",
        thought: "关系变得紧张。",
        fear: "我先想解释自己。",
      }),
      makeEntry("2026-03-11", "更早", ["忽略"]),
    ];

    const summary = getReviewSummary(entries, "7d", referenceDate);

    expect(summary.recordCount).toBe(3);
    expect(summary.recentStreak).toBe(2);
    expect(summary.topTags[0]).toEqual({ tag: "工作", count: 3 });
    expect(summary.topStones[0]).toEqual({ stone: "先暂停", count: 2 });
    expect(summary.topKeywords[0]).toEqual({ keyword: "解释自己", count: 3 });

    expect(
      filterEntriesByReview(entries, "7d", { tag: null, stone: null, keyword: "暂停" }, referenceDate),
    ).toHaveLength(2);
    expect(
      filterEntriesByReview(entries, "7d", { tag: "复盘", stone: null, keyword: "暂停" }, referenceDate),
    ).toHaveLength(1);
  });

  it("shows friendlier empty messages", () => {
    expect(getReviewEmptyMessage("7d", true)).toContain("最近 7 天");
    expect(getReviewEmptyMessage("30d", true)).toContain("最近 30 天");
    expect(getReviewEmptyMessage("all", false)).toContain("还没有留下道痕");
  });
});
