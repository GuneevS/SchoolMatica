import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reorderAssessments } from "@/lib/assessment-service";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ planId: string }>;
}

const schema = z.object({
  orderedAssessmentIds: z.array(z.string()).min(1),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "assessmentPlan:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { planId } = await params;

  // Fetch plan to verify school access
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    select: { classGroup: { select: { schoolId: true } } },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, plan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    await reorderAssessments(planId, parsed.data.orderedAssessmentIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

