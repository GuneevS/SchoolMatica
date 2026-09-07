/**
 * Super Admin Schools API
 *
 * Provides full school management capabilities for super administrators.
 * Includes listing all schools with statistics and creating new schools.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const defaultBands = {
  FET: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 40, level: 2, descriptor: "Elementary" },
    { minPercent: 50, level: 3, descriptor: "Moderate" },
    { minPercent: 60, level: 4, descriptor: "Adequate" },
    { minPercent: 70, level: 5, descriptor: "Substantial" },
    { minPercent: 80, level: 6, descriptor: "Meritorious" },
    { minPercent: 90, level: 7, descriptor: "Outstanding" },
  ],
};

const createSchoolSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters"),
  shortCode: z.string().min(2).max(10).optional(),
  gradingName: z.string().optional(),
  phases: z.record(z.string(), z.array(z.object({
    minPercent: z.number().min(0).max(100),
    level: z.number().min(1),
    descriptor: z.string(),
  }))).optional(),
});

/**
 * GET /api/super-admin/schools
 * List all schools with comprehensive statistics
 */
export async function GET(request: NextRequest) {
  try {    const result = await authorizeSuperAdmin(request);
    if ("error" in result) {
      return result.error;
    }

    const schools = await prisma.school.findMany({
      include: {
        gradingConfig: true,
        _count: {
          select: {
            classes: true,
            subjects: true,
            teachers: true,
            users: true,
            gradeLevels: true,
            auditLogs: true,
            timetables: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with additional statistics
    const enrichedSchools = await Promise.all(
      schools.map(async (school) => {
        const studentCount = await prisma.student.count({
          where: { classGroup: { schoolId: school.id } },
        });

        const adminCount = await prisma.userRoleAssignment.count({
          where: {
            scopeSchoolId: school.id,
            role: { key: { in: ["admin", "smt"] } },
          },
        });

        return {
          ...school,
          statistics: {
            students: studentCount,
            admins: adminCount,
            teachers: school._count.teachers,
            classes: school._count.classes,
            subjects: school._count.subjects,
            gradeLevels: school._count.gradeLevels,
            users: school._count.users,
          },
        };
      })
    );

    return NextResponse.json(enrichedSchools);

  } catch (error) {
    return handleApiError("GET super-admin/schools", error);
  }
}

/**
 * POST /api/super-admin/schools
 * Create a new school
 */
export async function POST(request: NextRequest) {
  try {    const result = await authorizeSuperAdmin(request);
    if ("error" in result) {
      return result.error;
    }

    const json = await request.json();
    const parsed = createSchoolSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    // Check for duplicate short code
    if (parsed.data.shortCode) {
      const existing = await prisma.school.findUnique({
        where: { shortCode: parsed.data.shortCode },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A school with this short code already exists" },
          { status: 409 }
        );
      }
    }

    // Create school with grading config in a transaction
    const school = await prisma.$transaction(async (tx) => {
      const gradingConfig = await tx.gradingConfig.create({
        data: {
          name: parsed.data.gradingName ?? `${parsed.data.name} Grading`,
          phasesJson: parsed.data.phases ?? defaultBands,
        },
      });

      return tx.school.create({
        data: {
          name: parsed.data.name,
          shortCode: parsed.data.shortCode,
          gradingConfig: { connect: { id: gradingConfig.id } },
        },
        include: { gradingConfig: true },
      });
    });

    return NextResponse.json(school, { status: 201 });

  } catch (error) {
    return handleApiError("POST super-admin/schools", error);
  }
}
