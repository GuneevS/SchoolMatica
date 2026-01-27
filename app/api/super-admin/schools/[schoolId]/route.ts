/**
 * Super Admin Single School API
 *
 * Provides detailed school management for super administrators.
 * Includes viewing details, updating settings, and deleting schools.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";

const updateSchoolSchema = z.object({
  name: z.string().min(3).optional(),
  shortCode: z.string().min(2).max(10).optional().nullable(),
});

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/super-admin/schools/:schoolId
 * Get detailed school information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      gradingConfig: true,
      gradeLevels: { orderBy: { order: "asc" } },
      subjects: { orderBy: { name: "asc" } },
      _count: {
        select: {
          classes: true,
          teachers: true,
          users: true,
          auditLogs: true,
          timetables: true,
        },
      },
    },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Get additional statistics
  const [studentCount, adminUsers, recentAuditLogs] = await Promise.all([
    prisma.student.count({
      where: { classGroup: { schoolId } },
    }),
    prisma.appUser.findMany({
      where: {
        roleAssignments: {
          some: {
            scopeSchoolId: schoolId,
            role: { key: { in: ["admin", "smt", "hod"] } },
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        roleAssignments: {
          where: { scopeSchoolId: schoolId },
          include: { role: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    ...school,
    statistics: {
      students: studentCount,
      teachers: school._count.teachers,
      classes: school._count.classes,
      users: school._count.users,
    },
    adminUsers,
    recentAuditLogs,
  });
}

/**
 * PATCH /api/super-admin/schools/:schoolId
 * Update school settings
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { schoolId } = await params;

  const json = await request.json();
  const parsed = updateSchoolSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Check if school exists
  const existing = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!existing) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Check for duplicate short code if changing
  if (parsed.data.shortCode && parsed.data.shortCode !== existing.shortCode) {
    const duplicate = await prisma.school.findUnique({
      where: { shortCode: parsed.data.shortCode },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A school with this short code already exists" },
        { status: 409 }
      );
    }
  }

  const school = await prisma.school.update({
    where: { id: schoolId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.shortCode !== undefined && { shortCode: parsed.data.shortCode }),
    },
    include: { gradingConfig: true },
  });

  return NextResponse.json(school);
}

/**
 * DELETE /api/super-admin/schools/:schoolId
 * Delete a school (with safety checks)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { schoolId } = await params;

  // Check if school exists and get counts
  const [school, counts] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        _count: {
          select: {
            classes: true,
            teachers: true,
            users: true,
          },
        },
      },
    }),
  ]);

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Safety check - don't allow deletion if school has data
  const hasData =
    (counts?._count.classes ?? 0) > 0 ||
    (counts?._count.teachers ?? 0) > 0 ||
    (counts?._count.users ?? 0) > 0;

  if (hasData) {
    return NextResponse.json(
      {
        error: "Cannot delete school with existing data. Remove all teachers, users, and classes first.",
        counts: counts?._count,
      },
      { status: 409 }
    );
  }

  // Delete school and its grading config
  await prisma.$transaction(async (tx) => {
    // Delete grade levels
    await tx.gradeLevel.deleteMany({ where: { schoolId } });

    // Delete subjects
    await tx.subject.deleteMany({ where: { schoolId } });

    // Delete the school
    await tx.school.delete({ where: { id: schoolId } });

    // Delete orphaned grading config if exists
    if (school.gradingConfigId) {
      await tx.gradingConfig.delete({ where: { id: school.gradingConfigId } }).catch(() => {
        // Ignore if already deleted
      });
    }
  });

  return NextResponse.json({ success: true, deleted: schoolId });
}
