/**
 * Super Admin Dashboard API
 *
 * Provides platform-wide statistics and overview for super administrators.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";

/**
 * GET /api/super-admin/dashboard
 * Get platform-wide statistics
 */
export async function GET(request: NextRequest) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  // Gather comprehensive platform statistics
  const [
    schoolCount,
    userCount,
    teacherCount,
    studentCount,
    classCount,
    assessmentPlanCount,
    recentSchools,
    recentUsers,
    schoolsWithStats,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.appUser.count(),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.classGroup.count(),
    prisma.assessmentPlan.count(),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        shortCode: true,
        createdAt: true,
        _count: {
          select: { users: true, teachers: true },
        },
      },
    }),
    prisma.appUser.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        roleAssignments: {
          include: { role: { select: { key: true, name: true } } },
        },
      },
    }),
    prisma.school.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        _count: {
          select: {
            users: true,
            teachers: true,
            classes: true,
            subjects: true,
          },
        },
      },
    }),
  ]);

  // Calculate additional statistics
  const schoolsWithAdmins = await prisma.userRoleAssignment.groupBy({
    by: ["scopeSchoolId"],
    where: {
      scopeSchoolId: { not: null },
      role: { key: { in: ["admin", "smt"] } },
    },
    _count: true,
  });

  const schoolAdminCounts = new Map(
    schoolsWithAdmins.map((s) => [s.scopeSchoolId, s._count])
  );

  // Build the dashboard response
  return NextResponse.json({
    overview: {
      totalSchools: schoolCount,
      totalUsers: userCount,
      totalTeachers: teacherCount,
      totalStudents: studentCount,
      totalClasses: classCount,
      totalAssessmentPlans: assessmentPlanCount,
    },
    recentActivity: {
      schools: recentSchools.map((school) => ({
        ...school,
        userCount: school._count.users,
        teacherCount: school._count.teachers,
      })),
      users: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        school: user.school,
        roles: user.roleAssignments.map((ra) => ra.role),
      })),
    },
    schoolBreakdown: schoolsWithStats.map((school) => ({
      id: school.id,
      name: school.name,
      shortCode: school.shortCode,
      users: school._count.users,
      teachers: school._count.teachers,
      classes: school._count.classes,
      subjects: school._count.subjects,
      admins: schoolAdminCounts.get(school.id) ?? 0,
    })),
  });
}
