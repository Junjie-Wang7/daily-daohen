import { Suspense } from "react";
import { LoadingPanel } from "@/components/loading-panel";
import { RecordEntryPage } from "@/components/record-entry-page";

export default function RecordsPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <RecordEntryPage />
    </Suspense>
  );
}
