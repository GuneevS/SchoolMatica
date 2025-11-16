import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ planId: string }>;
}

const updateSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["Draft", "PendingApproval", "Approved", "Locked"]).optional(),
  termCount: z.number().min(1).max(4).optional(),
  termWeights: z
    .record(z.string(), z.number().min(0))
    .optional()
    .refine((value) => {
      if (!value) return true;
      const total = Object.values(value).reduce((sum, item) => sum + item, 0);
      return total === 0 || Math.abs(total - 100) < 0.01;
    }, "Term weights must sum to approximately 100%"),
});

export async function GET(_: NextRequest, { params }: Params) {
  const { planId } = await params;
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: {
      classGroup: { include: { subject: true } },
      assessments: { orderBy: { sequence: "asc" } },
      documents: true,
      moderationThreads: {
        include: { comments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { planId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const plan = await prisma.assessmentPlan.update({
    where: { id: planId },
    data: parsed.data,
  });
  return NextResponse.json(plan);
}
