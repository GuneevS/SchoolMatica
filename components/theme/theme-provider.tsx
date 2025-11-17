"use client";

import { useEffect, useState } from "react";
import { ThemeMode, useThemeStore } from "@/lib/stores/theme-store";

const STORAGE_KEY = "schoolmatica-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
    setHydrated(true);
  }, [setMode]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.colorMode = mode;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, hydrated]);

  return <>{children}</>;
}

