import { NextRequest, NextResponse } from "next/server";
import { getClassMarkbookPayload } from "@/lib/markbook";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error-handler";

interface Params {
  params: Promise<{ classId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { classId } = await params;

  const authResult = await authorizeWithSchool(request, "class:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  try {
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classId },
      select: { schoolId: true },
    });
    if (!classGroup) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    if (!hasSchoolAccess(auth, classGroup.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const payload = await getClassMarkbookPayload(classId);
    if (!payload) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError("GET classes/[classId]/markbook", error);
  }
}
