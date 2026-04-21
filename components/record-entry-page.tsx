"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { EntryEditor } from "@/components/entry-editor";
import { todayDateString } from "@/lib/storage";

function normalizeDateParam(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayDateString();
}

export function RecordEntryPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const date = useMemo(() => normalizeDateParam(dateParam), [dateParam]);

  return (
    <AppShell
      title="今日道痕"
      subtitle="在这一页里，把当天的波澜、反应、恐惧和选择一一捞出来。"
    >
      <EntryEditor key={date} date={date} />
    </AppShell>
  );
}
