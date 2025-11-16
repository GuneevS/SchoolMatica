import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateWeightsForPlan } from "@/lib/assessment-service";

const createSchema = z.object({
  assessmentPlanId: z.string(),
  taskName: z.string().min(2),
  term: z.enum(["T1", "T2", "T3", "T4"]),
  totalMark: z.number().min(1),
  rawWeight: z.number().min(0),
  type: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  isPatComponent: z.boolean().optional(),
  termWeightOverride: z.number().min(0).optional(),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existingCount = await prisma.assessment.count({
    where: { assessmentPlanId: parsed.data.assessmentPlanId },
  });

  const assessment = await prisma.assessment.create({
    data: {
      ...parsed.data,
      sequence: existingCount + 1,
      weightPercent: 0,
      status: "Draft",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  await recalculateWeightsForPlan(parsed.data.assessmentPlanId);

  return NextResponse.json(assessment, { status: 201 });
}
