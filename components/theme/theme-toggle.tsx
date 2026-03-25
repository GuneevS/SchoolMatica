"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme-store";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mode, toggle } = useThemeStore();

  return (
    <Button variant="outline" size="icon" onClick={toggle} className="rounded-full border-[hsl(var(--border-strong))/0.6] bg-white/80 dark:bg-slate-900/80 shadow-ambient-sm backdrop-blur text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
      {mode === "dark" ? <Sun className="h-[1.15rem] w-[1.15rem]" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

