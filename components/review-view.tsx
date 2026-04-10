"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readStore } from "@/lib/storage";
import {
  filterEntriesByRange,
  filterEntriesByReview,
  formatRangeLabel,
  getReviewEmptyMessage,
  getReviewEntrySubtitle,
  getReviewEntryTitle,
  getReviewSummary,
  ReviewFilter,
  ReviewRange,
} from "@/lib/review";

const ranges: ReviewRange[] = ["7d", "30d", "all"];

function rangeLabel(range: ReviewRange) {
  return formatRangeLabel(range);
}

function filterLabel(filter: ReviewFilter) {
  if (filter.tag && filter.stone) {
    return `标签 #${filter.tag} + 主石头 ${filter.stone}`;
  }

  if (filter.tag) {
    return `标签 #${filter.tag}`;
  }

  if (filter.stone) {
    return `主石头 ${filter.stone}`;
  }

  return "";
}

export function ReviewView() {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<ReviewRange>("7d");
  const [entries, setEntries] = useState(() => readStore().entries);
  const [filters, setFilters] = useState<ReviewFilter>({ tag: null, stone: null });

  useEffect(() => {
    setMounted(true);
    setEntries(readStore().entries);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    setEntries(readStore().entries);
  }, [mounted, range]);

  const summary = useMemo(() => getReviewSummary(entries, range), [entries, range]);
  const visibleEntries = useMemo(
    () => filterEntriesByReview(entries, range, filters),
    [entries, filters, range],
  );
  const hasAnyEntries = entries.length > 0;
  const hasActiveFilter = Boolean(filters.tag || filters.stone);
  const filterMessage = hasActiveFilter ? filterLabel(filters) : "";
  const emptyMessage = hasActiveFilter
    ? "当前筛选下没有记录。可以清除筛选，或换一个标签 / 主石头再看看。"
    : getReviewEmptyMessage(range, hasAnyEntries);

  if (!mounted) {
    return (
      <div className="section-card px-5 py-10 text-sm leading-7 text-ink/65 md:px-8">正在准备回顾页…</div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="section-card">
        <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-accent/80">REVIEW</p>
              <h2 className="font-serif text-2xl">回顾页</h2>
              <p className="max-w-2xl text-sm leading-7 text-ink/70">
                在更长的时间里看见自己的记录轨迹，先留下一点安静的提示，再慢慢理解它们。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ranges.map((item) => {
                const active = item === range;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRange(item)}
                    className={active ? "soft-button-primary" : "soft-button"}
                    aria-pressed={active}
                    data-testid={`review-range-${item}`}
                  >
                    {rangeLabel(item)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">记录总数</p>
              <p className="mt-2 font-serif text-3xl text-ink">{summary.recordCount}</p>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">连续记录天数</p>
              <p className="mt-2 font-serif text-3xl text-ink">{summary.recentStreak}</p>
              <p className="mt-2 text-xs leading-6 text-ink/65" data-testid="review-streak-detail">
                {summary.streakInfo
                  ? `连续记录：${summary.streakInfo.days} 天（${summary.streakInfo.startDate} 至 ${summary.streakInfo.endDate}）`
                  : "连续记录：0 天"}
              </p>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">高频标签 Top 5</p>
              <div className="mt-3 space-y-1 text-sm text-ink/75">
                {summary.topTags.length ? (
                  summary.topTags.map((item, index) => {
                    const active = filters.tag === item.tag;
                    return (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            tag: current.tag === item.tag ? null : item.tag,
                          }))
                        }
                        className={`block w-full rounded-2xl px-2 py-1 text-left transition ${
                          active ? "bg-rice text-ink" : "hover:bg-white/70"
                        }`}
                        aria-pressed={active}
                        data-testid={`review-tag-filter-${index}`}
                      >
                        {index + 1}. #{item.tag} · {item.count} 次
                      </button>
                    );
                  })
                ) : (
                  <p>暂无标签</p>
                )}
              </div>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-white/60 px-4 py-4">
              <p className="text-xs tracking-[0.2em] text-accent/80">主石头汇总</p>
              <div className="mt-3 space-y-2 text-sm text-ink/75">
                {summary.topStones.length ? (
                  summary.topStones.map((item, index) => {
                    const active = filters.stone === item.stone;
                    return (
                      <button
                        key={item.stone}
                        type="button"
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            stone: current.stone === item.stone ? null : item.stone,
                          }))
                        }
                        className={`block w-full rounded-2xl px-2 py-1 text-left transition ${
                          active ? "bg-rice text-ink" : "hover:bg-white/70"
                        }`}
                        aria-pressed={active}
                        data-testid={`review-stone-filter-${index}`}
                      >
                        {index + 1}. {item.stone} · {item.count} 次
                      </button>
                    );
                  })
                ) : (
                  <p>暂无主石头</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-line/70 bg-white/60 px-4 py-3 text-xs leading-6 text-ink/70">
            <span>当前范围：{rangeLabel(range)}</span>
            {range === "all" ? <span>，显示全部历史记录。</span> : <span>，共 {summary.recordCount} 条记录。</span>}
            {hasActiveFilter ? <span>当前筛选：{filterMessage}</span> : null}
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => setFilters({ tag: null, stone: null })}
                className="soft-button py-1 text-xs"
                data-testid="review-clear-filter"
              >
                清除筛选
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="flex flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-accent/80">LIST</p>
              <h3 className="font-serif text-xl text-ink">当前范围内的记录</h3>
            </div>
            <p className="text-sm text-ink/65">共 {visibleEntries.length} 条</p>
          </div>

          {visibleEntries.length === 0 ? (
            <div
              className="rounded-[28px] border border-dashed border-line px-5 py-10 text-center text-sm leading-7 text-ink/65"
              data-testid="review-empty-state"
            >
              {emptyMessage}
            </div>
          ) : (
            <div className="grid gap-3" data-testid="review-list">
              {visibleEntries.map((entry) => (
                <Link
                  key={entry.date}
                  href={`/records/${entry.date}`}
                  className="rounded-[28px] border border-line/70 bg-white/60 px-5 py-5 transition hover:border-accent/50 hover:bg-white/80"
                  data-testid={`review-item-${entry.date}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs tracking-[0.28em] text-accent/70">{entry.date}</p>
                      <h4 className="font-serif text-xl text-ink">{getReviewEntryTitle(entry)}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-accent/75">
                      {entry.tags.length ? (
                        entry.tags.map((tag) => (
                          <span
                            key={`${entry.date}-${tag}`}
                            className="rounded-full border border-line bg-rice px-3 py-1"
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-line bg-rice px-3 py-1">暂无标签</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink/70">{getReviewEntrySubtitle(entry)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
