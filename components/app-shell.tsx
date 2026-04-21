"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "今日道痕" },
  { href: "/history", label: "历史记录" },
  { href: "/calendar", label: "月历" },
  { href: "/review", label: "回顾" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="paper-grid min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="section-card overflow-hidden">
          <div className="flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="text-xs tracking-[0.35em] text-accent/80">MEI RI DAO HEN</p>
                <h1 className="font-serif text-3xl text-ink md:text-4xl dark:text-stone-100">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-ink/70 dark:text-stone-200/70">{subtitle}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs leading-6 text-ink/55 dark:text-stone-200/60">
                  <span className="inline-flex items-center gap-1 rounded-full border border-line/70 bg-white/55 px-3 py-1 dark:bg-white/5">
                    <span aria-hidden="true">锁</span>
                    你的记录默认只保存在当前浏览器中
                  </span>
                  <span>这里是只属于你的安静角落。</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <nav className="flex flex-wrap gap-2">
                  {links.map((link) => {
                    const active = pathname === link.href;

                    return (
                      <Link key={link.href} href={link.href} className={active ? "soft-button-primary" : "soft-button"}>
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <AuthPanel />
        {children}
      </div>
    </main>
  );
}
