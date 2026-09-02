import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, isSuperAdmin } from "@/lib/auth";
import { apiSuccess, apiError, withApi } from "@/lib/api";

export const dynamic = "force-dynamic";

const NOTIFICATION_TYPES = [
  "demerit_alert",
  "threshold_warning",
  "merit_celebration",
  "behavior_general",
] as const;

const notifyParentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "Select at least one student"),
  type: z.enum(NOTIFICATION_TYPES).default("behavior_general"),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
  /**
   * Optional override of the notification title. If omitted, a sensible
   * default is generated from `type`.
   */
  title: z.string().min(1).max(120).optional(),
  /**
   * Optional URL the parent should land on when they tap the notification.
   * Defaults to /parent/behavior so the parent goes straight to the relevant
   * portal.
   */
  actionUrl: z.string().optional(),
});

const TITLE_DEFAULTS: Record<(typeof NOTIFICATION_TYPES)[number], string> = {
  demerit_alert: "Behaviour incident reported",
  threshold_warning: "Behaviour threshold reached",
  merit_celebration: "Merit earned",
  behavior_general: "School update about your child",
};

/**
 * POST /api/behavior/notify-parents
 *
 * Sends behaviour-related notifications to the linked parent accounts for
 * each provided student. Only parents who have an `AppUser` linked via
 * `ParentContact.parentUserId` receive an in-app notification. Students whose
 * parents have no app account are reported in `unreachableStudentIds` so the
 * caller can fall back to email if desired in the future.
 *
 * Body:
 *   {
 *     studentIds: string[],
 *     type: "demerit_alert" | "threshold_warning" | "merit_celebration" | "behavior_general",
 *     message: string,
 *     title?: string,
 *     actionUrl?: string,
 *   }
 *
 * Response (200):
 *   { data: { notifiedUserCount, processedStudentCount, unreachableStudentIds } }
 */
export const POST = withApi(async (request: NextRequest) => {
  const result = await authorizeWithSchool(request, "student:update");
  if ("error" in result) return result.error;
  const { auth } = result;

  const json = await request.json().catch(() => null);
  const parsed = notifyParentsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("validation_failed", "Invalid request body", {
      details: parsed.error.flatten(),
    });
  }

  const { studentIds, type, message, title, actionUrl } = parsed.data;
  const callerIsSuperAdmin = isSuperAdmin(auth);
  const callerSchoolId = auth.user.schoolId;
  if (!callerSchoolId && !callerIsSuperAdmin) {
    return apiError(
      "forbidden",
      "You do not have access to a school context.",
    );
  }

  // Load the students with their parent contacts. Scope to the caller's
  // school (unless super admin) to prevent cross-tenant notifications.
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      ...(callerSchoolId && !callerIsSuperAdmin
        ? { classGroup: { schoolId: callerSchoolId } }
        : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      classGroup: { select: { schoolId: true } },
      parents: {
        select: {
          id: true,
          fullName: true,
          parentUserId: true,
        },
      },
    },
  });

  // Track which inputs we could not reach — either student not found, not
  // in the caller's school, or has no parent with an app-user link.
  const foundIds = new Set(students.map((s) => s.id));
  const unreachableStudentIds: string[] = studentIds.filter(
    (id) => !foundIds.has(id),
  );

  const notificationRecords: {
    userId: string;
    schoolId: string | null;
    type: string;
    title: string;
    body: string;
    actionUrl: string;
    data: string;
  }[] = [];

  for (const student of students) {
    const linkedParents = student.parents.filter(
      (p): p is typeof p & { parentUserId: string } => Boolean(p.parentUserId),
    );

    if (linkedParents.length === 0) {
      unreachableStudentIds.push(student.id);
      continue;
    }

    const resolvedTitle = title ?? TITLE_DEFAULTS[type];
    const studentName = `${student.firstName} ${student.lastName}`;

    for (const parent of linkedParents) {
      notificationRecords.push({
        userId: parent.parentUserId,
        schoolId: student.classGroup.schoolId,
        type: "behavior",
        title: `${resolvedTitle} — ${studentName}`,
        body: message,
        actionUrl: actionUrl ?? `/parent/behavior?studentId=${student.id}`,
        data: JSON.stringify({
          studentId: student.id,
          studentName,
          behaviorType: type,
          sentBy: auth.user.id,
          sentByName: auth.user.displayName ?? null,
        }),
      });
    }
  }

  let notifiedUserCount = 0;
  if (notificationRecords.length > 0) {
    const created = await prisma.notification.createMany({
      data: notificationRecords,
    });
    notifiedUserCount = created.count;
  }

  return apiSuccess({
    notifiedUserCount,
    processedStudentCount: students.length,
    unreachableStudentIds: Array.from(new Set(unreachableStudentIds)),
  });
}, { routeName: "behavior/notify-parents" });
