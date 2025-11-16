import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cloneTemplateToPlan } from "@/lib/assessment-service";

const createSchema = z.object({
  name: z.string().min(3),
  year: z.number().min(2000),
  termCount: z.number().min(1).max(4),
  classGroupId: z.string(),
  templateId: z.string().optional(),
  useTemplateAssessments: z.boolean().optional(),
  termWeights: z
    .record(z.string(), z.number().min(0))
    .optional()
    .refine((value) => {
      if (!value) return true;
      const total = Object.values(value).reduce((sum, item) => sum + item, 0);
      return total === 0 || Math.abs(total - 100) < 0.01;
    }, "Term weights must sum to approximately 100%"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const plans = await prisma.assessmentPlan.findMany({
    where: classId ? { classGroupId: classId } : undefined,
    include: {
      classGroup: { include: { subject: true } },
      template: true,
      documents: true,
      assessments: { orderBy: { sequence: "asc" } },
      _count: { select: { assessments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { name, year, termCount, classGroupId, templateId, useTemplateAssessments, termWeights } = parsed.data;

  if (templateId && useTemplateAssessments !== false) {
    const plan = await cloneTemplateToPlan({
      templateId,
      classGroupId,
      year,
      name,
    });
    if (termWeights) {
      const updated = await prisma.assessmentPlan.update({
        where: { id: plan.id },
        data: { termWeights },
      });
      return NextResponse.json(updated, { status: 201 });
    }
    return NextResponse.json(plan, { status: 201 });
  }

  const plan = await prisma.assessmentPlan.create({
    data: {
      name,
      year,
      termCount,
      status: "Draft",
      classGroupId,
      termWeights: termWeights ?? undefined,
    },
  });
  return NextResponse.json(plan, { status: 201 });
}
