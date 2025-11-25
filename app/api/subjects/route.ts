import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin, getUserSchoolIds } from "@/lib/auth";

const subjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  phase: z.string().min(2),
  schoolId: z.string(),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "subject:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;

  // Validate school access if schoolId is provided
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Build where clause based on user permissions
  let whereClause: { schoolId?: string | { in: string[] } } = {};
  if (isSystemAdmin(auth)) {
    if (schoolId) {
      whereClause = { schoolId };
    }
  } else {
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause = schoolId 
      ? { schoolId } 
      : { schoolId: { in: userSchoolIds } };
  }

  const subjects = await prisma.subject.findMany({
    where: whereClause,
    include: { school: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "subject:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = subjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify user has access to this school
  if (!hasSchoolAccess(auth, parsed.data.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const school = await prisma.school.findUnique({ where: { id: parsed.data.schoolId } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const subject = await prisma.subject.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      phase: parsed.data.phase,
      schoolId: parsed.data.schoolId,
    },
  });
  return NextResponse.json(subject, { status: 201 });
}
