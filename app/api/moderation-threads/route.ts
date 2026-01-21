import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";

const createSchema = z.object({
  assessmentPlanId: z.string().optional(),
  assessmentId: z.string().optional(),
  createdByRole: z.enum(["Teacher", "HOD", "SMT"]),
  message: z.string().min(3),
  title: z.string().optional(),
  kind: z.enum(["plan", "assessment", "moderation"]).optional(),
}).refine(
  (data) => {
    // Exactly one of assessmentPlanId OR assessmentId must be provided (XOR)
    const hasAssessmentPlan = !!data.assessmentPlanId;
    const hasAssessment = !!data.assessmentId;
    return hasAssessmentPlan !== hasAssessment; // XOR: true if exactly one is true
  },
  {
    message: "Thread must target exactly ONE of: assessmentPlanId OR assessmentId (not both, not neither)",
    path: ["assessmentPlanId"], // Shows error on this field
  }
);

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "moderation:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const assessmentPlanId = searchParams.get("assessmentPlanId");
  const assessmentId = searchParams.get("assessmentId");

  // Build where clause with school scoping
  let whereClause: any = {
    assessmentPlanId: assessmentPlanId ?? undefined,
    assessmentId: assessmentId ?? undefined,
  };

  // If filtering by plan or assessment, validate school access
  if (assessmentPlanId) {
    const plan = await prisma.assessmentPlan.findUnique({
      where: { id: assessmentPlanId },
      select: { classGroup: { select: { schoolId: true } } },
    });
    if (plan && !hasSchoolAccess(auth, plan.classGroup.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
  }

  // For non-admins without specific filters, scope to their schools
  if (!assessmentPlanId && !assessmentId && !isSystemAdmin(auth)) {
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause = {
      ...whereClause,
      OR: [
        { assessmentPlan: { classGroup: { schoolId: { in: userSchoolIds } } } },
        { assessment: { assessmentPlan: { classGroup: { schoolId: { in: userSchoolIds } } } } },
      ],
    };
  }

  const threads = await prisma.moderationThread.findMany({
    where: whereClause,
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "moderation:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  // XOR validation is now handled by the schema refine, no need for separate check

  // Validate school access for the target
  let schoolId: string | null = null;
  if (parsed.data.assessmentPlanId) {
    const plan = await prisma.assessmentPlan.findUnique({
      where: { id: parsed.data.assessmentPlanId },
      select: { classGroup: { select: { schoolId: true } } },
    });
    if (!plan) {
      return NextResponse.json({ error: "Assessment plan not found" }, { status: 404 });
    }
    schoolId = plan.classGroup.schoolId;
  } else if (parsed.data.assessmentId) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: parsed.data.assessmentId },
      select: { assessmentPlan: { select: { classGroup: { select: { schoolId: true } } } } },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    schoolId = assessment.assessmentPlan.classGroup.schoolId;
  }

  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Use actual user info for authorRole
  const authorRole = auth.user.roleAssignments[0]?.role.name ?? parsed.data.createdByRole;

  const thread = await prisma.moderationThread.create({
    data: {
      assessmentPlanId: parsed.data.assessmentPlanId,
      assessmentId: parsed.data.assessmentId,
      status: "Open",
      createdByRole: authorRole,
      title: parsed.data.title,
      kind: parsed.data.kind ?? (parsed.data.assessmentId ? "assessment" : "plan"),
      comments: {
        create: [
          {
            authorRole,
            message: parsed.data.message,
          },
        ],
      },
    },
    include: { comments: true, documents: true },
  });

  return NextResponse.json(thread, { status: 201 });
}
