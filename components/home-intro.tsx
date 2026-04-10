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
            aria-expanded="false"
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
              <p>道痕，是你一天里真正发生过、真正感受过、真正选择过的痕迹。</p>
              <p>七问不是为了写得漂亮，而是帮你把波澜、反应、恐惧和选择慢慢看清。</p>
              <p>这里默认只保存在当前浏览器里，像一个只属于你的安静角落。</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
