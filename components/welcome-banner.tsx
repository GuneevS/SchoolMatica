"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHelpStore } from "@/lib/stores/help-store";

interface WelcomeBannerProps {
  title: string;
  description: string;
  tips?: string[];
}

export function WelcomeBanner({ title, description, tips }: WelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { setOpen } = useHelpStore();

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.95] p-6 text-foreground shadow-ambient">
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-20 dark:opacity-40">
        <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-[hsl(var(--accent-iris))/0.4] blur-3xl" />
        <div className="absolute bottom-0 right-10 h-52 w-52 rounded-full bg-[hsl(var(--accent-mint))/0.3] blur-[100px]" />
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-4 rounded-full border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-soft))/0.5] p-2 text-muted-foreground transition hover:bg-[hsl(var(--surface-soft))] hover:text-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-soft))/0.5] px-3 py-1 text-xs uppercase tracking-[0.3em] font-medium text-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Insider
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {tips && tips.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {tips.map((tip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-soft))/0.4] pr-4 pl-1.5 py-1.5 text-xs text-muted-foreground shadow-sm"
                >
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[hsl(var(--surface-strong))] shadow-sm text-[10px] font-semibold border border-[hsl(var(--border-strong))/0.4] text-foreground">{index + 1}</span>
                  {tip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setOpen(true)}
            className="w-full rounded-2xl border-[hsl(var(--border-strong))/0.7] bg-[hsl(var(--surface-strong))] text-foreground shadow-ambient-sm hover:bg-[hsl(var(--surface-soft))] md:w-auto"
          >
            Launch guided tour
          </Button>
          <p className="text-[11px] font-medium text-muted-foreground">Immersive walkthrough & contextual coaching</p>
        </div>
      </div>
    </div>
  );
}
