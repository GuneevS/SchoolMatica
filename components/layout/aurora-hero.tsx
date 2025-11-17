import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AuroraHeroBadge = {
  label: string;
  color?: string;
};

export type AuroraHeroMetric = {
  label: string;
  value: string;
  helper?: string;
  accent?: "highlight";
};

interface AuroraHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  badges?: AuroraHeroBadge[];
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function AuroraHero({ eyebrow, title, description, badges, actions, aside, className }: AuroraHeroProps) {
  const hasAside = Boolean(aside);
  return (
    <section className={cn("relative overflow-hidden rounded-[32px] border border-[hsl(var(--border-strong))/0.7] shadow-ambient aurora-panel", className)}>
      <div className="absolute inset-0 opacity-60" aria-hidden />
      <div className={cn("relative grid gap-10 p-8 md:p-10", hasAside ? "md:grid-cols-[2fr,minmax(280px,1fr)]" : "")}>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-muted-foreground/80">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black text-foreground md:text-5xl leading-[1.1]">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-base text-muted-foreground">{description}</p>}
          {badges && badges.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border-strong))/0.55] bg-[hsl(var(--surface-strong))/0.85] px-4 py-2 text-sm font-medium text-muted-foreground shadow-ambient-sm backdrop-blur"
                >
                  {badge.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: badge.color }} />}
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {hasAside && <div className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.85] p-6 shadow-ambient-sm backdrop-blur">{aside}</div>}
      </div>
    </section>
  );
}

interface HeroMetricPanelProps {
  title?: string;
  icon?: ReactNode;
  metrics: AuroraHeroMetric[];
}

export function HeroMetricPanel({ title, icon, metrics }: HeroMetricPanelProps) {
  return (
    <div>
      {title && (
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </div>
      )}
      <div className={cn("space-y-4 text-sm text-muted-foreground", title ? "mt-6" : "")}>
        {metrics.map((metric) => {
          const isHighlight = metric.accent === "highlight";
          return (
            <div
              key={metric.label}
              className={cn(
                "flex items-center justify-between px-4 py-3",
                isHighlight
                  ? "rounded-2xl bg-[hsl(var(--accent-iris))/0.08]"
                  : "rounded-none px-0 py-0 border-t border-[hsl(var(--border))/0.4] pt-4 first:border-t-0 first:pt-0",
              )}
            >
              <div>
                <p className={cn("text-xs uppercase tracking-[0.35em]", isHighlight ? "text-muted-foreground/80" : "text-muted-foreground/70")}>{metric.label}</p>
                {metric.helper && (
                  <p className={cn("text-sm", isHighlight ? "text-foreground" : "text-muted-foreground/90")}>
                    {metric.helper}
                  </p>
                )}
              </div>
              <p className={cn("font-semibold text-foreground", isHighlight ? "text-2xl" : "text-base")}>{metric.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

