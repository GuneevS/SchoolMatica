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
import { GripVertical, List, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRoleStore } from "@/lib/stores/role-store";
import { AssessmentModerationDialog } from "@/components/plans/assessment-moderation-dialog";
import type { AssessmentWeightInsightMap } from "@/lib/calculations";

interface Props {
  plan: AssessmentPlan & { assessments: Assessment[] };
  threads: (ModerationThread & { comments: ModerationComment[] })[];
  weightInsights?: AssessmentWeightInsightMap;
}

export function PlanEditorGrouped({ plan, threads, weightInsights }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const role = useRoleStore((state) => state.role);
  const canEdit = role !== "Teacher";
  const [orderedAssessments, setOrderedAssessments] = useState(plan.assessments);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");
  const totalWeight = orderedAssessments.reduce((sum, item) => sum + item.weightPercent, 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const showEffectiveColumn = Boolean(weightInsights?.hasConfiguredTermWeights);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group assessments by term
  const groupedAssessments = orderedAssessments.reduce((acc, assessment) => {
    if (!acc[assessment.term]) {
      acc[assessment.term] = [];
    }
    acc[assessment.term].push(assessment);
    return acc;
  }, {} as Record<string, Assessment[]>);

  // Calculate term totals
  const termTotals = Object.entries(groupedAssessments).map(([term, assessments]) => ({
    term,
    count: assessments.length,
    totalWeight: assessments.reduce((sum, a) => sum + a.weightPercent, 0),
    configuredWeight: weightInsights?.termSummaries?.[term]?.configuredWeightPercent,
  }));

  function handleReorder(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const currentIndex = orderedAssessments.findIndex((item) => item.id === active.id);
    const newIndex = orderedAssessments.findIndex((item) => item.id === over.id);
    if (currentIndex === -1 || newIndex === -1) return;
    const nextAssessments = arrayMove(orderedAssessments, currentIndex, newIndex);
    const previousAssessments = orderedAssessments;
    setOrderedAssessments(nextAssessments);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/assessment-plans/${plan.id}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedAssessmentIds: nextAssessments.map((item) => item.id) }),
        });
        if (!response.ok) {
          console.error("Failed to reorder assessments");
          setOrderedAssessments(previousAssessments);
          return;
        }
        router.refresh();
      } catch (error) {
        console.error("Network error reordering assessments:", error);
        setOrderedAssessments(previousAssessments);
      }
    });
  }

  function mutateAssessment(id: string, data: Partial<Assessment>) {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/assessments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          console.error("Failed to update assessment");
          return;
        }
        // Revalidate dashboard and current page
        await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
        router.refresh();
      } catch (error) {
        console.error("Network error updating assessment:", error);
      }
    });
  }

  function createAssessment(term?: string) {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentPlanId: plan.id,
            taskName: `Task ${orderedAssessments.length + 1}`,
            term: term || "T1",
            totalMark: 10,
            rawWeight: 10,
          }),
        });
        if (!response.ok) {
          console.error("Failed to create assessment");
          return;
        }
        // Revalidate dashboard and current page
        await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
        router.refresh();
      } catch (error) {
        console.error("Network error creating assessment:", error);
      }
    });
  }

  function deleteAssessment(id: string) {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
        if (!response.ok) {
          console.error("Failed to delete assessment");
          return;
        }
        // Revalidate dashboard and current page
        await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
        router.refresh();
      } catch (error) {
        console.error("Network error deleting assessment:", error);
      }
    });
  }

  function updateStatus(status: AssessmentPlan["status"]) {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/assessment-plans/${plan.id}/workflow`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStatus: status, actorRole: role }),
        });
        if (!response.ok) {
          console.error("Failed to update plan status");
          return;
        }
        router.refresh();
      } catch (error) {
        console.error("Network error updating plan status:", error);
      }
    });
  }

  const AssessmentRow = ({ assessment }: { assessment: Assessment }) => {
    if (!mounted) {
      return (
        <TableRow key={assessment.id}>
          <TableCell>
            <Button variant="ghost" size="icon" className="cursor-grab" disabled={true}>
              <GripVertical className="h-4 w-4" />
            </Button>
          </TableCell>
          <TableCell><Input defaultValue={assessment.taskName} disabled={true} className="min-w-[200px]" /></TableCell>
          <TableCell>{assessment.term}</TableCell>
          <TableCell>{assessment.totalMark}</TableCell>
          <TableCell>{assessment.rawWeight}</TableCell>
          <TableCell className="font-medium">{assessment.weightPercent.toFixed(1)}%</TableCell>
          {showEffectiveColumn && <TableCell>-</TableCell>}
          <TableCell></TableCell>
        </TableRow>
      );
    }
    
    return (
      <SortableAssessmentRow key={assessment.id} assessmentId={assessment.id}>
        {({ attributes, listeners }) => (
        <>
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab"
              disabled={!canEdit}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          </TableCell>
          <TableCell>
            <Input
              defaultValue={assessment.taskName}
              onBlur={(event) => mutateAssessment(assessment.id, { taskName: event.target.value })}
              disabled={!canEdit}
              className="min-w-[200px]"
            />
          </TableCell>
          <TableCell>
            <Select
              defaultValue={assessment.term}
              onValueChange={(value) => mutateAssessment(assessment.id, { term: value as Assessment["term"] })}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["T1", "T2", "T3", "T4"] as const).map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Input
              type="number"
              defaultValue={assessment.totalMark}
              onBlur={(event) =>
                mutateAssessment(assessment.id, {
                  totalMark: Number(event.target.value) || assessment.totalMark,
                })
              }
              disabled={!canEdit}
              className="w-20"
              min="1"
            />
          </TableCell>
          <TableCell>
            <Input
              type="number"
              defaultValue={assessment.rawWeight}
              onBlur={(event) =>
                mutateAssessment(assessment.id, {
                  rawWeight: Number(event.target.value) || assessment.rawWeight,
                })
              }
              disabled={!canEdit}
              className="w-24"
              min="0"
              step="0.5"
            />
          </TableCell>
          <TableCell className="font-medium">{assessment.weightPercent.toFixed(1)}%</TableCell>
          {showEffectiveColumn && (
            <TableCell>
              {(
                weightInsights?.assessments?.[assessment.id]?.effectiveFinalPercent ?? assessment.weightPercent
              ).toFixed(1)}%
            </TableCell>
          )}
          <TableCell className="text-right flex items-center gap-2 justify-end">
            <AssessmentModerationDialog
              assessment={assessment}
              threads={threads.filter((thread) => thread.assessmentId === assessment.id)}
              canResolve={role !== "Teacher"}
            />
            <Button variant="ghost" size="sm" onClick={() => deleteAssessment(assessment.id)} disabled={!canEdit}>
              Remove
            </Button>
          </TableCell>
        </>
      )}
    </SortableAssessmentRow>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Total weight {totalWeight.toFixed(1)}%</p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "grouped" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grouped")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              By Term
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => updateStatus("PendingApproval")} disabled={!canEdit}>
            Send for approval
          </Button>
          <Button size="sm" onClick={() => updateStatus("Locked")} disabled={!canEdit}>
            Approve & lock
          </Button>
        </div>
      </div>

      {!canEdit && <p className="text-xs text-muted-foreground">Switch to HOD or SMT role to edit weightings.</p>}
      
      {weightInsights && (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground mb-3">
            <span className="font-semibold text-foreground">Term weighting overview</span>
            {weightInsights.hasConfiguredTermWeights ? (
              <span className="text-emerald-500">Configured term weights active</span>
            ) : (
              <span>Using assessment-level weights only</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {termTotals.map(({ term, count, totalWeight, configuredWeight }) => (
              <div
                key={term}
                className="rounded-lg border bg-background px-3 py-2 text-xs space-y-1"
              >
                <div className="font-semibold flex items-center gap-2">
                  <Badge variant="outline">{term}</Badge>
                  <span className="text-muted-foreground">{count} assessments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Plan: {totalWeight.toFixed(1)}%</span>
                  {configuredWeight && (
                    <span className="text-emerald-600">→ {configuredWeight.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "grouped" ? (
        <Tabs defaultValue="T1" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${plan.termCount}, 1fr)` }}>
            {Array.from({ length: plan.termCount }, (_, i) => `T${i + 1}`).map((term) => (
              <TabsTrigger key={term} value={term}>
                {term}
                <Badge variant="secondary" className="ml-2">
                  {groupedAssessments[term]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {Array.from({ length: plan.termCount }, (_, i) => `T${i + 1}`).map((term) => (
            <TabsContent key={term} value={term} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Term {term.substring(1)} Assessments</CardTitle>
                    <Button size="sm" onClick={() => createAssessment(term)} disabled={!canEdit}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Assessment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {groupedAssessments[term]?.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
                      <SortableContext
                        items={groupedAssessments[term].map((a) => a.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead className="min-w-[200px]">Task</TableHead>
                              <TableHead className="w-24">Term</TableHead>
                              <TableHead className="w-24">Total</TableHead>
                              <TableHead className="w-28">Raw weight</TableHead>
                              <TableHead className="w-24">Weight %</TableHead>
                              {showEffectiveColumn && <TableHead className="w-28">Effective %</TableHead>}
                              <TableHead className="w-32"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedAssessments[term].map((assessment) => (
                              <AssessmentRow key={assessment.id} assessment={assessment} />
                            ))}
                          </TableBody>
                        </Table>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No assessments in this term yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => createAssessment(term)}
                        disabled={!canEdit}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
          <SortableContext items={orderedAssessments.map((assessment) => assessment.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[200px]">Task</TableHead>
                  <TableHead className="w-24">Term</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-28">Raw weight</TableHead>
                  <TableHead className="w-24">Weight %</TableHead>
                  {showEffectiveColumn && <TableHead className="w-28">Effective %</TableHead>}
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedAssessments.map((assessment) => (
                  <AssessmentRow key={assessment.id} assessment={assessment} />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}
      <Button variant="secondary" onClick={() => createAssessment()} disabled={isPending || !canEdit}>
        <Plus className="h-4 w-4 mr-2" />
        Add assessment
      </Button>
    </div>
  );
}

type SortableRowRenderProps = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

function SortableAssessmentRow({
  assessmentId,
  children,
}: {
  assessmentId: string;
  children: (props: SortableRowRenderProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assessmentId,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <TableRow ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </TableRow>
  );
}
