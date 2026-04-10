import { describe, expect, it } from "vitest";
import { filterEntriesByRange, getReviewSummary, getTopStones } from "@/lib/review";
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

  it("counts top stones and ignores blank stones", () => {
    const entries = [
      makeEntry("2026-04-10", "先暂停"),
      makeEntry("2026-04-09", "先暂停"),
      makeEntry("2026-04-08", "先确认"),
      makeEntry("2026-04-07", " "),
    ];

    expect(getTopStones(entries)).toEqual([
      { stone: "先暂停", count: 2 },
      { stone: "先确认", count: 1 },
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
});
