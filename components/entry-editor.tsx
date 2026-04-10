"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import {
  createEmptyEntry,
  downloadFile,
  exportEntryMarkdown,
  formatDisplayDate,
  getEntryByDate,
  saveEntry,
  todayDateString,
} from "@/lib/storage";
import { JournalEntry, QuestionId } from "@/lib/types";

function normalizeTags(value: string) {
  return value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EntryEditor({
  date,
  allowNavigateHome = false,
}: {
  date: string;
  allowNavigateHome?: boolean;
}) {
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry>(() => createEmptyEntry(date));
  const [tagsInput, setTagsInput] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const isToday = date === todayDateString();

  useEffect(() => {
    const nextEntry = getEntryByDate(date);
    setEntry(nextEntry);
    setTagsInput(nextEntry.tags.join(" "));
    setSavedAt(nextEntry.updatedAt);
  }, [date]);

  const updateAnswer =
    (questionId: QuestionId) => (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setEntry((current) => ({
        ...current,
        answers: { ...current.answers, [questionId]: value },
      }));
    };

  const handleSave = () => {
    const saved = saveEntry({
      ...entry,
      date,
      tags: normalizeTags(tagsInput),
    });
    setEntry(saved);
    setTagsInput(saved.tags.join(" "));
    setSavedAt(saved.updatedAt);
  };

  const handleExportMarkdown = () => {
    const current = {
      ...entry,
      date,
      tags: normalizeTags(tagsInput),
    };

    downloadFile(`${date}-道痕.md`, exportEntryMarkdown(current), "text/markdown;charset=utf-8");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
      <section className="section-card">
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-accent/80">DATE</p>
              <h2 className="font-serif text-2xl">{formatDisplayDate(date)}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="soft-button cursor-pointer">
                <span>切换日期</span>
                <input
                  type="date"
                  value={date}
                  className="sr-only"
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    if (!nextDate) {
                      return;
                    }
                    if (nextDate === todayDateString() && allowNavigateHome) {
                      router.push("/");
                      return;
                    }
                    router.push(`/records/${nextDate}`);
                  }}
                />
              </label>
              {!isToday && allowNavigateHome ? (
                <Link href="/" className="soft-button">
                  回到今日
                </Link>
              ) : null}
            </div>
          </div>

          <div className="field-shell">
            <p className="mb-2 text-sm text-ink/70">标签</p>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="例如：工作 关系 冲突"
              className="field-input"
            />
            <p className="mt-2 text-xs text-accent/75">可用空格、中文逗号或英文逗号分隔。</p>
          </div>

          <div className="space-y-4">
            {QUESTIONS.map((question, index) => (
              <section key={question.id} className="field-shell">
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/80 text-xs text-accent">
                    {index + 1}
                  </span>
                  <h3 className="pt-1 text-sm leading-7 text-ink">{question.label}</h3>
                </div>
                <textarea
                  value={entry.answers[question.id]}
                  onChange={updateAnswer(question.id)}
                  rows={4}
                  placeholder="写下此刻能看见的一点真实。"
                  className="field-input min-h-[112px]"
                />
              </section>
            ))}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <section className="section-card">
          <div className="space-y-4 px-5 py-6 md:px-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-accent/80">ACTIONS</p>
              <h3 className="mt-2 font-serif text-xl">今日留痕</h3>
            </div>
            <p className="text-sm leading-7 text-ink/70">
              先写下波澜，再慢慢看见自己。记录会保存在当前浏览器的
              <code className="mx-1 rounded bg-white/90 px-1.5 py-0.5 text-xs">localStorage</code>
              中。
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={handleSave} className="soft-button-primary">
                保存今日道痕
              </button>
              <button type="button" onClick={handleExportMarkdown} className="soft-button">
                导出本篇 Markdown
              </button>
              <Link href="/history" className="soft-button">
                查看历史记录
              </Link>
            </div>
            <p className="text-xs text-accent/75">
              最近保存时间：{savedAt ? new Date(savedAt).toLocaleString("zh-CN") : "尚未保存"}
            </p>
          </div>
        </section>

        <section className="section-card">
          <div className="space-y-4 px-5 py-6 md:px-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-accent/80">REMINDER</p>
              <h3 className="mt-2 font-serif text-xl">七问之外</h3>
            </div>
            <p className="text-sm leading-7 text-ink/70">
              不需要把自己说明得很完整。只要比今天早上更诚实一点点，这一笔就有分量。
            </p>
            <div className="rounded-3xl border border-dashed border-line px-4 py-4 text-sm leading-7 text-ink/75">
              今天的“主石头”，不一定是最大的问题，而是最值得继续追问的那一块。
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
