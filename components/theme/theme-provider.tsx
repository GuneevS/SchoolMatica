"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";

const STORAGE_KEY = "schoolmatica-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useThemeStore();

  // Initialize theme based on local storage or system preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setMode(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, [setMode]);

  // Sync mode to document class and save state
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    root.dataset.colorMode = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return <>{children}</>;
}

