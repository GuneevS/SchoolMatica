import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/dashboard";
import { ClassPerformanceChart } from "@/components/dashboard/class-performance-chart";
import { HelpPanel } from "@/components/help/help-panel";
import { dashboardHelp } from "@/lib/help-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import { WelcomeBanner } from "@/components/welcome-banner";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <HelpPanel page="dashboard" content={dashboardHelp} />
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-gradient drop-shadow-2xl mb-2" style={{backgroundSize: "300% 300%"}}>
                Dashboard
              </h1>
              <p className="text-lg text-muted-foreground font-medium">Welcome back! Here&rsquo;s your school&rsquo;s performance overview</p>
            </div>
            {/* Tour button temporarily disabled - will implement proper tour later */}
            {/* <TourButton steps={dashboardTour} data-tour="tour-button" /> */}
          </div>

          <WelcomeBanner
            title="Welcome to SchoolMatica"
            description="Your comprehensive assessment management system. Track student performance, manage assessment plans, and ensure quality through moderation."
            tips={[
              "Click the help button (bottom right) for detailed guidance on any page",
              "Switch roles using the dropdown in the header to see different permissions",
              "Hover over info icons for quick tips and explanations",
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-tour="summary-stats">
            <SummaryStat
              label="Classes"
              value={data.totals.classes.toString()}
              helper={`${data.totals.students} learners tracked`}
              tooltip="Total number of active class groups with assessment plans"
              color="blue"
              trend="neutral"
            />
            <SummaryStat
              label="Average SBA"
              value={`${data.totals.averageSba.toFixed(1)}%`}
              helper="Across all learners captured"
              tooltip="School-wide average of all student SBA percentages. Calculated from weighted assessments."
              color="emerald"
              trend={data.totals.averageSba >= 60 ? "up" : data.totals.averageSba >= 50 ? "neutral" : "down"}
            />
            <SummaryStat
              label="Open Moderation"
              value={data.totals.openThreads.toString()}
              helper="Threads awaiting action"
              tooltip="Moderation discussions that need resolution. Click to view and respond."
              color="purple"
              trend={data.totals.openThreads === 0 ? "up" : "neutral"}
            />
            <SummaryStat
              label="Plans Pending"
              value={data.totals.pendingPlans.toString()}
              helper="Need SMT approval"
              tooltip="Assessment plans waiting for HOD or SMT approval before being locked for marking"
              color="amber"
              trend={data.totals.pendingPlans === 0 ? "up" : "neutral"}
            />
          </div>

      <Card className="overflow-hidden border-2 border-blue-600 shadow-2xl" data-tour="performance-chart">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b-2 border-blue-700">
          <CardTitle className="flex items-center gap-2 text-white font-bold">
            <TrendingUp className="h-6 w-6 text-white animate-pulse drop-shadow" />
            Class Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ClassPerformanceChart data={data.classSummaries} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-2 border-emerald-600 shadow-2xl" data-tour="class-table">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-b-2 border-emerald-700">
          <CardTitle className="text-white font-bold">Class Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avg SBA</TableHead>
                <TableHead>At-risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.classSummaries.map((summary) => (
                <TableRow key={summary.id}>
                  <TableCell className="font-medium">{summary.name}</TableCell>
                  <TableCell>{summary.subject}</TableCell>
                  <TableCell>{summary.totalStudents}</TableCell>
                  <TableCell>{summary.planStatus}</TableCell>
                  <TableCell>
                    {summary.averageSba === null ? "—" : `${summary.averageSba.toFixed(1)}%`}
                  </TableCell>
                  <TableCell>{summary.atRiskCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-2 border-amber-600 shadow-2xl" data-tour="recent-plans">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-b-2 border-amber-700">
            <CardTitle className="text-white font-bold">Recent Assessment Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {data.recentPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="group flex items-center justify-between rounded-lg border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:scale-[1.02]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary transition-colors">{plan.name}</p>
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
        <Card className="overflow-hidden border-2 border-purple-600 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-b-2 border-purple-700">
            <CardTitle className="text-white font-bold">Open Moderation Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {data.openThreads.map((thread, index) => (
              <div
                key={thread.id}
                className="group rounded-lg border border-l-4 border-l-purple-500 p-4 text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="font-medium group-hover:text-purple-600 transition-colors">{thread.createdByRole}</p>
                <p className="text-muted-foreground">{thread.label}</p>
              </div>
            ))}
            {data.openThreads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-100 p-3 mb-3">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium">All threads resolved!</p>
                <p className="text-xs text-muted-foreground">Great work keeping up with moderation</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-2 border-cyan-600 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-b-2 border-cyan-700">
            <CardTitle className="text-white font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {data.auditLogs.map((log, index) => (
              <div
                key={log.id}
                className="group rounded-lg border p-3 text-sm transition-all duration-200 hover:border-blue-500/40 hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="font-medium group-hover:text-blue-600 transition-colors">
                  {log.action.replaceAll("_", " ")}
                </p>
                    <p className="text-xs text-muted-foreground">
                      {log.entityType} · {formatDateTime(log.createdAt)}
                    </p>
                {log.actorRole && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      {log.actorRole}
                    </span>
                  </p>
                )}
              </div>
            ))}
            {data.auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No recent changes.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
      </TooltipProvider>
    </>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  tooltip,
  trend,
  color = "blue",
}: {
  label: string;
  value: string;
  helper: string;
  tooltip?: string;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "emerald" | "amber" | "purple";
}) {
  const colorClasses = {
    blue: "from-blue-600 to-cyan-600 border-blue-700 shadow-blue-500/50",
    emerald: "from-emerald-600 to-teal-600 border-emerald-700 shadow-emerald-500/50",
    amber: "from-amber-600 to-orange-600 border-amber-700 shadow-amber-500/50",
    purple: "from-purple-600 to-pink-600 border-purple-700 shadow-purple-500/50",
  };

  const iconColors = {
    blue: "text-white",
    emerald: "text-white",
    amber: "text-white",
    purple: "text-white",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] border-2 shadow-xl bg-gradient-to-br ${colorClasses[color]}`}
    >
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase font-bold text-white/90 tracking-wider">{label}</p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-white/80 hover:text-white transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <CardTitle className={`text-4xl md:text-5xl font-black ${iconColors[color]} drop-shadow-lg`}>{value}</CardTitle>
          {trend && (
            <TrendIcon
              className={`h-6 w-6 ${trend === "up" ? "text-white/90" : trend === "down" ? "text-white/70" : "text-white/80"} drop-shadow`}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-sm text-white/90 font-semibold">{helper}</p>
      </CardContent>
    </Card>
  );
}

