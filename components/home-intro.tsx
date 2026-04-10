"use client";

import { useState } from "react";

export function HomeIntro() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section-card overflow-hidden">
      <div className="px-5 py-5 md:px-8 md:py-6">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-dashed border-line/70 bg-white/55 px-4 py-4 text-left transition hover:border-accent/50 hover:bg-white"
            aria-expanded={open}
            data-testid="home-intro-toggle"
          >
            <div className="space-y-1">
              <p className="text-xs tracking-[0.25em] text-accent/75">INTRO</p>
              <p className="font-serif text-lg text-ink">什么是道痕？</p>
              <p className="text-sm leading-6 text-ink/60">先花十几秒认识这里，再开始写今天。</p>
            </div>
            <span className="text-sm text-accent/75">展开</span>
          </button>
        ) : (
          <div className="space-y-4 rounded-[24px] border border-line/70 bg-white/65 px-4 py-4" data-testid="home-intro-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.25em] text-accent/75">INTRO</p>
                <h2 className="mt-1 font-serif text-xl text-ink">什么是道痕？</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="soft-button" data-testid="home-intro-close">
                收起
              </button>
            </div>

            <div className="space-y-3 text-sm leading-7 text-ink/75">
              <p>道痕，是事情经过你之后，在你心里留下的痕。</p>
              <p>它不是流水账，也不只是情绪；你为什么起波澜、真正想得到什么、真正害怕什么、又是怎么说服自己的，这些都会慢慢显出来。</p>
              <p>每天捞出一点，不是为了评判自己，而是为了慢慢看见自己。你的记录默认只保存在当前浏览器中。</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
