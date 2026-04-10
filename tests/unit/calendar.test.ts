import { describe, expect, it } from "vitest";
import {
  buildMonthCalendar,
  getAdjacentMonth,
  getMonthSummary,
  getRecentStreakDays,
  getTopTags,
} from "@/lib/calendar";
import { createEmptyEntry } from "@/lib/storage";

function makeEntry(date: string, tags: string[], stone: string) {
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

describe("calendar helpers", () => {
  it("builds a month grid with leading and trailing cells", () => {
    const cells = buildMonthCalendar("2026-04", [makeEntry("2026-04-10", [], "主石头")]);

    expect(cells.length % 7).toBe(0);
    expect(cells.some((cell) => cell.date === "2026-04-10" && cell.hasRecord)).toBe(true);
  });

  it("returns adjacent months", () => {
    expect(getAdjacentMonth("2026-04", -1)).toBe("2026-03");
    expect(getAdjacentMonth("2026-04", 1)).toBe("2026-05");
  });

  it("counts recent consecutive record days ending today", () => {
    const today = new Date();
    const format = (offset: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() - offset);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`;
    };

    const entries = [makeEntry(format(0), [], ""), makeEntry(format(1), [], ""), makeEntry(format(2), [], "")];

    expect(getRecentStreakDays(entries)).toBe(3);
    expect(getRecentStreakDays([makeEntry(format(0), [], "")])).toBe(1);
  });

  it("returns top tags for a month", () => {
    const entries = [
      makeEntry("2026-04-01", ["工作", "关系"], "A"),
      makeEntry("2026-04-02", ["工作"], "B"),
      makeEntry("2026-04-03", ["工作", "复盘", "复盘"], "C"),
      makeEntry("2026-03-31", ["忽略"], "D"),
    ];

    expect(getTopTags(entries)).toEqual([
      { tag: "工作", count: 3 },
      { tag: "复盘", count: 2 },
      { tag: "关系", count: 1 },
    ]);
  });

  it("summarizes the current month only", () => {
    const entries = [
      makeEntry("2026-04-01", ["工作", "复盘"], "A"),
      makeEntry("2026-04-02", ["工作"], "B"),
      makeEntry("2026-04-03", ["工作"], "C"),
      makeEntry("2026-03-31", ["忽略"], "D"),
    ];

    const summary = getMonthSummary("2026-04", entries);

    expect(summary.recordDays).toBe(3);
    expect(summary.topTags[0]).toEqual({ tag: "工作", count: 3 });
  });
});
