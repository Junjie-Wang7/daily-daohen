import { LoadingPanel } from "@/components/loading-panel";

export default function Loading() {
  return (
    <main className="paper-grid min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <LoadingPanel />
      </div>
    </main>
  );
}
