import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool } from "@/lib/auth";

const bandSchema = z.object({
  minPercent: z.number().min(0).max(100),
  level: z.number().int().min(1).max(7),
  descriptor: z.string(),
});

const payloadSchema = z.object({
  phases: z.record(z.string(), z.array(bandSchema)),
});

export async function GET(request: NextRequest) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "gradingConfig:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  // Get school's grading configuration
  const schoolId = auth.user.schoolId ?? authResult.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "No school context. Select a school first." }, { status: 400 });
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
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "gradingConfig:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Get school's current grading configuration
  const schoolId = auth.user.schoolId ?? authResult.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "No school context. Select a school first." }, { status: 400 });
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { gradingConfig: true },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  if (!school.gradingConfig) {
    return NextResponse.json({ error: "School has no grading config" }, { status: 404 });
  }

  // Update the school's grading configuration
  const updated = await prisma.gradingConfig.update({
    where: { id: school.gradingConfig.id },
    data: { phasesJson: parsed.data.phases },
  });

  return NextResponse.json(updated);
}
