import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin, getUserSchoolIds } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const createSchema = z.object({
  schoolId: z.string(),
  classGroupId: z.string().optional(),
  learnerData: z.record(z.string(), z.unknown()),
  guardianData: z.record(z.string(), z.unknown()),
  supportingDocs: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "registration:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const classGroupId = searchParams.get("classGroupId") ?? undefined;
    const schoolId = searchParams.get("schoolId") ?? undefined;

    // Validate school access if schoolId is provided
    if (schoolId && !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Build where clause based on user permissions
    let whereClause: Prisma.LearnerRegistrationWhereInput = {
      status,
      classGroupId,
    };

    if (isSystemAdmin(auth)) {
      // Admin can see all registrations, optionally filtered by schoolId
      if (schoolId) {
        whereClause.schoolId = schoolId;
      }
    } else {
      // Non-admins can only see registrations from their schools
      const userSchoolIds = getUserSchoolIds(auth);
      whereClause.schoolId = schoolId 
        ? schoolId 
        : { in: userSchoolIds };
    }

    const registrations = await prisma.learnerRegistration.findMany({
      where: whereClause,
      include: {
        classGroup: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(registrations);

  } catch (error) {
    return handleApiError("GET registrations", error);
  }
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "registration:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
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

    if (parsed.data.classGroupId) {
      const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId } });
      if (!classGroup || classGroup.schoolId !== parsed.data.schoolId) {
        return NextResponse.json({ error: "Class group is invalid for this school" }, { status: 400 });
      }
    }

    const registration = await prisma.learnerRegistration.create({
      data: {
        schoolId: parsed.data.schoolId,
        classGroupId: parsed.data.classGroupId ?? undefined,
        learnerData: parsed.data.learnerData as Prisma.JsonObject,
        guardianData: parsed.data.guardianData as Prisma.JsonObject,
        supportingDocs: (parsed.data.supportingDocs as Prisma.JsonObject) ?? null,
        status: "Submitted",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(registration, { status: 201 });

  } catch (error) {
    return handleApiError("POST registrations", error);
  }
}

