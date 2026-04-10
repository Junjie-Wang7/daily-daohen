"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  clearAllEntries,
  downloadFile,
  exportAllEntriesJson,
  formatDisplayDate,
  importEntriesJson,
  ImportStrategy,
  previewImportJson,
  readStore,
  restoreEntries,
  searchEntries,
} from "@/lib/storage";
import { JournalEntry } from "@/lib/types";

type PendingImport = {
  content: string;
  fileName: string;
  strategy: ImportStrategy;
  summary: {
    totalRecords: number;
    newRecords: number;
    duplicateDates: number;
    replacedRecords: number;
    finalTotal: number;
  };
};

export function HistoryList() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>("merge");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [undoEntries, setUndoEntries] = useState<JournalEntry[] | null>(null);

  const entries = searchEntries(keyword);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const updateStatus = (message: string, isError = false) => {
    setStatusMessage(message);
    setStatusError(isError);
  };

  const clearUndoState = () => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoEntries(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setPendingImport(null);
      updateStatus("导入失败：请选择 .json 文件。", true);
      return;
    }

    setIsImporting(true);
    setPendingImport(null);
    setStatusMessage("");
    setStatusError(false);

    try {
      const content = await file.text();
      const preview = previewImportJson(content, importStrategy);

      if (!preview.ok) {
        updateStatus(preview.message, true);
        return;
      }

      setPendingImport({
        content,
        fileName: file.name,
        strategy: importStrategy,
        summary: preview.summary,
      });
      updateStatus("已生成导入预览，请确认后再执行。");
    } catch {
      updateStatus("导入失败：读取文件时出现问题，请稍后再试。", true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) {
      return;
    }

    if (
      pendingImport.strategy === "overwrite" &&
      typeof window !== "undefined" &&
      !window.confirm("覆盖模式会替换当前浏览器中的全部记录，是否继续导入？")
    ) {
      return;
    }

    const result = importEntriesJson(pendingImport.content, pendingImport.strategy);

    if (!result.ok) {
      updateStatus(result.message, true);
      return;
    }

    setKeyword("");
    setPendingImport(null);
    clearUndoState();
    updateStatus(
      result.strategy === "overwrite"
        ? `导入成功：已覆盖为 ${result.totalCount} 条记录。`
        : `导入成功：已恢复 ${result.importedCount} 条记录，当前共 ${result.totalCount} 条。`,
    );
  };

  const handleClearAll = () => {
    if (typeof window === "undefined") {
      return;
    }

    const confirmed = window.confirm(
      "此操作会清空当前浏览器中的全部道痕记录，且无法撤销，是否继续？",
    );

    if (!confirmed) {
      return;
    }

    const snapshot = readStore().entries;
    clearAllEntries();
    setKeyword("");
    setPendingImport(null);
    setUndoEntries(snapshot);
    updateStatus("已清空本地记录，可在短时间内撤销。");

    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      setUndoEntries(null);
      undoTimerRef.current = null;
    }, 8000);
  };

  const handleUndoClear = () => {
    if (!undoEntries) {
      return;
    }

    restoreEntries(undoEntries);
    clearUndoState();
    updateStatus("已恢复刚刚清空的记录。");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="section-card h-fit">
        <div className="space-y-5 px-5 py-6 md:px-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-accent/80">SEARCH</p>
            <h2 className="mt-2 font-serif text-2xl">检索与恢复</h2>
          </div>

          <div className="field-shell">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索日期、标签或内容"
              className="field-input"
            />
          </div>

          <div className="rounded-[28px] border border-line/70 bg-white/50 px-4 py-4">
            <p className="text-sm text-ink">导入 JSON</p>
            <p className="mt-2 text-xs leading-6 text-ink/70">
              先解析并预览导入内容，确认后才会真正恢复到当前浏览器。
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="import-strategy"
                  value="merge"
                  checked={importStrategy === "merge"}
                  onChange={() => setImportStrategy("merge")}
                />
                <span>合并到本地数据</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="import-strategy"
                  value="overwrite"
                  checked={importStrategy === "overwrite"}
                  onChange={() => setImportStrategy("overwrite")}
                />
                <span>覆盖本地数据</span>
              </label>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleImportFile}
              data-testid="import-json-input"
            />
            <button
              type="button"
              onClick={handleImportClick}
              className="soft-button mt-4 w-full"
              disabled={isImporting}
              data-testid="import-json-button"
            >
              {isImporting ? "正在解析…" : "选择 JSON 文件"}
            </button>
          </div>

          {pendingImport ? (
            <div
              className="rounded-[28px] border border-line/70 bg-rice/70 px-4 py-4"
              data-testid="import-preview"
            >
              <p className="text-sm text-ink">导入预览</p>
              <p className="mt-2 text-xs leading-6 text-ink/70">
                文件：{pendingImport.fileName}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-ink">
                <p>总记录数：{pendingImport.summary.totalRecords}</p>
                <p>新增数：{pendingImport.summary.newRecords}</p>
                <p>重复日期数：{pendingImport.summary.duplicateDates}</p>
                {pendingImport.strategy === "overwrite" ? (
                  <p>将覆盖数：{pendingImport.summary.replacedRecords}</p>
                ) : (
                  <p>将合并后总数：{pendingImport.summary.finalTotal}</p>
                )}
              </div>
              {pendingImport.strategy === "overwrite" ? (
                <p className="mt-3 text-xs leading-6 text-[#a14f4f]">
                  覆盖模式会替换当前浏览器中的全部记录，请确认无误后再继续。
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="soft-button-primary"
                  data-testid="confirm-import-button"
                >
                  确认导入
                </button>
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="soft-button"
                  data-testid="cancel-import-button"
                >
                  取消
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              downloadFile(
                "道痕全集.json",
                exportAllEntriesJson(),
                "application/json;charset=utf-8",
              )
            }
            className="soft-button-primary w-full"
            data-testid="export-json-button"
          >
            导出全部 JSON
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="soft-button w-full"
            data-testid="clear-all-button"
          >
            清空全部记录
          </button>

          {undoEntries ? (
            <button
              type="button"
              onClick={handleUndoClear}
              className="soft-button w-full"
              data-testid="undo-clear-button"
            >
              撤销清空
            </button>
          ) : null}

          {statusMessage ? (
            <p
              className={`rounded-2xl px-3 py-2 text-xs leading-6 ${
                statusError ? "bg-[#fff3f1] text-[#a14f4f]" : "bg-[#f3f1e8] text-pine"
              }`}
              data-testid="history-status-message"
            >
              {statusMessage}
            </p>
          ) : null}

          <p className="text-sm leading-7 text-ink/70">
            共找到 <span className="font-medium text-ink">{entries.length}</span> 条记录。
          </p>
        </div>
      </section>

      <section className="section-card">
        <div className="flex flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
          {entries.length === 0 ? (
            <div
              className="rounded-[28px] border border-dashed border-line px-5 py-10 text-center text-sm leading-7 text-ink/65"
              data-testid="history-empty-state"
            >
              暂时没有找到匹配记录。可以换一个关键词，或先回到首页留下今天这一笔。
            </div>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.date}
                className="rounded-[28px] border border-line/70 bg-white/60 px-5 py-5 transition hover:border-accent/50 hover:bg-white/80"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs tracking-[0.28em] text-accent/70">{entry.date}</p>
                      <h3 className="mt-1 font-serif text-xl text-ink">
                        {formatDisplayDate(entry.date)}
                      </h3>
                    </div>
                    <p className="text-sm leading-7 text-ink/75">
                      {entry.answers.stone || entry.answers.event || "这一天还没有留下摘要。"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.length ? (
                        entry.tags.map((tag) => (
                          <span
                            key={`${entry.date}-${tag}`}
                            className="rounded-full border border-line bg-rice px-3 py-1 text-xs text-accent"
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-accent/70">未设置标签</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/records/${entry.date}`} className="soft-button">
                    查看当天
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
