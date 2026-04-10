"use client";

import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";
import {
  downloadFile,
  exportAllEntriesJson,
  formatDisplayDate,
  importEntriesJson,
  ImportStrategy,
  searchEntries,
} from "@/lib/storage";

export function HistoryList() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [keyword, setKeyword] = useState("");
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>("merge");
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const entries = searchEntries(keyword);

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
      setImportError(true);
      setImportMessage("导入失败：请选择 .json 文件。");
      return;
    }

    setIsImporting(true);
    setImportMessage("");
    setImportError(false);

    try {
      const content = await file.text();
      const result = importEntriesJson(content, importStrategy);

      if (!result.ok) {
        setImportError(true);
        setImportMessage(result.message);
        return;
      }

      setImportError(false);
      setImportMessage(
        result.strategy === "overwrite"
          ? `导入成功：已覆盖为 ${result.totalCount} 条记录。`
          : `导入成功：已恢复 ${result.importedCount} 条记录，当前共 ${result.totalCount} 条。`,
      );
      setKeyword("");
    } catch {
      setImportError(true);
      setImportMessage("导入失败：读取文件时出现问题，请稍后再试。");
    } finally {
      setIsImporting(false);
    }
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
              可将之前导出的 JSON 文件重新恢复到当前浏览器中。
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
              {isImporting ? "正在导入…" : "导入 JSON"}
            </button>
            {importMessage ? (
              <p
                className={`mt-3 text-xs leading-6 ${importError ? "text-[#a14f4f]" : "text-pine"}`}
                data-testid="import-json-message"
              >
                {importMessage}
              </p>
            ) : null}
          </div>

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

          <p className="text-sm leading-7 text-ink/70">
            共找到 <span className="font-medium text-ink">{entries.length}</span> 条记录。
          </p>
        </div>
      </section>

      <section className="section-card">
        <div className="flex flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
          {entries.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-line px-5 py-10 text-center text-sm leading-7 text-ink/65">
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
