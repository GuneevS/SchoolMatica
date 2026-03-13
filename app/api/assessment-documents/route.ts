import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const createSchema = z.object({
  assessmentPlanId: z.string().optional(),
  assessmentId: z.string().optional(),
  threadId: z.string().optional(),
  label: z.string().min(2),
  fileName: z.string().min(2),
  mimeType: z.string().min(2),
  fileUrl: z.string().url(),
  storageKey: z.string().min(2),
  status: z.enum(["Draft", "Pending", "Approved", "ChangesRequested"]).optional(),
  uploadedByRole: z.enum(["Teacher", "HOD", "SMT"]),
  uploadedByName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessmentDocument:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const assessmentPlanId = searchParams.get("assessmentPlanId") ?? undefined;
    const assessmentId = searchParams.get("assessmentId") ?? undefined;

    // Validate school access if filtering by plan
    if (assessmentPlanId) {
      const plan = await prisma.assessmentPlan.findUnique({
        where: { id: assessmentPlanId },
        select: { classGroup: { select: { schoolId: true } } },
      });
      if (plan && !hasSchoolAccess(auth, plan.classGroup.schoolId)) {
        return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
      }
    }

    const documents = await prisma.assessmentDocument.findMany({
      where: {
        assessmentPlanId,
        assessmentId,
      },
      include: { approvals: true },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(documents);

  } catch (error) {
    return handleApiError("GET assessment-documents", error);
  }
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "assessmentDocument:upload");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    if (!parsed.data.assessmentPlanId && !parsed.data.assessmentId && !parsed.data.threadId) {
      return NextResponse.json({ error: "Document must target a plan, assessment, or thread." }, { status: 400 });
    }

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

    // Use actual user info
    const uploadedByRole = auth.user.roleAssignments[0]?.role.name ?? parsed.data.uploadedByRole;
    const uploadedByName = auth.user.displayName ?? auth.user.email;

    const document = await prisma.assessmentDocument.create({
      data: {
        ...parsed.data,
        uploadedByRole,
        uploadedByName,
      },
      include: { approvals: true },
    });
    return NextResponse.json(document, { status: 201 });

  } catch (error) {
    return handleApiError("POST assessment-documents", error);
  }
}

