import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";
import { auditAssessmentPlanStatusChange } from "@/lib/audit";

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

// Helper to get plan with school info
async function getPlanWithSchool(planId: string) {
  return prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: {
      classGroup: { select: { schoolId: true } },
    },
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessmentPlan:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { planId } = await params;
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: {
      classGroup: { include: { subject: true, school: true } },
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

  // Verify school access
  if (!hasSchoolAccess(auth, plan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
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

  // Determine required permission based on status change
  const isStatusChange = parsed.data.status !== undefined;
  const isApprovalAction = parsed.data.status === "Approved" || parsed.data.status === "Locked";
  const permission = isApprovalAction 
    ? "assessmentPlan:approve" 
    : isStatusChange 
      ? "assessmentPlan:advance" 
      : "assessmentPlan:update";

  const authResult = await authorizeWithSchool(request, permission);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const existing = await getPlanWithSchool(planId);
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, existing.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Validate status transitions
  if (parsed.data.status) {
    const validTransitions: Record<string, string[]> = {
      "Draft": ["PendingApproval"],
      "PendingApproval": ["Draft", "Approved"],
      "Approved": ["Locked", "Draft"],
      "Locked": [], // Cannot transition from Locked (unless admin)
    };
    
    const currentStatus = existing.status;
    const newStatus = parsed.data.status;
    
    if (currentStatus === "Locked" && !isSystemAdmin(auth)) {
      return NextResponse.json({ error: "Cannot modify a locked plan" }, { status: 403 });
    }
    
    if (!validTransitions[currentStatus]?.includes(newStatus) && !isSystemAdmin(auth)) {
      return NextResponse.json({ 
        error: `Invalid status transition: ${currentStatus} → ${newStatus}` 
      }, { status: 400 });
    }
  }

  const plan = await prisma.assessmentPlan.update({
    where: { id: planId },
    data: parsed.data,
  });

  // Audit status changes
  if (parsed.data.status && parsed.data.status !== existing.status) {
    await auditAssessmentPlanStatusChange(
      auth,
      planId,
      existing.classGroup.schoolId,
      existing.status,
      parsed.data.status
    );
  }

  return NextResponse.json(plan);
}
