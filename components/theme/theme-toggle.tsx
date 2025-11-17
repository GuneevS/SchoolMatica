"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useThemeStore } from "@/lib/stores/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "group relative rounded-full border border-[hsl(var(--border-strong))]/70 bg-[hsl(var(--surface-soft))] px-3.5 text-sm font-semibold text-foreground/80 shadow-ambient-sm transition-all hover:bg-[hsl(var(--surface-strong))]",
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="mr-2 flex h-6 w-12 items-center rounded-full bg-[linear-gradient(120deg,hsl(var(--accent-iris)),hsl(var(--accent-violet)))] p-0.5 shadow-inner">
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full bg-[hsl(var(--surface-strong))] text-[hsl(var(--accent-iris))] transition-transform duration-300",
            isDark ? "translate-x-5" : "translate-x-0",
          )}
        >
          {isDark ? <MoonStar className="size-3" /> : <SunMedium className="size-3" />}
        </span>
      </span>
      <span className="text-xs uppercase tracking-[0.35em]">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

