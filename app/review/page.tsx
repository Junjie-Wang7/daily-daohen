import { AppShell } from "@/components/app-shell";
import { ReviewView } from "@/components/review-view";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  return (
    <AppShell
      title="回顾"
      subtitle="把记录放回更长的时间里，看看重复、停顿、偏好与那些慢慢成形的自己。"
    >
      <ReviewView />
    </AppShell>
  );
}
