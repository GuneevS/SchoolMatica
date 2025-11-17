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
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900/60 p-6 text-white shadow-[0px_25px_60px_rgba(15,23,42,0.35)]">
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-40">
        <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-sky-500/40 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-52 w-52 rounded-full bg-emerald-400/30 blur-[100px]" />
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Insider
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
            <p className="mt-2 text-sm text-white/80">{description}</p>
          </div>
          {tips && tips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tips.map((tip, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/80"
                >
                  <span className="h-5 w-5 rounded-full bg-white/10 text-center text-[11px] leading-5">{index + 1}</span>
                  {tip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setOpen(true)}
            className="w-full rounded-2xl border border-white/10 bg-white/90 text-slate-900 shadow-lg hover:bg-white md:w-auto"
          >
            Launch guided tour
          </Button>
          <p className="text-xs text-white/70">Immersive walkthrough & contextual coaching</p>
        </div>
      </div>
    </div>
  );
}
