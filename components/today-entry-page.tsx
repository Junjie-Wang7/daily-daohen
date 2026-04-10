"use client";

import { useEffect, useState } from "react";
import { EntryEditor } from "@/components/entry-editor";
import { LoadingPanel } from "@/components/loading-panel";
import { todayDateString } from "@/lib/storage";

export function TodayEntryPage() {
  const [today, setToday] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToday(todayDateString());
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  if (!today) {
    return <LoadingPanel />;
  }

  return <EntryEditor date={today} allowNavigateHome />;
}
