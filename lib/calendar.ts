import { JournalEntry } from "@/lib/types";

export type MonthCell = {
  date: string;
  inMonth: boolean;
  hasRecord: boolean;
  isToday: boolean;
  entry?: JournalEntry;
};

export type MonthSummary = {
  recordDays: number;
  recentStreak: number;
  topTags: Array<{ tag: string; count: number }>;
};

export type StreakRange = {
  days: number;
  startDate: string;
  endDate: string;
};

function parseMonth(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return { year, monthIndex };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateString(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatMonthLabel(month: string) {
  const { year, monthIndex } = parseMonth(month);
  return `${year} 年 ${monthIndex + 1} 月`;
}

export function getAdjacentMonth(month: string, offset: number) {
  const { year, monthIndex } = parseMonth(month);
  const date = new Date(year, monthIndex + offset, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function buildMonthCalendar(month: string, entries: JournalEntry[], referenceDate = new Date()) {
  const { year, monthIndex } = parseMonth(month);
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startOffset = firstDay.getDay();
  const endOffset = 6 - lastDay.getDay();
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const todayString = toLocalDateString(referenceDate);
  const cells: MonthCell[] = [];

  for (let i = startOffset; i > 0; i -= 1) {
    const date = new Date(year, monthIndex, 1 - i);
    const dateString = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
    const entry = byDate.get(dateString);
    cells.push({
      date: dateString,
      inMonth: false,
      hasRecord: Boolean(entry),
      isToday: dateString === todayString,
      entry,
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateString = toDateString(year, monthIndex, day);
    const entry = byDate.get(dateString);
    cells.push({
      date: dateString,
      inMonth: true,
      hasRecord: Boolean(entry),
      isToday: dateString === todayString,
      entry,
    });
  }

  for (let i = 1; i <= endOffset; i += 1) {
    const date = new Date(year, monthIndex + 1, i);
    const dateString = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
    const entry = byDate.get(dateString);
    cells.push({
      date: dateString,
      inMonth: false,
      hasRecord: Boolean(entry),
      isToday: dateString === todayString,
      entry,
    });
  }

  return cells;
}

export function getRecentStreakInfo(entries: JournalEntry[], referenceDate = new Date()): StreakRange | null {
  const recordDates = new Set(entries.map((entry) => entry.date));
  const cursor = new Date(referenceDate);
  let days = 0;
  let endDate = "";
  let startDate = "";

  while (days < 365) {
    const dateString = toLocalDateString(cursor);
    if (!recordDates.has(dateString)) {
      break;
    }

    days += 1;
    endDate = endDate || dateString;
    startDate = dateString;
    cursor.setDate(cursor.getDate() - 1);
  }

  if (!days) {
    return null;
  }

  return { days, startDate, endDate };
}

export function getRecentStreakDays(entries: JournalEntry[], referenceDate = new Date()) {
  return getRecentStreakInfo(entries, referenceDate)?.days ?? 0;
}

export function getTopTags(entries: JournalEntry[], limit = 3) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export function getMonthSummary(month: string, entries: JournalEntry[], referenceDate = new Date()): MonthSummary {
  const { year, monthIndex } = parseMonth(month);
  const currentMonthEntries = entries.filter((entry) => {
    const [entryYear, entryMonth] = entry.date.split("-").map(Number);
    return entryYear === year && entryMonth - 1 === monthIndex;
  });

  return {
    recordDays: currentMonthEntries.length,
    recentStreak: getRecentStreakDays(entries, referenceDate),
    topTags: getTopTags(currentMonthEntries),
  };
}

export function getCalendarTitle(month: string) {
  return formatMonthLabel(month);
}
