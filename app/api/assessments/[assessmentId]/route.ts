import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateWeightsForPlan } from "@/lib/assessment-service";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";

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

// Helper to get assessment with school info
async function getAssessmentWithSchool(assessmentId: string) {
  return prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      assessmentPlan: {
        select: { status: true, classGroup: { select: { schoolId: true } } },
      },
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessment:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { assessmentId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existing = await getAssessmentWithSchool(assessmentId);
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, existing.assessmentPlan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  if (existing.assessmentPlan.status === "PendingApproval" || existing.assessmentPlan.status === "Locked") {
    if (!isSystemAdmin(auth)) {
      return NextResponse.json({ error: "Plan is not editable in its current status" }, { status: 409 });
    }
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

export async function DELETE(request: NextRequest, { params }: Params) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessment:delete");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { assessmentId } = await params;
  
  const existing = await getAssessmentWithSchool(assessmentId);
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, existing.assessmentPlan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Check if assessment has marks before deleting
  const markCount = await prisma.mark.count({ where: { assessmentId } });
  if (markCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete assessment with ${markCount} existing marks. Archive it instead.` },
      { status: 409 }
    );
  }

  await prisma.assessment.delete({ where: { id: assessmentId } });
  await recalculateWeightsForPlan(existing.assessmentPlanId);
  
  return NextResponse.json({ success: true });
}
