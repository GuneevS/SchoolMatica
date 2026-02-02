import type { MarkbookPayload, MarkbookStats } from "@/lib/markbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Props {
  stats: MarkbookStats;
  plan: NonNullable<MarkbookPayload["assessmentPlan"]>;
}

export function MarkbookSummary({ stats, plan }: Props) {
  const totalAssessments = plan.assessments?.length ?? 0;
  const completion = stats.totalMarks === 0 ? 0 : (stats.capturedMarks / stats.totalMarks) * 100;

  const getTrend = (value: number, threshold: number) => {
    if (value >= threshold + 10) return "up";
    if (value < threshold) return "down";
    return "neutral";
  };

  const cards: Array<{
    label: string;
    value: string;
    helper: string;
    tooltip?: string;
    color?: "blue" | "emerald" | "amber" | "purple" | "cyan";
    trend?: "up" | "down" | "neutral";
  }> = [
    {
      label: "Assessments",
      value: String(totalAssessments),
      helper: `${plan.termCount} terms`,
      tooltip: "Total number of assessments in this plan. Weights are automatically normalized across all assessments.",
      color: "blue",
    },
    {
      label: "Captured marks",
      value: `${stats.capturedMarks}/${stats.totalMarks}`,
      helper: `${completion.toFixed(1)}% complete`,
      tooltip: "Number of marks entered vs. total possible marks. Includes all students and assessments.",
      color: "purple",
      trend: completion >= 80 ? "up" : completion >= 50 ? "neutral" : "down",
    },
    {
      label: "Average SBA",
      value: `${stats.averageSba.toFixed(1)}%`,
      helper: "Across class",
      tooltip:
        "School-Based Assessment average. Calculated from weighted assessments, excluding absent marks. Automatically renormalizes when marks are missing.",
      color: "emerald",
      trend: getTrend(stats.averageSba, 60),
    },
    {
      label: "At-risk learners",
      value: String(stats.atRiskLearners),
      helper: "Below 40%",
      tooltip: "Students with SBA percentage below 40%. These learners may need additional support or intervention.",
      color: stats.atRiskLearners > 0 ? "amber" : "emerald",
      trend: stats.atRiskLearners === 0 ? "up" : "down",
    },
    {
      label: "Average PAT",
      value: `${stats.averagePat.toFixed(1)}%`,
      helper: "Practical components",
      tooltip: "Average for Practical Assessment Tasks only. PAT components are weighted separately from other school-based assessments.",
      color: "cyan",
      trend: getTrend(stats.averagePat, 60),
    },
  ];

  if (stats.hasTermWeights) {
    cards.splice(2, 0, {
      label: "Final-year avg",
      value: `${stats.averageFinal.toFixed(1)}%`,
      helper: "Term-weighted",
      tooltip: "Final-year mark after applying configured term weights across SBA and PAT components.",
      color: "purple",
      trend: getTrend(stats.averageFinal, 60),
    });
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {stats.hasTermWeights && (
          <div className="rounded-lg border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] px-4 py-3 text-xs text-muted-foreground">
            Term weighting is active for this plan. Final-year marks and dashboards will reflect configured term contributions.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-5">
          {cards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({ 
  label, 
  value, 
  helper, 
  tooltip,
  color = "blue",
  trend,
}: { 
  label: string; 
  value: string | number; 
  helper: string;
  tooltip?: string;
  color?: "blue" | "emerald" | "amber" | "purple" | "cyan";
  trend?: "up" | "down" | "neutral";
}) {
  const colorClasses = {
    blue: "from-[hsl(var(--accent-cobalt))/0.2] to-[hsl(var(--accent-iris))/0.2] border-[hsl(var(--accent-cobalt))/0.35]",
    emerald: "from-[hsl(var(--accent-mint))/0.2] to-[hsl(var(--accent-iris))/0.2] border-[hsl(var(--accent-mint))/0.35]",
    amber: "from-[hsl(var(--accent-gold))/0.2] to-[hsl(var(--accent-flamingo))/0.2] border-[hsl(var(--accent-gold))/0.35]",
    purple: "from-[hsl(var(--accent-iris))/0.2] to-[hsl(var(--accent-cobalt))/0.2] border-[hsl(var(--accent-iris))/0.35]",
    cyan: "from-[hsl(var(--accent-flamingo))/0.2] to-[hsl(var(--accent-iris))/0.2] border-[hsl(var(--accent-flamingo))/0.35]",
  };
  
  const valueColors = {
    blue: "text-[hsl(var(--accent-cobalt))]",
    emerald: "text-[hsl(var(--accent-mint))]",
    amber: "text-[hsl(var(--accent-gold))]",
    purple: "text-[hsl(var(--accent-iris))]",
    cyan: "text-[hsl(var(--accent-flamingo))]",
  };
  
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : trend === "neutral" ? AlertTriangle : null;
  
  return (
    <Card className={`relative overflow-hidden border-l-4 shadow-md hover:shadow-lg transition-all duration-200 ${colorClasses[color]}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-50`} />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </CardTitle>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${valueColors[color]}`}>{value}</p>
          {TrendIcon && (
            <TrendIcon 
              className={`h-5 w-5 ${
                trend === "up" ? "text-emerald-500" : 
                trend === "down" ? "text-rose-500" : 
                "text-amber-500"
              }`} 
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{helper}</p>
      </CardContent>
    </Card>
  );
}
