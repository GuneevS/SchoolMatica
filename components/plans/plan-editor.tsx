"use client";

import { type ReactNode, useState, useTransition } from "react";
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
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoleStore } from "@/lib/stores/role-store";
import { AssessmentModerationDialog } from "@/components/plans/assessment-moderation-dialog";
import type { AssessmentWeightInsightMap } from "@/lib/calculations";

interface Props {
  plan: AssessmentPlan & { assessments: Assessment[] };
  threads: (ModerationThread & { comments: ModerationComment[] })[];
  weightInsights?: AssessmentWeightInsightMap;
}

export function PlanEditor({ plan, threads, weightInsights }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const role = useRoleStore((state) => state.role);
  const canEdit = role !== "Teacher";
  const [orderedAssessments, setOrderedAssessments] = useState(plan.assessments);
  const totalWeight = orderedAssessments.reduce((sum, item) => sum + item.weightPercent, 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const showEffectiveColumn = Boolean(weightInsights?.hasConfiguredTermWeights);

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
          taskName: `Task ${orderedAssessments.length + 1}`,
          term: "T1",
          totalMark: 10,
          rawWeight: 10,
        }),
      });
      router.refresh();
    });
  }

  function deleteAssessment(id: string) {
    if (!canEdit) return;
    startTransition(async () => {
      await fetch(`/api/assessments/${id}`, { method: "DELETE" });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total weight {totalWeight.toFixed(1)}%</p>
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Term weighting overview</span>
            {weightInsights.hasConfiguredTermWeights ? (
              <span className="text-emerald-500">Configured term weights active</span>
            ) : (
              <span>Using assessment-level weights only</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(weightInsights.termSummaries).map(([term, summary]) => (
              <div
                key={term}
                className="rounded-full border border-[hsl(var(--border))/0.5] bg-background px-3 py-1 text-xs"
              >
                <span className="font-semibold mr-2">{term}</span>
                <span>{summary.configuredWeightPercent.toFixed(1)}% target</span>
                {Math.abs(summary.deltaPercent) > 0.1 && (
                  <span className={summary.deltaPercent > 0 ? "text-emerald-500" : "text-amber-500"}>
                    {summary.deltaPercent > 0 ? "+" : ""}
                    {summary.deltaPercent.toFixed(1)}% delta
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
        <SortableContext items={orderedAssessments.map((assessment) => assessment.id)} strategy={verticalListSortingStrategy}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Raw weight</TableHead>
                <TableHead>Weight %</TableHead>
                {showEffectiveColumn && <TableHead>Effective %</TableHead>}
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedAssessments.map((assessment) => (
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
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={assessment.term}
                          onValueChange={(value) => mutateAssessment(assessment.id, { term: value as Assessment["term"] })}
                          disabled={!canEdit}
                        >
                          <SelectTrigger>
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
                        />
                      </TableCell>
                      <TableCell>{assessment.weightPercent.toFixed(1)}%</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </SortableContext>
      </DndContext>
      <Button variant="secondary" onClick={createAssessment} disabled={isPending || !canEdit}>
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
