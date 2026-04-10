import { AppShell } from "@/components/app-shell";
import { EntryEditor } from "@/components/entry-editor";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  return (
    <AppShell
      title="按日期查看"
      subtitle="可以补写过去，也可以提前为某一天留出空白。所有内容仍保存在本地浏览器中。"
    >
      <EntryEditor date={date} allowNavigateHome />
    </AppShell>
  );
}
