import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/dashboard";
import { ClassPerformanceChart } from "@/components/dashboard/class-performance-chart";
import { HelpPanel } from "@/components/help/help-panel";
import { dashboardHelp } from "@/lib/help-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { WelcomeBanner } from "@/components/welcome-banner";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <HelpPanel page="dashboard" content={dashboardHelp} />
      <TooltipProvider>
        <div className="space-y-6">
          <WelcomeBanner
            title="Welcome to SchoolMatica"
            description="Your comprehensive assessment management system. Track student performance, manage assessment plans, and ensure quality through moderation."
            tips={[
              "Click the help button (bottom right) for detailed guidance on any page",
              "Switch roles using the dropdown in the header to see different permissions",
              "Hover over info icons for quick tips and explanations",
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label="Classes"
              value={data.totals.classes.toString()}
              helper={`${data.totals.students} learners tracked`}
              tooltip="Total number of active class groups with assessment plans"
            />
            <SummaryStat
              label="Average SBA"
              value={`${data.totals.averageSba.toFixed(1)}%`}
              helper="Across all learners captured"
              tooltip="School-wide average of all student SBA percentages. Calculated from weighted assessments."
            />
            <SummaryStat
              label="Open moderation"
              value={data.totals.openThreads.toString()}
              helper="Threads awaiting action"
              tooltip="Moderation discussions that need resolution. Click to view and respond."
            />
            <SummaryStat
              label="Plans pending"
              value={data.totals.pendingPlans.toString()}
              helper="Need SMT approval"
              tooltip="Assessment plans waiting for HOD or SMT approval before being locked for marking"
            />
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Class performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassPerformanceChart data={data.classSummaries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class overview</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Recent assessment plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.className} · {plan.subjectName}
                  </p>
                </div>
                <span className={statusTone(plan.status)}>{plan.status}</span>
              </div>
            ))}
            {data.recentPlans.length === 0 && (
              <p className="text-sm text-muted-foreground">No plans have been created yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open moderation threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.openThreads.map((thread) => (
              <div key={thread.id} className="rounded-md border p-4 text-sm">
                <p className="font-medium">{thread.createdByRole}</p>
                <p className="text-muted-foreground">{thread.label}</p>
              </div>
            ))}
            {data.openThreads.length === 0 && (
              <p className="text-sm text-muted-foreground">All threads are resolved.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{log.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {log.entityType} · {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.actorRole && <p className="text-xs text-muted-foreground">By {log.actorRole}</p>}
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
}: {
  label: string;
  value: string;
  helper: string;
  tooltip?: string;
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "Approved":
    case "Locked":
      return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
    case "PendingApproval":
      return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
    default:
      return "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
  }
}
