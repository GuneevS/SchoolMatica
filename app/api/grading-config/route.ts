import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";

const SCHOOL_COOKIE = "sm-school-id";

const bandSchema = z.object({
  minPercent: z.number().min(0).max(100),
  level: z.number().int().min(1).max(7),
  descriptor: z.string(),
});

const payloadSchema = z.object({
  phases: z.record(z.string(), z.array(bandSchema)),
});

export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "school:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const schoolId =
    searchParams.get("schoolId") ?? request.cookies.get(SCHOOL_COOKIE)?.value ?? auth.user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "School ID is required" }, { status: 400 });
  }

  if (!isSystemAdmin(auth) && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { gradingConfig: true },
  });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  return NextResponse.json(school.gradingConfig);
}

export async function PUT(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "school:manage");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const schoolId =
    searchParams.get("schoolId") ?? request.cookies.get(SCHOOL_COOKIE)?.value ?? auth.user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "School ID is required" }, { status: 400 });
  }

  if (!isSystemAdmin(auth) && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, gradingConfigId: true, name: true },
  });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  if (!school.gradingConfigId) {
    const created = await prisma.gradingConfig.create({
      data: {
        name: `${school.name} Grading`,
        phasesJson: parsed.data.phases,
      },
    });
    await prisma.school.update({
      where: { id: school.id },
      data: { gradingConfigId: created.id },
    });
    return NextResponse.json(created);
  }

  const updated = await prisma.gradingConfig.update({
    where: { id: school.gradingConfigId },
    data: { phasesJson: parsed.data.phases },
  });

  return NextResponse.json(updated);
}
