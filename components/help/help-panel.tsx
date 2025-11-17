"use client";

import { useEffect } from "react";
import {
  X,
  Lightbulb,
  Zap,
  ArrowUpRight,
  Users2,
  GraduationCap,
  BarChart3,
  PlusCircle,
  SlidersHorizontal,
  UploadCloud,
  Keyboard,
  BellOff,
  ListChecks,
  FileSignature,
  UserCheck,
  CheckCircle2,
  Ruler,
  BookOpenCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useHelpStore, type HelpContent } from "@/lib/stores/help-store";
import { cn } from "@/lib/utils";

interface HelpPanelProps {
  page: string;
  content: HelpContent;
}

export function HelpPanel({ page, content }: HelpPanelProps) {
  const { isOpen, setOpen, setPage } = useHelpStore();
  const quickActionIcons: Record<string, LucideIcon> = {
    role: Users2,
    class: GraduationCap,
    report: BarChart3,
    create: PlusCircle,
    edit: SlidersHorizontal,
    upload: UploadCloud,
    entry: Keyboard,
    absent: BellOff,
    summary: ListChecks,
    capture: FileSignature,
    assign: UserCheck,
    decide: CheckCircle2,
    grading: Ruler,
    subject: BookOpenCheck,
  };

  useEffect(() => {
    setPage(page, content);
  }, [page, content, setPage]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-[hsl(var(--surface-strong))/0.98] shadow-[0_25px_80px_rgba(15,23,42,0.35)] transition-transform duration-300 ease-in-out glass-panel",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -right-10 top-16 h-40 w-40 rounded-full bg-emerald-500/40 blur-3xl" />
          <div className="absolute bottom-10 left-4 h-40 w-40 rounded-full bg-sky-500/30 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col border-l border-[hsl(var(--border-strong))/0.4]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))/0.4] p-5 text-foreground">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
                <HelpCircle className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                Guide
              </div>
              <h2 className="text-xl font-semibold">Help & Tips</h2>
              <p className="text-xs text-muted-foreground/80">Curated walkthroughs tailored to this screen.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[hsl(var(--border))/0.4] text-foreground hover:bg-[hsl(var(--surface-soft))]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-6 text-foreground">
              {/* Page Title */}
              <div className="space-y-2 rounded-3xl border border-[hsl(var(--border))/0.35] bg-[hsl(var(--surface-soft))/0.6] px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/80">{page}</p>
                <h3 className="text-2xl font-semibold">{content.title}</h3>
                <p className="text-sm text-muted-foreground/80">{content.description}</p>
              </div>

              <Separator className="border-[hsl(var(--border))/0.3]" />

              {/* Sections */}
              {content.sections.map((section, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--border))/0.35] bg-gradient-to-br from-[hsl(var(--surface-soft))/0.8] via-transparent to-transparent p-5 shadow-ambient transition duration-300 hover:-translate-y-1 hover:border-[hsl(var(--accent-iris))/0.4]"
                >
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-60">
                    <div className="pointer-events-none absolute -top-10 right-4 h-32 w-32 rounded-full bg-[hsl(var(--accent-mint))/0.3] blur-3xl" />
                  </div>
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[hsl(var(--surface-soft))/0.7] p-2 text-[hsl(var(--accent-mint))]">
                        <SparkIcon index={index} />
                      </div>
                      <h4 className="text-lg font-semibold">{section.heading}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground/80">{section.content}</p>
                    {section.tips && section.tips.length > 0 && (
                      <div className="space-y-3 rounded-2xl border border-[hsl(var(--border))/0.35] bg-[hsl(var(--surface-strong))/0.7] p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--warning))]">
                          <Lightbulb className="h-4 w-4" />
                          Pro tips
                        </div>
                        <div className="space-y-2">
                          {section.tips.map((tip, tipIndex) => (
                            <p key={tipIndex} className="text-sm text-muted-foreground/80">
                              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--surface-soft))/0.8] text-xs text-foreground">
                                {tipIndex + 1}
                              </span>
                              {tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              {content.quickActions && content.quickActions.length > 0 && (
                <>
                  <Separator className="border-[hsl(var(--border))/0.3]" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-[hsl(var(--accent-mint))/0.2] p-2 text-[hsl(var(--accent-mint))]">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Quick Actions</h4>
                        <p className="text-xs text-muted-foreground/80">One-tap accelerators for common workflows.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {content.quickActions.map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))/0.35] bg-[hsl(var(--surface-strong))/0.7] px-4 py-3 text-sm text-foreground transition hover:border-[hsl(var(--accent-iris))/0.4] hover:bg-[hsl(var(--surface-strong))/0.85]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[hsl(var(--surface-soft))/0.8] p-2">
                              {(() => {
                                const Icon = quickActionIcons[action.action] ?? Zap;
                                return <Icon className="h-4 w-4 text-[hsl(var(--accent-mint))]" />;
                              })()}
                            </div>
                            <span className="text-sm text-foreground/80">{action.label}</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/80" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

function HelpCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SparkIcon({ index }: { index: number }) {
  const icons = [Zap, Lightbulb, ArrowUpRight];
  const Icon = icons[index % icons.length];
  return <Icon className="h-4 w-4" />;
}
