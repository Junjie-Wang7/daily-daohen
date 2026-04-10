import { AppShell } from "@/components/app-shell";
import { EntryEditor } from "@/components/entry-editor";

export const dynamic = "force-dynamic";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  return (
    <AppShell
      title="今日道痕"
      subtitle="在这一页里，把当天的波澜、反应、恐惧和选择一一捞出来。"
    >
      <EntryEditor date={date} />
    </AppShell>
  );
}
