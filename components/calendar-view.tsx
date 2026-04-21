"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildMonthCalendar,
  formatMonthLabel,
  getAdjacentMonth,
  getCalendarDayPreview,
  getMonthSummary,
  getRecentStreakInfo,
} from "@/lib/calendar";
import { getRecordHref } from "@/lib/routes";
import { formatDisplayDate, readStore, todayDateString } from "@/lib/storage";

function toMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarView() {
  const [mounted, setMounted] = useState(false);
  const [month, setMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [entries, setEntries] = useState(() => readStore().entries);

  useEffect(() => {
    setMounted(true);
    setMonth(toMonthString(new Date()));
    setEntries(readStore().entries);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setEntries(readStore().entries);
  }, [mounted, month]);

  const cells = useMemo(() => (mounted ? buildMonthCalendar(month, entries) : []), [entries, mounted, month]);
  const selectedCell = useMemo(
    () => cells.find((cell) => cell.date === selectedDate) ?? null,
    [cells, selectedDate],
  );
  const selectedPreview = useMemo(
    () => (selectedCell ? getCalendarDayPreview(selectedCell.entry, selectedCell.date) : null),
    [selectedCell],
  );

  if (!mounted) {
    return (
      <div className="section-card px-5 py-10 text-sm leading-7 text-ink/65 md:px-8">
        正在准备月历视图……
      </div>
    );
  }

  const summary = getMonthSummary(month, entries);
  const streakInfo = getRecentStreakInfo(entries);
  const weekLabels = ["日", "一", "二", "三", "四", "五", "六"];

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleClosePreview = () => {
    setSelectedDate("");
  };

  const changeMonth = (offset: number) => {
    setMonth(getAdjacentMonth(month, offset));
    setSelectedDate("");
  };

  return (
    <div className="space-y-6">
      <section className="section-card">
        <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-accent/80">MONTH</p>
              <h2 className="font-serif text-2xl">{formatMonthLabel(month)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} className="soft-button">
                上个月
              </button>
              <button type="button" onClick={() => setMonth(toMonthString(new Date()))} className="soft-button">
                本月
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="soft-button">
                下个月
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">本月记录天数</p>
              <p className="mt-2 font-serif text-3xl text-ink">{summary.recordDays}</p>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">最近连续记录</p>
              <p className="mt-2 font-serif text-3xl text-ink">{summary.recentStreak}</p>
              <p className="mt-2 text-sm leading-6 text-ink/70" data-testid="streak-detail">
                {streakInfo
                  ? `最近连续记录：${streakInfo.days} 天（${streakInfo.startDate} 至 ${streakInfo.endDate}）`
                  : "最近连续记录：0 天"}
              </p>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">最常见标签</p>
              <div className="mt-3 space-y-1 text-sm text-ink/75">
                {summary.topTags.length ? (
                  summary.topTags.map((item, index) => (
                    <p key={item.tag}>
                      {index + 1}. #{item.tag} · {item.count} 次
                    </p>
                  ))
                ) : (
                  <p>本月还没有标签</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="px-4 py-5 md:px-6 md:py-6 lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:gap-6">
          <div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs tracking-[0.2em] text-accent/70">
              {weekLabels.map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((cell) => {
                const inMonthStyle = cell.inMonth ? "text-ink" : "text-ink/35";
                const recordStyle = cell.hasRecord
                  ? "border-accent/60 bg-rice shadow-[0_0_0_1px_rgba(133,114,92,0.08)]"
                  : "border-line/70 bg-white/50";
                const todayStyle = cell.isToday
                  ? "ring-1 ring-accent/35 ring-offset-1 ring-offset-background"
                  : "";
                const previewStyle = selectedDate === cell.date
                  ? "border-accent/75 bg-white shadow-[0_10px_24px_rgba(133,114,92,0.12)]"
                  : "";

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => handleSelectDate(cell.date)}
                    data-testid={`calendar-day-${cell.date}`}
                    aria-label={`查看 ${cell.date}`}
                    aria-current={cell.isToday ? "date" : undefined}
                    className={`min-h-20 rounded-3xl border px-2 py-2 text-left transition hover:border-accent/70 hover:bg-white ${inMonthStyle} ${recordStyle} ${todayStyle} ${previewStyle}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{Number(cell.date.slice(-2))}</span>
                      {cell.hasRecord ? <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                    </div>
                    {cell.isToday ? (
                      <span className="mt-2 inline-flex rounded-full border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-[10px] leading-none text-accent">
                        今天
                      </span>
                    ) : null}
                    {cell.hasRecord ? (
                      <p className="mt-2 overflow-hidden text-[11px] leading-5 text-ink/75">
                        {cell.entry?.answers.stone.trim() || cell.entry?.answers.event.trim() || "已有记录"}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-6 text-ink/55">
              点击日期先轻轻看一眼，再决定是否进入详情。
            </p>
          </div>

          <aside className="mt-6 lg:mt-0" aria-live="polite" data-testid="calendar-preview">
            {selectedPreview && selectedCell ? (
              <div className="rounded-[28px] border border-line/70 bg-white/70 px-4 py-5 shadow-[0_12px_32px_rgba(83,63,45,0.06)]">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-[0.25em] text-accent/75">预览</p>
                      <h3 className="mt-1 font-serif text-xl text-ink">{formatDisplayDate(selectedPreview.date)}</h3>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] leading-none ${
                        selectedPreview.hasRecord
                          ? "border-accent/20 bg-accent/5 text-accent"
                          : "border-line/70 bg-white/70 text-ink/50"
                      }`}
                    >
                      {selectedPreview.hasRecord ? "有记录" : "未留痕"}
                    </span>
                  </div>

                  {selectedPreview.hasRecord ? (
                    <>
                      <div className="space-y-2 rounded-2xl border border-line/60 bg-white/70 px-3 py-3">
                        <p className="text-sm leading-7 text-ink">{selectedPreview.title}</p>
                        <p className="text-xs leading-6 text-ink/60">{selectedPreview.summary}</p>
                      </div>
                      <p className="text-sm leading-7 text-ink/70">{selectedPreview.tagLabel}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href={getRecordHref(selectedPreview.date)} className="soft-button-primary">
                          查看当天详情
                        </Link>
                        <button type="button" onClick={handleClosePreview} className="soft-button">
                          关闭预览
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm leading-7 text-ink/70">
                        这一天还没有留下道痕。你可以先写下今天，再回来查看这一格。
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href={getRecordHref(selectedPreview.date)} className="soft-button-primary">
                          {selectedPreview.date === todayDateString() ? "去写今天" : "前往当天记录页"}
                        </Link>
                        <button type="button" onClick={handleClosePreview} className="soft-button">
                          关闭预览
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-line/70 bg-white/55 px-4 py-5 text-sm leading-7 text-ink/60">
                先点开某一天，月历会安静地给你看一眼当天留下的痕迹。
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
