"use client";

import { type ReactNode, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Assessment, AssessmentPlan, ModerationComment, ModerationThread } from "@prisma/client";
import { Plus, Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useRoleStore } from "@/lib/stores/role-store";
import { AssessmentConfigCard } from "@/components/plans/assessment-config-card";
import type { AssessmentWeightInsightMap } from "@/lib/calculations";

interface Props {
  plan: AssessmentPlan & { assessments: Assessment[] };
  threads: (ModerationThread & { comments: ModerationComment[] })[];
  weightInsights?: AssessmentWeightInsightMap;
}

export function PlanEditorOptimized({ plan, threads, weightInsights }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const role = useRoleStore((state) => state.role);
  const canEdit = role !== "Teacher";
  const [orderedAssessments, setOrderedAssessments] = useState(plan.assessments);
  const [showExamples, setShowExamples] = useState(true);
  const totalWeight = orderedAssessments.reduce((sum, item) => sum + item.weightPercent, 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group by term
  const termGroups = orderedAssessments.reduce((acc, assessment) => {
    if (!acc[assessment.term]) {
      acc[assessment.term] = [];
    }
    acc[assessment.term].push(assessment);
    return acc;
  }, {} as Record<string, Assessment[]>);

  const termStats = Object.entries(termGroups).map(([term, assessments]) => ({
    term,
    count: assessments.length,
    totalWeight: assessments.reduce((sum, a) => sum + a.weightPercent, 0),
    averageMarks: assessments.reduce((sum, a) => sum + a.totalMark, 0) / assessments.length,
  }));

  function handleReorder(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const currentIndex = orderedAssessments.findIndex((item) => item.id === active.id);
    const newIndex = orderedAssessments.findIndex((item) => item.id === over.id);
    if (currentIndex === -1 || newIndex === -1) return;
    
    const nextAssessments = arrayMove(orderedAssessments, currentIndex, newIndex);
    setOrderedAssessments(nextAssessments);
    
    startTransition(async () => {
      await fetch(`/api/assessment-plans/${plan.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedAssessmentIds: nextAssessments.map((item) => item.id) }),
      });
      router.refresh();
    });
  }

  function mutateAssessment(id: string, data: Partial<Assessment>) {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch(`/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  }

  function createAssessment() {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch(`/api/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentPlanId: plan.id,
          taskName: `Assessment ${orderedAssessments.length + 1}`,
          term: "T1",
          totalMark: 10,
          rawWeight: 10,
        }),
      });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  }

  function deleteAssessment(id: string) {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  }

  function updateStatus(status: AssessmentPlan["status"]) {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch(`/api/assessment-plans/${plan.id}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus: status, actorRole: role }),
      });
      router.refresh();
    });
  }

  const SortableAssessment = ({ assessment }: { assessment: Assessment }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: assessment.id,
    });
    
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <AssessmentConfigCard
          assessment={assessment}
          onUpdate={(data) => mutateAssessment(assessment.id, data)}
          onDelete={() => deleteAssessment(assessment.id)}
          canEdit={canEdit}
          dragHandleProps={canEdit ? { ...attributes, ...listeners } : undefined}
          showExample={showExamples && orderedAssessments.indexOf(assessment) === 0}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Assessment Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Total weight: <strong className="text-foreground">{totalWeight.toFixed(1)}%</strong>
                {" • "}
                {orderedAssessments.length} assessment{orderedAssessments.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? "Hide" : "Show"} Examples
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateStatus("PendingApproval")} disabled={!canEdit}>
                Submit for Approval
              </Button>
              <Button size="sm" onClick={() => updateStatus("Approved")} disabled={!canEdit}>
                Approve Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-gradient-to-r from-[hsl(var(--accent-iris))/0.08] to-[hsl(var(--accent-cobalt))/0.08] border-[hsl(var(--accent-iris))/0.25]">
            <Info className="h-4 w-4 text-[hsl(var(--accent-iris))]" />
            <AlertDescription className="text-sm">
              <strong>Key Concept:</strong> Assessment <strong>total marks</strong> and <strong>weight percentage</strong> are independent!
              <br />
              <span className="text-xs text-muted-foreground">
                A quiz out of 5 marks can be worth 90% of term grade, while a test out of 100 marks can be worth 10%.
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Term Statistics */}
      {weightInsights && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {termStats.map(({ term, count, totalWeight, averageMarks }) => (
            <Card key={term}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge variant="outline">{term}</Badge>
                  <span className="text-xs text-muted-foreground">{count} assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Weight:</span>
                    <strong className="text-primary">{totalWeight.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Marks:</span>
                    <strong>{averageMarks.toFixed(0)}</strong>
                  </div>
                  {weightInsights.termSummaries?.[term] && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Configured:</span>
                      <strong className="text-emerald-600">
                        {weightInsights.termSummaries[term].configuredWeightPercent.toFixed(1)}%
                      </strong>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assessments List */}
      {!canEdit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Switch to HOD or SMT role to edit assessments and weights.
          </AlertDescription>
        </Alert>
      )}

      {mounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
          <SortableContext items={orderedAssessments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {orderedAssessments.map((assessment) => (
                <SortableAssessment key={assessment.id} assessment={assessment} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {orderedAssessments.map((assessment) => (
            <AssessmentConfigCard
              key={assessment.id}
              assessment={assessment}
              onUpdate={(data) => mutateAssessment(assessment.id, data)}
              onDelete={() => deleteAssessment(assessment.id)}
              canEdit={false}
              showExample={false}
            />
          ))}
        </div>
      )}

      {/* Add Button */}
      <Button
        onClick={createAssessment}
        disabled={isPending || !canEdit}
        size="lg"
        className="w-full"
        variant="outline"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Assessment
      </Button>
    </div>
  );
}
