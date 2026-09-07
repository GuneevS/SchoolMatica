import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/dashboard";
import { ClassPerformanceChart } from "@/components/dashboard/class-performance-chart";
import { HelpPanel } from "@/components/help/help-panel";
import { dashboardHelp } from "@/lib/help-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Users } from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import { WelcomeBanner } from "@/components/welcome-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";
import { RolePersonalizedHighlights } from "@/components/dashboard/role-personalized-highlights";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

const heroHighlights = [
  { label: "Live SBA pulse", color: "hsl(var(--accent-iris))" },
  { label: "Moderation guardrails", color: "hsl(var(--accent-mint))" },
  { label: "Audit trail ready", color: "hsl(var(--accent-gold))" },
];

export default async function DashboardPage() {
  // Get authenticated user context and authorized school
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access the dashboard.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Create one from the Schools workspace to get started.</p>
      </div>
    );
  }

  const data = await getDashboardData(school.id);

  return (
    <>
      <HelpPanel page="dashboard" content={dashboardHelp} />
      <TooltipProvider>
        <div className="space-y-8 md:space-y-10">
          <AuroraHero
            eyebrow="Pulse"
            title={
              <>
                <span className="gradient-text">Dashboard</span> overview
              </>
            }
            description={`Welcome back to ${school.name}. Track performance, moderation, and registrations in a workspace that feels deliberate, calm, and premium.`}
            badges={heroHighlights}
            aside={
              <HeroMetricPanel
                title="Realtime signals"
                icon={<Activity className="h-4 w-4" />}
                metrics={[
                  {
                    label: "Average SBA",
                    value: `${data.totals.averageSba.toFixed(1)}%`,
                    helper: "Across all learners",
                    accent: "highlight",
                  },
                  { label: "Classes tracked", value: data.totals.classes.toString() },
                  { label: "Active learners", value: data.totals.students.toString() },
                  { label: "Pending plans", value: data.totals.pendingPlans.toString() },
                ]}
              />
            }
          />

          <WelcomeBanner
            title="Welcome to SchoolMatica"
            description="Track student performance, manage assessment plans, and guide moderation work from a calmer, more intentional interface."
            tips={[
              "Use the highlights above as quick filters for where to focus next.",
              "Switch roles via the header to confirm approvals from the right context.",
              "Hover the info icons on cards to see calculation detail.",
            ]}
          />

          <RolePersonalizedHighlights data={data} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 stagger-grid" data-tour="summary-stats">
            <SummaryStat
              label="Classes"
              value={data.totals.classes.toString()}
              helper={`${data.totals.students} learners tracked`}
              tooltip="Total number of active class groups with assessment plans"
              color="cobalt"
              trend="neutral"
            />
            <SummaryStat
              label="Average SBA"
              value={`${data.totals.averageSba.toFixed(1)}%`}
              helper="Across all learners captured"
              tooltip="School-wide average of all SBA percentages. Weighted automatically using the latest plan configuration."
              color="emerald"
              trend={data.totals.averageSba >= 60 ? "up" : data.totals.averageSba >= 50 ? "neutral" : "down"}
            />
            <SummaryStat
              label="Open Moderation"
              value={data.totals.openThreads.toString()}
              helper="Threads awaiting action"
              tooltip="Moderation discussions that still require input or sign-off."
              color="violet"
              trend={data.totals.openThreads === 0 ? "up" : "neutral"}
            />
            <SummaryStat
              label="Plans Pending"
              value={data.totals.pendingPlans.toString()}
              helper="Need SMT approval"
              tooltip="Assessment plans waiting for HOD or SMT approval before being locked."
              color="amber"
              trend={data.totals.pendingPlans === 0 ? "up" : "neutral"}
            />
          </div>

          <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient" data-tour="performance-chart">
            <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Class performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ClassPerformanceChart data={data.classSummaries} />
            </CardContent>
          </Card>

          <div className="space-y-4" data-tour="class-table">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Class overview
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-grid">
              {data.classSummaries.map((summary) => {
                const average = summary.averageSba ?? 0;
                return (
                  <Card key={summary.id} className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{summary.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{summary.subject}</p>
                        </div>
                        <StatusBadge status={summary.planStatus} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{summary.totalStudents} learners</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <span>{summary.atRiskCount} at risk</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Average SBA</span>
                        <span className="font-semibold text-foreground">
                          {summary.averageSba === null ? "—" : `${average.toFixed(1)}%`}
                        </span>
                      </div>
                      <Progress value={average} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient" data-tour="recent-plans">
              <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Recent assessment plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {data.recentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="group flex items-center justify-between rounded-2xl border border-[hsl(var(--border))/0.7] bg-[hsl(var(--surface-strong))/0.85] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-ambient-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.className} · {plan.subjectName}
                      </p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                ))}
                {data.recentPlans.length === 0 && (
                  <p className="text-sm text-muted-foreground">No plans have been created yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
              <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Open moderation threads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {data.openThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="rounded-2xl border border-[hsl(var(--border))/0.65] bg-[hsl(var(--surface-soft))] px-4 py-3 text-sm shadow-ambient-sm"
                  >
                    <p className="font-medium text-foreground">{thread.createdByRole}</p>
                    <p className="text-muted-foreground">{thread.label}</p>
                  </div>
                ))}
                {data.openThreads.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--success))/0.45] bg-[hsl(var(--success))/0.12] py-8 text-center shadow-ambient-sm">
                    <p className="text-sm font-medium text-[hsl(var(--success))]">All threads resolved</p>
                    <p className="text-xs text-[hsl(var(--success))/0.8]">Moderation is in a healthy state</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
              <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {data.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[hsl(var(--border))/0.7] bg-[hsl(var(--surface-strong))/0.85] px-4 py-3 text-sm shadow-ambient-sm"
                  >
                    <p className="font-medium text-foreground">{log.action.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entityType} · {formatDateTime(log.createdAt)}
                    </p>
                    {log.actorRole && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {log.actorRole}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
                {data.auditLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent changes.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}

type SummaryAccent = "cobalt" | "emerald" | "violet" | "amber";

function SummaryStat({
  label,
  value,
  helper,
  tooltip,
  trend,
  color = "cobalt",
}: {
  label: string;
  value: string;
  helper: string;
  tooltip?: string;
  trend?: "up" | "down" | "neutral";
  color?: SummaryAccent;
}) {
  const accentMap: Record<
    SummaryAccent,
    { borderLeft: string; iconBg: string; iconColor: string }
  > = {
    cobalt: {
      borderLeft: "border-l-[hsl(var(--accent-cobalt))]",
      iconBg: "bg-[hsl(var(--accent-cobalt))/0.1]",
      iconColor: "text-[hsl(var(--accent-cobalt))]",
    },
    emerald: {
      borderLeft: "border-l-[hsl(var(--accent-mint))]",
      iconBg: "bg-[hsl(var(--accent-mint))/0.1]",
      iconColor: "text-[hsl(var(--accent-mint))]",
    },
    violet: {
      borderLeft: "border-l-[hsl(var(--accent-violet))]",
      iconBg: "bg-[hsl(var(--accent-violet))/0.1]",
      iconColor: "text-[hsl(var(--accent-violet))]",
    },
    amber: {
      borderLeft: "border-l-[hsl(var(--accent-gold))]",
      iconBg: "bg-[hsl(var(--accent-gold))/0.1]",
      iconColor: "text-[hsl(var(--accent-gold))]",
    },
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const accent = accentMap[color];

  return (
    <div className={cn(
      "relative rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.95] p-6 shadow-ambient-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient overflow-hidden",
      "hover:border-[hsl(var(--border-strong))]"
    )}>
      {/* Subtle top left glow matching the accent color for a truly premium feel without harsh lines */}
      <div className={cn("absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-0 mix-blend-plus-lighter blur-2xl transition-opacity duration-500 group-hover:opacity-40", accent.iconBg)} aria-hidden />
      
      <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 transition-colors hover:text-foreground">
                <Info className="h-4 w-4" />
                <span className="sr-only">{`More info on ${label}`}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent align="end">
              <p className="max-w-xs text-[13px]">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[2rem] font-bold tracking-tight text-foreground leading-none">{value}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground/90">{helper}</p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl text-foreground ring-1 ring-inset ring-[hsl(var(--border-strong))/0.4] shadow-sm",
            accent.iconBg,
            accent.iconColor,
          )}
        >
          {trend && <TrendIcon className="h-4 w-4" />}
        </span>
      </div>
    </div>
  );
}

