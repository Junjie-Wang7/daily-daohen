import { AppShell } from "@/components/app-shell";
import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <AppShell
      title="历史记录"
      subtitle="把已经写下的波澜慢慢摊开，看见重复、惯性与一点点新的可能。"
    >
      <HistoryList />
    </AppShell>
  );
}
