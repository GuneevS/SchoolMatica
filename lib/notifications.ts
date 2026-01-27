import { prisma } from "@/lib/prisma";

/**
 * Notification service for creating and managing notifications
 */

interface CreateNotificationParams {
  userId: string;
  type: "behavior" | "grade" | "message" | "announcement" | "report" | "system";
  title: string;
  body: string;
  actionUrl?: string;
  schoolId?: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  actionUrl,
  schoolId,
  data,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl,
      schoolId,
      data: data ? JSON.stringify(data) : null,
    },
  });
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationParams, "userId">
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      schoolId: notification.schoolId,
      data: notification.data ? JSON.stringify(notification.data) : null,
    })),
  });
}

/**
 * Send behavior incident notification to parents
 */
export async function notifyParentsOfBehaviorIncident(
  studentId: string,
  incidentType: "Merit" | "Demerit",
  points: number,
  description: string
) {
  // Get student and their parent contacts
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parents: {
        where: {
          parentUserId: { not: null },
        },
        include: {
          parentUser: {
            include: {
              user: true,
            },
          },
        },
      },
      classGroup: {
        select: { schoolId: true },
      },
    },
  });

  if (!student) return;

  const parentUserIds = student.parents
    .filter((p) => p.parentUser?.userId)
    .map((p) => p.parentUser!.userId);

  if (parentUserIds.length === 0) return;

  await createBulkNotifications(parentUserIds, {
    type: "behavior",
    title: `${incidentType === "Merit" ? "Merit Awarded" : "Demerit Recorded"}: ${student.firstName}`,
    body: `${student.firstName} ${student.lastName} received ${points} ${incidentType.toLowerCase()} points. ${description}`,
    actionUrl: "/parent/behavior",
    schoolId: student.classGroup.schoolId,
    data: {
      studentId,
      incidentType,
      points,
    },
  });
}

/**
 * Send grade notification to parents
 */
export async function notifyParentsOfNewGrades(
  studentId: string,
  subjectName: string,
  assessmentName: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parents: {
        where: {
          parentUserId: { not: null },
        },
        include: {
          parentUser: {
            include: {
              user: true,
            },
          },
        },
      },
      classGroup: {
        select: { schoolId: true },
      },
    },
  });

  if (!student) return;

  const parentUserIds = student.parents
    .filter((p) => p.parentUser?.userId)
    .map((p) => p.parentUser!.userId);

  if (parentUserIds.length === 0) return;

  await createBulkNotifications(parentUserIds, {
    type: "grade",
    title: `New Marks Available: ${student.firstName}`,
    body: `${student.firstName}'s marks for ${assessmentName} in ${subjectName} have been published.`,
    actionUrl: "/parent/reports",
    schoolId: student.classGroup.schoolId,
    data: {
      studentId,
      subjectName,
      assessmentName,
    },
  });
}

/**
 * Send report card notification to parents
 */
export async function notifyParentsOfReportCard(
  studentId: string,
  term: string,
  year: number
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parents: {
        where: {
          parentUserId: { not: null },
        },
        include: {
          parentUser: {
            include: {
              user: true,
            },
          },
        },
      },
      classGroup: {
        select: { schoolId: true },
      },
    },
  });

  if (!student) return;

  const parentUserIds = student.parents
    .filter((p) => p.parentUser?.userId)
    .map((p) => p.parentUser!.userId);

  if (parentUserIds.length === 0) return;

  await createBulkNotifications(parentUserIds, {
    type: "report",
    title: `Report Card Available: ${student.firstName}`,
    body: `${student.firstName}'s ${term} ${year} report card is now available for viewing.`,
    actionUrl: "/parent/reports",
    schoolId: student.classGroup.schoolId,
    data: {
      studentId,
      term,
      year,
    },
  });
}

/**
 * Send school-wide announcement
 */
export async function sendSchoolAnnouncement(
  schoolId: string,
  title: string,
  content: string,
  audienceRoles?: string[]
) {
  // Get all users in the school
  const users = await prisma.appUser.findMany({
    where: {
      schoolId,
      ...(audienceRoles && {
        roleAssignments: {
          some: {
            role: {
              key: { in: audienceRoles },
            },
          },
        },
      }),
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await createBulkNotifications(
    users.map((u) => u.id),
    {
      type: "announcement",
      title,
      body: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
      schoolId,
    }
  );
}
