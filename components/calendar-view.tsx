"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buildMonthCalendar,
  formatMonthLabel,
  getAdjacentMonth,
  getMonthSummary,
  getRecentStreakInfo,
} from "@/lib/calendar";
import { readStore } from "@/lib/storage";

function toMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarView() {
  const [mounted, setMounted] = useState(false);
  const [month, setMonth] = useState("");
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

  if (!mounted) {
    return (
      <div className="section-card px-5 py-10 text-sm leading-7 text-ink/65 md:px-8">正在准备月历视图…</div>
    );
  }

  const summary = getMonthSummary(month, entries);
  const streakInfo = getRecentStreakInfo(entries);
  const cells = buildMonthCalendar(month, entries);
  const weekLabels = ["日", "一", "二", "三", "四", "五", "六"];

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
              <button type="button" onClick={() => setMonth(getAdjacentMonth(month, -1))} className="soft-button">
                上个月
              </button>
              <button type="button" onClick={() => setMonth(toMonthString(new Date()))} className="soft-button">
                本月
              </button>
              <button type="button" onClick={() => setMonth(getAdjacentMonth(month, 1))} className="soft-button">
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
                  <p>本月暂无标签</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="px-4 py-5 md:px-6 md:py-6">
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

              return (
                <Link
                  key={cell.date}
                  href={`/records/${cell.date}`}
                  data-testid={`calendar-day-${cell.date}`}
                  aria-label={`查看 ${cell.date}`}
                  aria-current={cell.isToday ? "date" : undefined}
                  className={`min-h-20 rounded-3xl border px-2 py-2 text-left transition hover:border-accent/70 hover:bg-white ${inMonthStyle} ${recordStyle} ${todayStyle}`}
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
                      {cell.entry?.answers.stone || cell.entry?.answers.event || "有记录"}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
