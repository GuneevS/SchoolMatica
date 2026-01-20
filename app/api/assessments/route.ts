import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateWeightsForPlan } from "@/lib/assessment-service";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";

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
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessment:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify school access for the assessment plan
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: parsed.data.assessmentPlanId },
    select: { status: true, classGroup: { select: { schoolId: true } } },
  });
  
  if (!plan) {
    return NextResponse.json({ error: "Assessment plan not found" }, { status: 404 });
  }
  
  if (!hasSchoolAccess(auth, plan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  if (plan.status === "PendingApproval" || plan.status === "Locked") {
    if (!isSystemAdmin(auth)) {
      return NextResponse.json({ error: "Plan is not editable in its current status" }, { status: 409 });
    }
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
