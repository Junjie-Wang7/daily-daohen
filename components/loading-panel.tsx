"use client";

export function LoadingPanel({
  title = "正在翻开今天的道痕……",
  subtitle = "先把这一页安静地放好。",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="section-card overflow-hidden px-5 py-8 md:px-8 md:py-10"
      aria-live="polite"
      aria-busy="true"
      data-testid="page-loading-state"
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.3em] text-accent/80">LOADING</p>
          <h2 className="font-serif text-2xl text-ink">{title}</h2>
          <p className="text-sm leading-7 text-ink/65">{subtitle}</p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
          <div className="loading-sheen h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        </div>

        <div className="space-y-3">
          <div className="h-20 rounded-[24px] bg-white/55 animate-pulse" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-16 rounded-[22px] bg-white/55 animate-pulse" />
            <div className="h-16 rounded-[22px] bg-white/55 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
