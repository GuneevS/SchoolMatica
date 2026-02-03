"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Assessment, AssessmentPlan } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from "recharts";
import {
  GripVertical,
  Plus,
  Trash2,
  Info,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Save,
  PieChart as PieChartIcon,
  Send,
  ThumbsUp,
  Lock,
  Unlock,
  AlertCircle,
  Clock
} from "lucide-react";
import type { AssessmentWeightInsightMap, TermWeights } from "@/lib/calculations";
import { useAuth, useCurrentRole } from "@/lib/hooks/use-auth";

interface Props {
  plan: AssessmentPlan & { assessments: Assessment[] };
  termWeights: TermWeights | null;
  weightInsights?: AssessmentWeightInsightMap;
}

export function UnifiedAssessmentWorkspace({ plan, termWeights: initialTermWeights, weightInsights }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const currentRole = useCurrentRole();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const { activeRoleKey } = useAuth();

  // Normalize role for UI checks - FIX APPLIED HERE
  const activeRoleName = currentRole?.role.name ?? "Teacher";
  const role = activeRoleName === "Head of Department" ? "HOD" :
    activeRoleName === "System Administrator" ? "SMT" :
      activeRoleName;

  // Local state for real-time updates
  const [assessments, setAssessments] = useState(plan.assessments);

  // Editing permissions based on status and role
  // Teachers can edit Draft plans, HOD/SMT can edit Draft and Approved plans
  // No one can edit Locked or PendingApproval plans
  const canEdit = (() => {
    if (plan.status === "Locked") return false; // No one can edit locked plans
    if (plan.status === "PendingApproval") return false; // No edits while pending approval
    if (plan.status === "Draft") return true; // Teachers, HODs, and SMT can all edit drafts
    if (plan.status === "Approved") return role === "HOD" || role === "SMT"; // Only HOD/SMT can edit approved
    return false;
  })();
  
  // Check if user can submit for approval (only plan owner or any role above)
  const canSubmit = plan.status === "Draft" && assessments.length > 0;
  
  // Check if user can approve (HOD or SMT only)
  const canApprove = (role === "HOD" || role === "SMT") && plan.status === "PendingApproval";
  
  // Check if user can lock (SMT only)
  const canLock = role === "SMT" && plan.status === "Approved";
  const [termWeights, setTermWeights] = useState<Record<string, number>>(() => {
    if (initialTermWeights) return initialTermWeights;
    const equal = 100 / plan.termCount;
    return Object.fromEntries(
      Array.from({ length: plan.termCount }, (_, i) => [`T${i + 1}`, equal])
    );
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Calculate totals
  const totalWeight = assessments.reduce((sum, a) => sum + a.weightPercent, 0);
  const termWeightTotal = Object.values(termWeights).reduce((sum, w) => sum + w, 0);
  const isTermWeightsValid = Math.abs(termWeightTotal - 100) < 0.01;

  // Group by term
  const termGroups = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.term]) acc[assessment.term] = [];
    acc[assessment.term].push(assessment);
    return acc;
  }, {} as Record<string, Assessment[]>);

  const termStats = Object.entries(termGroups).map(([term, asms]) => ({
    term,
    count: asms.length,
    totalWeight: asms.reduce((sum, a) => sum + a.weightPercent, 0),
    termWeight: termWeights[term] || 0,
  }));

  // Visualization colors
  const palette = ["#38bdf8", "#a855f7", "#fb7185", "#34d399", "#f97316", "#fbbf24", "#0ea5e9", "#22d3ee"];

  // Chart data for term weights
  const termWeightChartData = termStats
    .filter(stat => stat.termWeight > 0)
    .map((stat, index) => ({
      name: stat.term,
      value: Number(stat.termWeight.toFixed(2)),
      color: palette[index % palette.length],
    }));

  const updateAssessment = async (id: string, data: Partial<Assessment>) => {
    if (!canEdit) return;

    // Optimistic update
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    setHasChanges(true);

    startTransition(async () => {
      await fetch(`/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  };

  const updateTermWeights = async () => {
    if (!canEdit || !isTermWeightsValid) return;

    startTransition(async () => {
      await fetch(`/api/assessment-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termWeights }),
      });
      setHasChanges(false);
      router.refresh();
    });
  };

  const addAssessment = async (term: string) => {
    if (!canEdit) return;

    startTransition(async () => {
      await fetch(`/api/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentPlanId: plan.id,
          taskName: `Assessment ${assessments.length + 1}`,
          term,
          totalMark: 10,
          rawWeight: 10,
        }),
      });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  };

  const deleteAssessment = async (id: string) => {
    if (!canEdit) return;

    // Optimistic update
    setAssessments(prev => prev.filter(a => a.id !== id));

    startTransition(async () => {
      await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  };

  const updateAssessmentByPercentage = (id: string, newPercent: number, term: string) => {
    if (!canEdit) return;

    // 1. Get other assessments in this term
    const termAsms = assessments.filter(a => a.term === term && a.id !== id);
    const otherRawTotal = termAsms.reduce((sum, a) => sum + (a.rawWeight || 10), 0);

    // 2. Edge Case: If this is the only assessment, it MUST be 100%
    if (termAsms.length === 0) {
      if (newPercent !== 100) {
        // Force 100 or show warning? For simplicity, ignore non-100 logic or reset rawWeight to nice number
        updateAssessment(id, { rawWeight: 100 });
      }
      return;
    }

    // 3. Edge Case: Prevent 100% if others exist (would imply others are 0, which implies raw=infinity? No, if raw=Infinity, math breaks)
    // If user wants 100%, others must become 0? 
    // Let's Cap at 99.9% for safety or handle gracefully.
    const safePercent = Math.min(Math.max(newPercent, 0), 99.9);

    // 4. Calculate new Raw Weight
    // formula: Raw = (Target% * OtherTotal) / (100 - Target%)
    const newRaw = (safePercent * otherRawTotal) / (100 - safePercent);

    updateAssessment(id, { rawWeight: Number(newRaw.toFixed(2)) });
  };

  const updatePlanStatus = async (targetStatus: "Draft" | "PendingApproval" | "Approved" | "Locked") => {
    startTransition(async () => {
      await fetch(`/api/assessment-plans/${plan.id}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus,
          actorRole: (["Teacher", "HOD", "SMT"].includes(activeRoleName) ? activeRoleName : "Teacher") as "Teacher" | "HOD" | "SMT",
          actorName: "Current User" // TODO: Get from auth
        }),
      });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Status and Approval Actions */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Assessment Workspace
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{assessments.length}</strong> assessments
                </span>
                <span>•</span>
                <span>
                  Total: <strong className="text-foreground">{totalWeight.toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            {/* Approval Status Badge */}
            <div className="flex flex-col items-end gap-2">
              {plan.status === "Draft" && (
                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Draft
                </Badge>
              )}
              {plan.status === "PendingApproval" && (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-700 dark:text-blue-400 flex items-center gap-1 animate-pulse">
                  <Clock className="h-3 w-3" />
                  Pending Approval
                </Badge>
              )}
              {plan.status === "Approved" && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </Badge>
              )}
              {plan.status === "Locked" && (
                <Badge className="bg-gray-100 dark:bg-gray-700/50 border-gray-400 text-gray-700 dark:text-gray-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}

              <div className="flex gap-2">
                {hasChanges && canEdit && (
                  <Button size="sm" onClick={updateTermWeights} disabled={isPending || !isTermWeightsValid}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Weights
                  </Button>
                )}

                {/* Approval Action Buttons - Contextual based on status and role */}
                {canSubmit && (
                  <Button
                    size="sm"
                    onClick={() => updatePlanStatus("PendingApproval")}
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Submit for Approval
                  </Button>
                )}

                {plan.status === "PendingApproval" && role === "Teacher" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePlanStatus("Draft")}
                    disabled={isPending}
                  >
                    Withdraw
                  </Button>
                )}

                {canApprove && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePlanStatus("Draft")}
                      disabled={isPending}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updatePlanStatus("Approved")}
                      disabled={isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve Plan
                    </Button>
                  </>
                )}

                {canLock && (
                  <Button
                    size="sm"
                    onClick={() => updatePlanStatus("Locked")}
                    disabled={isPending}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Lock Plan
                  </Button>
                )}

                {plan.status === "Approved" && (role === "HOD" || role === "SMT") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePlanStatus("Draft")}
                    disabled={isPending}
                  >
                    Return to Draft
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Status Help Text */}
          {plan.status === "Draft" && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This plan is in <strong>Draft</strong> mode. Complete your assessments and term weights, then submit for approval.
              </AlertDescription>
            </Alert>
          )}

          {plan.status === "PendingApproval" && role === "Teacher" && (
            <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                This plan is awaiting approval from HOD or SMT. You can withdraw it to make changes.
              </AlertDescription>
            </Alert>
          )}

          {plan.status === "PendingApproval" && (role === "HOD" || role === "SMT") && (
            <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                This plan requires your approval. Review the assessments and weights before approving.
              </AlertDescription>
            </Alert>
          )}

          {plan.status === "Locked" && (
            <Alert className="mt-4 bg-gray-50 dark:bg-gray-900/20 border-gray-200">
              <Lock className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-sm text-gray-800 dark:text-gray-200">
                This plan is <strong>locked</strong> and cannot be modified. All assessments and weights are finalized.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* Visual Data Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Term Weight Distribution Pie Chart */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Term Weight Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {termWeightChartData.length > 0 ? (
              <div className="relative flex h-64 flex-col items-center justify-center">
                <div className="pointer-events-none absolute inset-6 rounded-[2rem] border border-primary/10 bg-gradient-to-br from-background via-background/90 to-background/60 shadow-inner"></div>
                <ResponsiveContainer>
                  <PieChart>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        return (
                          <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.payload?.name}</p>
                            <p className="text-lg font-semibold">{Number(item.value).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Final grade weight</p>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={termWeightChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={3}
                      cornerRadius={12}
                      stroke="transparent"
                    >
                      {termWeightChartData.map((entry, index) => (
                        <Cell key={`term-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total</p>
                  <p className="text-3xl font-semibold text-primary">{termWeightTotal.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Allocated</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Configure term weights to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall Assessment Distribution */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Assessment Weight Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="relative flex h-64 flex-col items-center justify-center">
                <div className="pointer-events-none absolute inset-6 rounded-[2rem] border border-primary/10 bg-gradient-to-br from-background via-background/90 to-background/60 shadow-inner"></div>
                <ResponsiveContainer>
                  <PieChart>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        return (
                          <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.payload?.name}</p>
                            <p className="text-lg font-semibold">{Number(item.value).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Assessment weight</p>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={assessments.map((a, idx) => ({
                        name: a.taskName,
                        value: Number(a.weightPercent.toFixed(2)),
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={3}
                      cornerRadius={12}
                      stroke="transparent"
                    >
                      {assessments.map((_, index) => (
                        <Cell key={`assessment-${index}`} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total</p>
                  <p className="text-3xl font-semibold text-primary">{totalWeight.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Allocated</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add assessments to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace */}
      <Tabs defaultValue="T1" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-auto" style={{ gridTemplateColumns: `repeat(${plan.termCount}, 1fr)` }}>
            {Array.from({ length: plan.termCount }, (_, i) => {
              const term = `T${i + 1}`;
              const stat = termStats.find(s => s.term === term);
              return (
                <TabsTrigger key={term} value={term} className="relative">
                  <Calendar className="h-4 w-4 mr-2" />
                  {term}
                  {stat && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {stat.count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Term Weight Quick View */}
          <Card className="px-4 py-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Term Weights:</span>
              {termStats.map(({ term, termWeight }) => (
                <div key={term} className="flex items-center gap-1">
                  <Badge variant="outline">{term}</Badge>
                  <span className="font-semibold">{termWeight.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Term Content */}
        {Array.from({ length: plan.termCount }, (_, i) => {
          const term = `T${i + 1}`;
          const termAssessments = termGroups[term] || [];
          const stat = termStats.find(s => s.term === term);

          return (
            <TabsContent key={term} value={term} className="space-y-4">
              {/* Term Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Term Weight Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {term} Weight Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Contribution to Final Grade</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={termWeights[term]?.toFixed(1) || 0}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setTermWeights(prev => ({ ...prev, [term]: value }));
                              setHasChanges(true);
                            }}
                            className="w-20 text-center font-bold"
                            min="0"
                            max="100"
                            step="0.5"
                            disabled={!canEdit}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                      <Slider
                        value={[termWeights[term] || 0]}
                        onValueChange={([value]) => {
                          setTermWeights(prev => ({ ...prev, [term]: value }));
                          setHasChanges(true);
                        }}
                        min={0}
                        max={100}
                        step={0.5}
                        disabled={!canEdit}
                        className="cursor-pointer"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assessments in term:</span>
                        <strong>{stat?.count || 0}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assessment total:</span>
                        <strong>{stat?.totalWeight.toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final contribution:</span>
                        <strong className="text-primary">{stat?.termWeight.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {term} Assessment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {termAssessments.length > 0 ? (
                      <>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Average total marks:</span>
                            <strong>
                              {(termAssessments.reduce((sum, a) => sum + a.totalMark, 0) / termAssessments.length).toFixed(0)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Weight range:</span>
                            <strong>
                              {Math.min(...termAssessments.map(a => a.weightPercent)).toFixed(1)}% - {Math.max(...termAssessments.map(a => a.weightPercent)).toFixed(1)}%
                            </strong>
                          </div>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-xs">
                            Total marks are independent of weights. A quiz/5 can be worth 90%!
                          </AlertDescription>
                        </Alert>
                      </>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          No assessments in this term yet. Add your first one below.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={() => addAssessment(term)} disabled={!canEdit || isPending} size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Assessment to {term}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Assessments List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assessments in {term}</CardTitle>
                </CardHeader>
                <CardContent>
                  {termAssessments.length > 0 ? (
                    <div className="space-y-3">
                      {termAssessments.map((assessment) => {
                        const termTotalRaw = termAssessments.reduce((sum, a) => sum + a.rawWeight, 0);
                        const isOnlyOne = termAssessments.length === 1;
                        const calculatedPercent = termTotalRaw > 0 ? (assessment.rawWeight / termTotalRaw) * 100 : 0;

                        return (
                          <Card key={assessment.id} className="border-l-4 border-l-primary/30">
                            <CardContent className="pt-4">
                              <div className="grid gap-4 md:grid-cols-5">
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs text-muted-foreground">Assessment Name</Label>
                                  <Input
                                    value={assessment.taskName}
                                    onChange={(e) => updateAssessment(assessment.id, { taskName: e.target.value })}
                                    disabled={!canEdit}
                                    className="font-semibold"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Total Marks</Label>
                                  <Input
                                    type="number"
                                    value={assessment.totalMark}
                                    onChange={(e) => updateAssessment(assessment.id, { totalMark: Number(e.target.value) })}
                                    disabled={!canEdit}
                                    min="1"
                                    className="text-center font-bold"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    Weight %
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="h-3 w-3 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Percentage of the {term} mark.</p>
                                          <p className="text-xs opacity-70">Adjusting this updates the Raw Weight automatically.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={isOnlyOne ? "100" : calculatedPercent.toFixed(1)}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) {
                                          updateAssessmentByPercentage(assessment.id, val, term);
                                        }
                                      }}
                                      disabled={!canEdit || isOnlyOne}
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      className="text-center font-bold text-primary pr-6"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Raw Points</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      value={assessment.rawWeight.toFixed(2)}
                                      onChange={(e) => updateAssessment(assessment.id, { rawWeight: Number(e.target.value) })}
                                      disabled={!canEdit}
                                      min="0"
                                      step="0.5"
                                      className="text-center font-bold text-muted-foreground bg-muted/50"
                                    />
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteAssessment(assessment.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Contribution:</span>
                                <Badge className="bg-primary">{((assessment.weightPercent * (termWeights[term] || 0)) / 100).toFixed(1)}% to Final Grade</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No assessments in {term} yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => addAssessment(term)}
                        disabled={!canEdit || isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Global Status */}
      <Card className={`border-2 ${isTermWeightsValid ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isTermWeightsValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-600">All term weights configured correctly</span>
                </>
              ) : (
                <>
                  <Info className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-600">
                    Term weights total: {termWeightTotal.toFixed(1)}% (should be 100%)
                  </span>
                </>
              )}
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
