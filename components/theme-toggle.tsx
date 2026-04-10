"use client";

import { useEffect, useMemo, useState } from "react";

type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "daily-daohen-theme";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isThemePreference(stored)) {
        setPreference(stored);
      }
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const root = document.documentElement;

    const applyTheme = () => {
      const nextTheme = resolveTheme(preference);
      root.dataset.theme = nextTheme;
      root.style.colorScheme = nextTheme;
    };

    applyTheme();
    window.localStorage.setItem(STORAGE_KEY, preference);

    if (preference !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme();

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mounted, preference]);

  const nextPreference = useMemo<ThemePreference>(() => {
    if (preference === "system") {
      return "dark";
    }

    if (preference === "dark") {
      return "light";
    }

    return "system";
  }, [preference]);

  const label = useMemo(() => {
    if (preference === "system") {
      return "跟随系统";
    }

    return preference === "dark" ? "深色" : "浅色";
  }, [preference]);

  return (
    <button
      type="button"
      className="soft-button h-11 px-4 text-xs tracking-[0.18em]"
      onClick={() => setPreference(nextPreference)}
      aria-label={`切换主题，当前为${label}`}
      data-testid="theme-toggle"
    >
      主题 · {label}
    </button>
  );
}
