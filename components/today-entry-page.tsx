"use client";

import { useEffect, useState } from "react";
import { EntryEditor } from "@/components/entry-editor";
import { todayDateString } from "@/lib/storage";

export function TodayEntryPage() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(todayDateString());
  }, []);

  if (!today) {
    return (
      <div className="section-card px-5 py-10 text-sm leading-7 text-ink/65 md:px-8">
        正在准备今天的记录页……
      </div>
    );
  }

  return <EntryEditor date={today} allowNavigateHome />;
}
