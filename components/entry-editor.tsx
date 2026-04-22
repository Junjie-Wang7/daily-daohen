"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { QUESTIONS, countAnsweredQuestions } from "@/lib/questions";
import { getRecordHref } from "@/lib/routes";
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

type SaveMode = "auto" | "manual";

function normalizeTags(value: string) {
  return value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeDraft(date: string, tagsInput: string, answers: JournalEntry["answers"]) {
  return JSON.stringify({
    date,
    tags: normalizeTags(tagsInput),
    answers,
  });
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
  const [saveNotice, setSaveNotice] = useState("正在等待第一笔留痕");
  const [showSupport, setShowSupport] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isToday = date === todayDateString();
  const answeredCount = countAnsweredQuestions(entry.answers);
  const autosaveTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const lastSavedSignatureRef = useRef("");

  const clearTimers = () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const commitDraft = useCallback(
    (mode: SaveMode) => {
      clearTimers();

      const normalizedTags = normalizeTags(tagsInput);
      const saved = saveEntry({
        ...entry,
        date,
        tags: normalizedTags,
      });
      const nextTagsInput = saved.tags.join(" ");
      const nextSignature = serializeDraft(date, nextTagsInput, saved.answers);

      lastSavedSignatureRef.current = nextSignature;
      setEntry(saved);
      setTagsInput(nextTagsInput);
      setSavedAt(saved.updatedAt);
      setSaveNotice(mode === "manual" ? "刚刚保存" : "已自动保存");

      if (mode === "manual") {
        noticeTimerRef.current = window.setTimeout(() => {
          setSaveNotice("已自动保存");
          noticeTimerRef.current = null;
        }, 1800);
      }
    },
    [date, entry, tagsInput],
  );

  useEffect(() => {
    clearTimers();

    const nextEntry = getEntryByDate(date);
    const nextTagsInput = nextEntry.tags.join(" ");
    setEntry(nextEntry);
    setTagsInput(nextTagsInput);
    setSavedAt(nextEntry.updatedAt);
    setSaveNotice("正在等待第一笔留痕");
    lastSavedSignatureRef.current = serializeDraft(date, nextTagsInput, nextEntry.answers);
    setIsReady(true);
  }, [date]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const signature = serializeDraft(date, tagsInput, entry.answers);
    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      commitDraft("auto");
      autosaveTimerRef.current = null;
    }, 450);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [commitDraft, date, entry.answers, isReady, tagsInput]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const updateAnswer =
    (questionId: QuestionId) => (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setEntry((current) => ({
        ...current,
        answers: { ...current.answers, [questionId]: value },
      }));
    };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value;
    if (!nextDate) {
      return;
    }

    if (nextDate === todayDateString() && allowNavigateHome) {
      router.push("/");
      return;
    }

    router.push(getRecordHref(nextDate));
  };

  const handleSave = () => {
    commitDraft("manual");
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
    <div className="grid gap-6 pb-20 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)] lg:pb-0">
      <section className="section-card">
        <div className="flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-accent/80">DATE</p>
              <h2 className="font-serif text-2xl">{formatDisplayDate(date)}</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex w-full flex-col gap-2 text-sm text-ink sm:w-auto sm:min-w-[220px]">
                <span className="text-xs tracking-[0.2em] text-accent/80">切换日期</span>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="min-h-11 w-full rounded-full border border-line bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-accent/70 focus:bg-white sm:w-[220px]"
                />
              </label>
              {!isToday && allowNavigateHome ? (
                <Link href="/" className="soft-button sm:mb-[1px]">
                  回到今天
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
            <div className="flex items-center gap-3 text-xs leading-6 text-ink/55" data-testid="question-progress">
              <span>已回应 {answeredCount} / {QUESTIONS.length}</span>
              <div className="h-px flex-1 overflow-hidden rounded-full bg-line/50">
                <div
                  className="h-px rounded-full bg-accent/70 transition-all"
                  style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            {QUESTIONS.map((question, index) => {
              const answer = entry.answers[question.id];
              const hasValue = answer.trim().length > 0;

              return (
                <section key={question.id} className="field-shell">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/80 text-xs text-accent">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="pt-1 text-sm leading-8 text-ink">{question.label}</h3>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] leading-none ${
                        hasValue ? "border-accent/20 bg-accent/5 text-accent" : "border-line/70 bg-white/70 text-ink/35"
                      }`}
                    >
                      {hasValue ? "已留痕" : "空白"}
                    </span>
                  </div>
                  <textarea
                    value={answer}
                    onChange={updateAnswer(question.id)}
                    rows={5}
                    placeholder="写下你此刻能看见的真实细节。"
                    className="field-input min-h-[132px]"
                  />
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <section className="section-card">
          <div className="space-y-4 px-5 py-6 md:px-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-accent/80">ACTIONS</p>
              <h3 className="mt-2 font-serif text-xl">今日留痕</h3>
            </div>
            <p className="text-sm leading-7 text-ink/70">
              先写下一笔，再慢慢看见自己。你的内容会安静地留在当前浏览器里，不需要额外的步骤。
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={handleSave} className="soft-button-primary">
                立即留痕
              </button>
              <button type="button" onClick={handleExportMarkdown} className="soft-button">
                保存本篇为文稿
              </button>
              <Link href="/history" className="soft-button">
                查看历史记录
              </Link>
            </div>
            <div
              className="rounded-2xl border border-line/70 bg-white/65 px-3 py-2 text-xs leading-6 text-ink/65"
              data-testid="autosave-status"
              aria-live="polite"
            >
              {saveNotice}
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
              不需要把自己说得很完整。只要比昨天更诚实一点点，这一笔就已经有分量了。
            </p>
            <div className="rounded-3xl border border-dashed border-line px-4 py-4 text-sm leading-7 text-ink/75">
              今天的“主石头”，不一定是最大的难题，而是最值得继续追问的那一块。
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="space-y-4 px-5 py-6 md:px-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-accent/80">SUPPORT</p>
              <h3 className="mt-2 font-serif text-xl">支持作者</h3>
            </div>
            <p className="text-sm leading-7 text-ink/70">
              如果每日道痕陪你安静地回看过一天，也可以请作者喝杯茶。感谢你的支持。
            </p>
            <button
              type="button"
              onClick={() => setShowSupport((current) => !current)}
              className="soft-button w-full"
              aria-expanded={showSupport}
              aria-controls="support-author-panel"
              data-testid="support-author-toggle"
            >
              {showSupport ? "收起收款码" : "展开收款码"}
            </button>
            {showSupport ? (
              <div
                id="support-author-panel"
                className="rounded-3xl border border-line/70 bg-white/60 p-4 dark:bg-white/5"
                data-testid="support-author-panel"
              >
                <Image
                  src="/reward-code.jpg"
                  alt="支持作者收款码"
                  width={440}
                  height={440}
                  className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl bg-white object-cover p-2"
                />
                <p className="mt-3 text-center text-xs leading-6 text-ink/60">
                  扫码支持即可，心意到了就好。
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}
