import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transitionAssessmentPlanStatus } from "@/lib/domain/workflows";

interface Params {
  params: Promise<{ planId: string }>;
}

const schema = z.object({
  targetStatus: z.enum(["Draft", "PendingApproval", "Approved", "Locked"]),
  actorRole: z.enum(["Teacher", "HOD", "SMT"]),
  actorName: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { planId } = await params;
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  try {
    const updated = await transitionAssessmentPlanStatus({
      planId,
      targetStatus: parsed.data.targetStatus,
      actorRole: parsed.data.actorRole,
      actorName: parsed.data.actorName,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

