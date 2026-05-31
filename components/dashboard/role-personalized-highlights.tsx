"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleStore } from "@/lib/stores/role-store";
import type { DashboardData } from "@/lib/dashboard";
import { ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  data: DashboardData;
}

export function RolePersonalizedHighlights({ data }: Props) {
  const role = useRoleStore((state) => state.role);

  if (role === "Teacher") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-strong))/0.6] backdrop-blur-xl shadow-ambient-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" />
              Marking focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Classes with the lowest SBA averages need interventions first.</p>
            <ul className="space-y-2">
              {data.classSummaries
                .slice()
                .sort((a, b) => (a.averageSba ?? 101) - (b.averageSba ?? 101))
                .slice(0, 3)
                .map((summary) => (
                  <li
                    key={summary.id}
                    className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))/0.5] px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{summary.name}</p>
                      <p className="text-xs text-muted-foreground">{summary.subject}</p>
                    </div>
                    <span className="text-lg font-semibold text-destructive">
                      {summary.averageSba === null ? "—" : `${summary.averageSba.toFixed(1)}%`}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-strong))/0.6] backdrop-blur-xl shadow-ambient-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Capture outstanding marks for classes flagged above.</li>
              <li>Review moderation threads assigned to you.</li>
              <li>Prepare learner updates for upcoming SMT reviews.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "HOD") {
    const registrationsAwaiting = data.registrations.Submitted + data.registrations.InReview;
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-strong))/0.6] backdrop-blur-xl shadow-ambient-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Approval radar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-muted-foreground">
              Plans pending approval: <strong>{data.totals.pendingPlans}</strong>
            </p>
            <p className="text-muted-foreground">
              Registrations needing decision: <strong>{registrationsAwaiting}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-[hsl(var(--border))/0.5] p-3">
                <p className="uppercase tracking-wide text-muted-foreground/80">Submitted</p>
                <p className="text-2xl font-semibold">{data.registrations.Submitted}</p>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))/0.5] p-3">
                <p className="uppercase tracking-wide text-muted-foreground/80">In review</p>
                <p className="text-2xl font-semibold">{data.registrations.InReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-strong))/0.6] backdrop-blur-xl shadow-ambient-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Next best actions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>1. Approve assessment plans awaiting SMT sign-off.</p>
            <p>2. Finalize learner placements for Submitted registrations.</p>
            <p>3. Resolve outstanding moderation threads ({data.openThreads.length}).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAtRisk = data.classSummaries.reduce((sum, summary) => sum + summary.atRiskCount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <HighlightTile label="Compliance" value={`${data.registrations.Approved} approved`} helper="Registrations cleared" />
      <HighlightTile label="At-risk learners" value={`${totalAtRisk}`} helper="Across classes" />
      <HighlightTile label="Audit events" value={`${data.auditLogs.length}`} helper="Last 7 entries" />
    </div>
  );
}

function HighlightTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.4] bg-[hsl(var(--surface-strong))/0.6] backdrop-blur-xl shadow-ambient-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase text-muted-foreground tracking-[0.3em]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
