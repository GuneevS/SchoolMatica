import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

interface Params {
  params: Promise<{ classId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "class:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  try {
    const { classId } = await params;
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classId },
      include: {
        subject: true,
        students: true,
        assessmentPlans: {
          orderBy: { createdAt: "desc" },
          include: { assessments: true },
        },
      },
    });

    if (!classGroup) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify user has access to this school
    if (!hasSchoolAccess(auth, classGroup.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    return NextResponse.json(classGroup);
  } catch (error) {
    return handleApiError("GET classes/[classId]", error);
  }
}
