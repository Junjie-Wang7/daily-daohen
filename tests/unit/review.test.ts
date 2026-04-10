import { describe, expect, it } from "vitest";
import {
  filterEntriesByRange,
  filterEntriesByReview,
  getReviewEmptyMessage,
  getReviewSummary,
  getTopStones,
} from "@/lib/review";
import { createEmptyEntry } from "@/lib/storage";

function makeEntry(date: string, stone: string, tags: string[] = []) {
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

  it("filters entries by review chips", () => {
    const entries = [
      makeEntry("2026-04-10", "先暂停", ["工作", "复盘"]),
      makeEntry("2026-04-09", "先暂停", ["工作"]),
      makeEntry("2026-04-08", "先确认", ["关系"]),
    ];

    expect(
      filterEntriesByReview(entries, "all", { tag: "工作", stone: null }, referenceDate),
    ).toHaveLength(2);
    expect(
      filterEntriesByReview(entries, "all", { tag: null, stone: "先暂停" }, referenceDate),
    ).toHaveLength(2);
    expect(
      filterEntriesByReview(entries, "all", { tag: "关系", stone: "先暂停" }, referenceDate),
    ).toHaveLength(0);
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

  it("summarizes a review range", () => {
    const entries = [
      makeEntry("2026-04-10", "先暂停", ["工作"]),
      makeEntry("2026-04-09", "先暂停", ["工作", "复盘"]),
      makeEntry("2026-04-06", "先观察", ["工作"]),
      makeEntry("2026-03-11", "更早", ["忽略"]),
    ];

    const summary = getReviewSummary(entries, "7d", referenceDate);

    expect(summary.recordCount).toBe(3);
    expect(summary.recentStreak).toBe(2);
    expect(summary.topTags[0]).toEqual({ tag: "工作", count: 3 });
    expect(summary.topStones[0]).toEqual({ stone: "先暂停", count: 2 });
  });

  it("shows friendlier empty messages", () => {
    expect(getReviewEmptyMessage("7d", true)).toContain("最近 7 天");
    expect(getReviewEmptyMessage("30d", true)).toContain("最近 30 天");
    expect(getReviewEmptyMessage("all", false)).toContain("还没有任何记录");
  });
});
