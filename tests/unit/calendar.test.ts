import { describe, expect, it } from "vitest";
import {
  buildMonthCalendar,
  getAdjacentMonth,
  getCalendarDayPreview,
  getMonthSummary,
  getRecentStreakDays,
  getRecentStreakInfo,
  getTopTags,
} from "@/lib/calendar";
import { createEmptyEntry } from "@/lib/storage";

function makeEntry(date: string, tags: string[], stone: string, answers: Partial<Record<string, string>> = {}) {
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

describe("calendar helpers", () => {
  it("builds a month grid with leading and trailing cells", () => {
    const cells = buildMonthCalendar("2026-04", [makeEntry("2026-04-10", [], "主石头")], new Date(2026, 3, 10));

    expect(cells.length % 7).toBe(0);
    expect(cells.some((cell) => cell.date === "2026-04-10" && cell.hasRecord)).toBe(true);
    expect(cells.some((cell) => cell.date === "2026-04-10" && cell.isToday)).toBe(true);
  });

  it("returns adjacent months", () => {
    expect(getAdjacentMonth("2026-04", -1)).toBe("2026-03");
    expect(getAdjacentMonth("2026-04", 1)).toBe("2026-05");
  });

  it("counts recent consecutive record days ending today", () => {
    const referenceDate = new Date(2026, 3, 10);
    const entries = [makeEntry("2026-04-10", [], ""), makeEntry("2026-04-09", [], ""), makeEntry("2026-04-08", [], "")];

    expect(getRecentStreakDays(entries, referenceDate)).toBe(3);
    expect(getRecentStreakInfo(entries, referenceDate)).toEqual({
      days: 3,
      startDate: "2026-04-08",
      endDate: "2026-04-10",
    });
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

    const summary = getMonthSummary("2026-04", entries, new Date(2026, 3, 10));

    expect(summary.recordDays).toBe(3);
    expect(summary.recentStreak).toBe(0);
    expect(summary.topTags[0]).toEqual({ tag: "工作", count: 3 });
  });

  it("creates a gentle preview for a day with a record", () => {
    const entry = makeEntry("2026-04-10", ["工作", "复盘"], "今天先稳住", {
      event: "今天先稳住局面，再慢慢看清发生了什么。",
      thought: "其实我想要的是被理解。",
    });

    expect(getCalendarDayPreview(entry, entry.date)).toEqual({
      date: "2026-04-10",
      hasRecord: true,
      title: "今天先稳住",
      summary: "今天先稳住局面，再慢慢看清发生了什么。",
      tags: ["工作", "复盘"],
      tagLabel: "#工作 #复盘",
      emptyMessage: "",
    });
  });

  it("creates a gentle empty preview for a day without a record", () => {
    expect(getCalendarDayPreview(undefined, "2026-04-11")).toEqual({
      date: "2026-04-11",
      hasRecord: false,
      title: "这一天还没有留下道痕",
      summary: "可以先写下今天，再回来慢慢看。",
      tags: [],
      tagLabel: "暂无标签",
      emptyMessage: "这一天还没有留下道痕",
    });
  });
});
