import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildMarkSnapshot } from "@/lib/calculations";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin, getUserSchoolIds, getPrimaryRoleKey } from "@/lib/auth";

const payloadSchema = z.object({
  entries: z
    .array(
      z.object({
        assessmentId: z.string(),
        studentId: z.string(),
        rawMark: z.number().nullable().optional(),
        isAbsent: z.boolean().optional(),
        absenceCode: z.string().nullable().optional(),
        comment: z.string().nullable().optional(),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  // Authorize the request - marks require mark:update permission
  const authResult = await authorizeWithSchool(request, "mark:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Validate school access for all assessments being modified
  const entryAssessmentIds = [...new Set(parsed.data.entries.map((entry) => entry.assessmentId))];
  const assessmentsWithSchool = await prisma.assessment.findMany({
    where: { id: { in: entryAssessmentIds } },
    select: {
      id: true,
      assessmentPlan: {
        select: {
          status: true,
          classGroup: {
            select: {
              id: true,
              schoolId: true,
            },
          },
        },
      },
    },
  });

  // Check user has access to all schools involved
  const schoolIds = new Set(
    assessmentsWithSchool.map((a) => a.assessmentPlan.classGroup.schoolId)
  );
  for (const schoolId of schoolIds) {
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to one or more schools" }, { status: 403 });
    }
  }

  // Verify teacher assignment for non-admin/HOD/SMT users
  // Teachers should only edit marks for classes they're assigned to
  const primaryRoleKey = getPrimaryRoleKey(auth);
  const isTeacherRole = primaryRoleKey === "teacher";
  const isElevatedRole = ["hod", "smt", "admin"].includes(primaryRoleKey || "");

  if (isTeacherRole && !isElevatedRole && !isSystemAdmin(auth)) {
    if (!auth.user.teacherId) {
      return NextResponse.json(
        { error: "Teacher account not properly linked" },
        { status: 400 }
      );
    }

    // Get unique class IDs from the assessments
    const classIds = [...new Set(
      assessmentsWithSchool.map((a) => a.assessmentPlan.classGroup.id)
    )];

    // Verify teacher is assigned to all classes being modified
    const teacherAssignments = await prisma.classTeacherAssignment.findMany({
      where: {
        teacherId: auth.user.teacherId,
        classGroupId: { in: classIds },
      },
      select: {
        classGroupId: true,
      },
    });

    const assignedClassIds = new Set(teacherAssignments.map((a) => a.classGroupId));
    const unassignedClasses = classIds.filter((classId) => !assignedClassIds.has(classId));

    if (unassignedClasses.length > 0) {
      return NextResponse.json(
        { error: "You are not assigned to one or more of these classes" },
        { status: 403 }
      );
    }
  }

  // Prevent edits on locked or pending plans unless admin
  if (!isSystemAdmin(auth)) {
    const lockedPlan = assessmentsWithSchool.find(
      (a) => a.assessmentPlan.status === "PendingApproval" || a.assessmentPlan.status === "Locked"
    );
    if (lockedPlan) {
      return NextResponse.json({ error: "Parent assessment plan is not editable" }, { status: 409 });
    }
  }

  await prisma.$transaction(
    parsed.data.entries.map((entry) =>
      prisma.mark.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: entry.assessmentId,
            studentId: entry.studentId,
          },
        },
        update: {
          rawMark: entry.isAbsent ? null : entry.rawMark ?? null,
          isAbsent: entry.isAbsent ?? false,
          absenceCode: entry.absenceCode ?? null,
          comment: entry.comment ?? null,
          status: entry.isAbsent ? "Draft" : "Finalised",
        },
        create: {
          assessmentId: entry.assessmentId,
          studentId: entry.studentId,
          rawMark: entry.isAbsent ? null : entry.rawMark ?? null,
          isAbsent: entry.isAbsent ?? false,
          absenceCode: entry.absenceCode ?? null,
          comment: entry.comment ?? null,
        },
      }),
    ),
  );

  const assessmentIds = [...new Set(parsed.data.entries.map((entry) => entry.assessmentId))];
  const assessmentMap = await prisma.assessment.findMany({
    where: { id: { in: assessmentIds } },
    select: { id: true, assessmentPlanId: true },
  });
  const planStudentMap = new Map<string, Set<string>>();
  const planIds = new Set<string>();
  for (const entry of parsed.data.entries) {
    const assessment = assessmentMap.find((item) => item.id === entry.assessmentId);
    if (!assessment) continue;
    planIds.add(assessment.assessmentPlanId);
    const studentSet = planStudentMap.get(assessment.assessmentPlanId) ?? new Set<string>();
    studentSet.add(entry.studentId);
    planStudentMap.set(assessment.assessmentPlanId, studentSet);
  }

  if (planIds.size > 0) {
    const plans = await prisma.assessmentPlan.findMany({
      where: { id: { in: Array.from(planIds) } },
      include: {
        assessments: {
          orderBy: { sequence: "asc" },
          include: {
            marks: {
              where: {
                studentId: {
                  in: Array.from(new Set(parsed.data.entries.map((entry) => entry.studentId))),
                },
              },
            },
          },
        },
        classGroup: {
          include: {
            subject: true,
            school: { include: { gradingConfig: true } },
          },
        },
      },
    });

    const snapshotOperations = plans.flatMap((plan) => {
      const studentIds = Array.from(planStudentMap.get(plan.id) ?? []);
      const terms = Array.from(new Set(plan.assessments.map((assessment) => assessment.term)));
      return studentIds.flatMap((studentId) =>
        terms.map((term) => {
          const snapshot = buildMarkSnapshot({
            assessmentPlanId: plan.id,
            studentId,
            term,
            assessments: plan.assessments,
            gradingConfig: plan.classGroup.school?.gradingConfig ?? null,
            phase: plan.classGroup.subject?.phase ?? "FET",
          });
          return prisma.markSnapshot.upsert({
            where: {
              assessmentPlanId_studentId_term: {
                assessmentPlanId: plan.id,
                studentId,
                term,
              },
            },
            update: snapshot,
            create: snapshot,
          });
        }),
      );
    });
    await prisma.$transaction(snapshotOperations);
  }

  return NextResponse.json({ success: true });
}
