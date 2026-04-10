import { AppShell } from "@/components/app-shell";
import { TodayEntryPage } from "@/components/today-entry-page";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <AppShell
      title="今日道痕"
      subtitle="给今天留下七问，给明天留下一点更清醒的选择。"
    >
      <TodayEntryPage />
    </AppShell>
  );
}
