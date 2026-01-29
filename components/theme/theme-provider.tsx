"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";

const STORAGE_KEY = "schoolmatica-theme";

// Light mode only - dark mode disabled
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setMode = useThemeStore((state) => state.setMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Force light mode always
    setMode("light");
    const root = document.documentElement;
    root.classList.remove("dark");
    root.dataset.colorMode = "light";
    window.localStorage.setItem(STORAGE_KEY, "light");
  }, [setMode]);

  return <>{children}</>;
}

