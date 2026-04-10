import { AppShell } from "@/components/app-shell";
import { HomeIntro } from "@/components/home-intro";
import { TodayEntryPage } from "@/components/today-entry-page";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <AppShell title="今日道痕" subtitle="给今天留下一笔，再慢慢看见自己。">
      <div className="space-y-6">
        <HomeIntro />
        <TodayEntryPage />
      </div>
    </AppShell>
  );
}
