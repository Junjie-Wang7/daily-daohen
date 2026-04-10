import { AppShell } from "@/components/app-shell";
import { CalendarView } from "@/components/calendar-view";

export default function CalendarPage() {
  return (
    <AppShell
      title="月历"
      subtitle="按月看见自己的记录轨迹，保持安静，也保留一点回看的方向感。"
    >
      <CalendarView />
    </AppShell>
  );
}
