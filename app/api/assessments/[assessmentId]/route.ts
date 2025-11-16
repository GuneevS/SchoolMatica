import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateWeightsForPlan } from "@/lib/assessment-service";

interface Params {
  params: Promise<{ assessmentId: string }>;
}

const updateSchema = z.object({
  taskName: z.string().optional(),
  term: z.enum(["T1", "T2", "T3", "T4"]).optional(),
  totalMark: z.number().min(1).optional(),
  rawWeight: z.number().min(0).optional(),
  status: z.enum(["Draft", "Active", "Archived"]).optional(),
  type: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  isPatComponent: z.boolean().optional(),
  termWeightOverride: z.number().min(0).optional(),
  category: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { assessmentId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const assessment = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  if (parsed.data.rawWeight !== undefined) {
    await recalculateWeightsForPlan(existing.assessmentPlanId);
  }

  return NextResponse.json(assessment);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { assessmentId } = await params;
  const existing = await prisma.assessment.delete({
    where: { id: assessmentId },
  });
  await recalculateWeightsForPlan(existing.assessmentPlanId);
  return NextResponse.json({ success: true });
}
