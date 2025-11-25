import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  order: z.number().int(),
  schoolId: z.string(),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "gradeLevel:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;

  // Validate school access if schoolId provided
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Build where clause with school scoping for non-admins
  let whereClause: any = schoolId ? { schoolId } : undefined;
  if (!schoolId && !isSystemAdmin(auth)) {
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause = { schoolId: { in: userSchoolIds } };
  }

  const grades = await prisma.gradeLevel.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(grades);
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "gradeLevel:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Validate school access
  if (!hasSchoolAccess(auth, parsed.data.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const grade = await prisma.gradeLevel.create({ data: parsed.data });
  return NextResponse.json(grade, { status: 201 });
}

