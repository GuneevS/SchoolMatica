"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MarkbookPayload } from "@/lib/markbook";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useRoleStore } from "@/lib/stores/role-store";

interface Props {
  payload: MarkbookPayload;
}

export function MarkbookGrid({ payload }: Props) {
  const router = useRouter();
  const [termFilter, setTermFilter] = useState<string>("ALL");
  const [highlightLow, setHighlightLow] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(payload.rows[0]?.student.id ?? "");
  const [isPending, startTransition] = useTransition();
  const role = useRoleStore((state) => state.role);
  const canEdit = role === "Teacher";
  const [draftMarks, setDraftMarks] = useState<Record<string, Record<string, string>>>({});

  const rows = payload.rows;
  const activeStudentId = rows.some((row) => row.student.id === selectedStudentId)
    ? selectedStudentId
    : rows[0]?.student.id ?? "";
  const selectedRow = rows.find((row) => row.student.id === activeStudentId) ?? rows[0];
  const weightInsights = payload.weightInsights;
  const termSummaries = weightInsights?.termSummaries ?? {};
  const hasConfiguredTermWeights = payload.stats.hasTermWeights || Boolean(weightInsights?.hasConfiguredTermWeights);
  const assessments = useMemo(() => {
    if (termFilter === "ALL") return payload.assessments;
    return payload.assessments.filter((assessment) => assessment.term === termFilter);
  }, [payload.assessments, termFilter]);
  const showFinalColumn = hasConfiguredTermWeights;

  async function persistMark(entry: {
    assessmentId: string;
    studentId: string;
    rawMark: number | null;
    isAbsent?: boolean;
  }) {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch("/api/marks/bulk-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              assessmentId: entry.assessmentId,
              studentId: entry.studentId,
              rawMark: entry.rawMark,
              isAbsent: entry.isAbsent ?? false,
            },
          ],
        }),
      });
      setDraftMarks((state) => {
        const studentDraft = state[entry.studentId];
        if (!studentDraft) return state;
        const nextStudentDraft = { ...studentDraft };
        delete nextStudentDraft[entry.assessmentId];
        if (Object.keys(nextStudentDraft).length === 0) {
          const nextState = { ...state };
          delete nextState[entry.studentId];
          return nextState;
        }
        return { ...state, [entry.studentId]: nextStudentDraft };
      });
      router.refresh();
    });
  }

  function handleInputChange(studentId: string, assessmentId: string, value: string) {
    if (!canEdit) return;
    setDraftMarks((state) => ({
      ...state,
      [studentId]: {
        ...(state[studentId] ?? {}),
        [assessmentId]: value,
      },
    }));
  }

  function handlePersist(studentId: string, assessmentId: string, assessmentTotal: number) {
    if (!canEdit) return;
    const value = draftMarks[studentId]?.[assessmentId];
    if (value === undefined) return;
    const trimmed = value.trim();
    const isAbsent = trimmed === "-" || trimmed.toLowerCase() === "abs";
    const numeric = trimmed === "" || isAbsent ? null : Number(trimmed);
    if (!isAbsent && numeric !== null && Number.isNaN(numeric)) {
      return;
    }
    if (numeric !== null && numeric > assessmentTotal) {
      return;
    }
    if (isAbsent) {
      void persistMark({ assessmentId, studentId, rawMark: null, isAbsent: true });
    } else {
      void persistMark({ assessmentId, studentId, rawMark: numeric });
    }
  }

  function markAbsent(studentId: string, assessmentId: string) {
    if (!canEdit) return;
    setDraftMarks((state) => ({
      ...state,
      [studentId]: {
        ...(state[studentId] ?? {}),
        [assessmentId]: "-",
      },
    }));
    void persistMark({ assessmentId, studentId, rawMark: null, isAbsent: true });
  }

  function getDisplayValue(studentId: string, assessmentId: string, mark?: { rawMark: number | null; isAbsent: boolean }) {
    const draft = draftMarks[studentId]?.[assessmentId];
    if (draft !== undefined) return draft;
    if (!mark) return "";
    return mark.isAbsent ? "-" : mark.rawMark?.toString() ?? "";
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 overflow-auto rounded-lg border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))/0.5] p-4">
            <div className="flex items-center gap-2 text-sm">
              <Select value={termFilter} onValueChange={setTermFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All terms</SelectItem>
                  <SelectItem value="T1">Term 1</SelectItem>
                  <SelectItem value="T2">Term 2</SelectItem>
                  <SelectItem value="T3">Term 3</SelectItem>
                  <SelectItem value="T4">Term 4</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={highlightLow ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setHighlightLow((prev) => !prev)}
              >
                Highlight below 40%
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))/0.5] px-4 pb-4">
            <div className="text-right">
              {isPending && canEdit && <p className="text-xs text-muted-foreground">Saving…</p>}
              {!canEdit && <p className="text-xs text-muted-foreground">Switch to Teacher role to edit marks.</p>}
            </div>
          </div>
          {hasConfiguredTermWeights && (
            <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--border))/0.4] bg-muted/30 px-4 py-3 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                    Term weighting
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  <p>
                    Configured term weights rebalance each assessment automatically. Effective contribution is shown in the header below.
                  </p>
                </TooltipContent>
              </Tooltip>
              {Object.entries(termSummaries).map(([term, summary]) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))/0.4] bg-background/70 px-3 py-1 text-[0.7rem]"
                >
                  <span className="font-semibold">{term}</span>
                  <span className="text-muted-foreground">{summary.configuredWeightPercent.toFixed(1)}%</span>
                  {Math.abs(summary.deltaPercent) > 0.1 && (
                    <span className={summary.deltaPercent > 0 ? "text-emerald-500" : "text-amber-500"}>
                      {summary.deltaPercent > 0 ? "+" : ""}
                      {summary.deltaPercent.toFixed(1)}%
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-muted/60">
                <tr>
                  <th className="sticky left-0 bg-muted/60 p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Learner
                  </th>
                  {assessments.map((assessment) => {
                    const insight = weightInsights?.assessments?.[assessment.id];
                    return (
                      <th key={assessment.id} className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <div className="space-y-1">
                          <p>{assessment.taskName}</p>
                          <div className="flex items-center gap-2 text-[0.6rem] font-normal uppercase tracking-[0.3em] text-muted-foreground/80">
                            <span>{(insight?.effectiveFinalPercent ?? assessment.weightPercent ?? 0).toFixed(1)}%</span>
                            {insight && Math.abs((insight.effectiveFinalPercent ?? 0) - (insight.baseWeightPercent ?? 0)) > 0.1 && (
                              <Badge variant="outline" className="text-[0.55rem] uppercase">
                                base {(insight.baseWeightPercent ?? 0).toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">SBA %</th>
                  {showFinalColumn && <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Final %</th>}
                  <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Level</th>
                </tr>
              </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.student.id}
                  className={cn(
                    "border-b transition",
                    highlightLow && row.sbaPercent < 40 ? "bg-[hsl(var(--destructive))/0.08]" : "",
                    row.student.id === activeStudentId && "bg-primary/5",
                  )}
                  onClick={() => setSelectedStudentId(row.student.id)}
                >
                  <td className="sticky left-0 bg-[hsl(var(--surface-strong))] p-3 text-sm font-medium">
                    {row.student.firstName} {row.student.lastName}
                  </td>
                  {assessments.map((assessment) => {
                    const mark = row.marks.find((item) => item.assessmentId === assessment.id);
                    const displayValue = getDisplayValue(row.student.id, assessment.id, mark);
                    const numericValue = Number(displayValue);
                    const showWarning = Boolean(
                      displayValue && !Number.isNaN(numericValue) && numericValue > assessment.totalMark,
                    );
                    return (
                      <td key={assessment.id} className="p-3">
                        <Input
                          type="text"
                          value={displayValue}
                          onChange={(event) => handleInputChange(row.student.id, assessment.id, event.target.value)}
                          onBlur={() => handlePersist(row.student.id, assessment.id, assessment.totalMark)}
                          className={cn("h-9", showWarning && "border-red-500 focus-visible:ring-red-500")}
                          disabled={!canEdit}
                        />
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>/{assessment.totalMark}</span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => markAbsent(row.student.id, assessment.id)}
                              className="text-red-500 hover:underline"
                            >
                              Mark absent
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-3 text-sm font-semibold">{row.sbaPercent.toFixed(1)}%</td>
                  {showFinalColumn && (
                    <td className="p-3 text-sm font-semibold text-primary">{row.finalYearPercent.toFixed(1)}%</td>
                  )}
                  <td className="p-3 text-sm">Level {row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedRow && (
        <div className="shrink-0 w-full lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRow.student.firstName} {selectedRow.student.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                SBA {selectedRow.sbaPercent.toFixed(1)}% · Level {selectedRow.level}
                {showFinalColumn && ` · Final ${selectedRow.finalYearPercent.toFixed(1)}%`}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Object.entries(selectedRow.appliedTermWeights).map(([term, weight]) => (
                  <div key={term} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{term}</span>
                    <span>{weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              {Object.entries(selectedRow.termResults ?? {}).map(([term, value]) => (
                <div key={term} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{term}</span>
                    <span>{value.sbaPercent.toFixed(1)}% · w {value.weight.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, value.contribution)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span>PAT</span>
                <span>{selectedRow.componentBreakdown.patPercent.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>SBA (classroom)</span>
                <span>{selectedRow.componentBreakdown.schoolBasedPercent.toFixed(1)}%</span>
              </div>
              <div className="space-y-2">
                {selectedRow.marks.map((mark) => {
                  const assessment = payload.assessments.find((item) => item.id === mark.assessmentId);
                  if (!assessment) return null;
                  const insight = weightInsights?.assessments?.[assessment.id];
                  return (
                    <div key={mark.assessmentId} className="rounded-md border p-2">
                      <p className="text-sm font-medium">{assessment.taskName}</p>
                      <p className="text-xs text-muted-foreground">
                        {mark.isAbsent ? "Absent" : `${mark.rawMark ?? "-"}/${assessment.totalMark}`} · {assessment.term} · Eff.
                        {(insight?.effectiveFinalPercent ?? assessment.weightPercent ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
