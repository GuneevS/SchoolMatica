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

interface BulkNotificationParams {
  userIds: string[];
  schoolId?: string;
  type: "behavior" | "grade" | "message" | "announcement" | "report" | "system";
  title: string;
  body: string;
  actionUrl?: string;
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
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(params: BulkNotificationParams) {
  const { userIds, type, title, body, actionUrl, schoolId, data } = params;

  // Handle empty userIds array gracefully
  if (!userIds || userIds.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      actionUrl,
      schoolId,
      data: data ? JSON.stringify(data) : undefined,
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

  await createBulkNotifications({
    userIds: parentUserIds,
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

  await createBulkNotifications({
    userIds: parentUserIds,
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

  await createBulkNotifications({
    userIds: parentUserIds,
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

  await createBulkNotifications({
    userIds: users.map((u) => u.id),
    type: "announcement",
    title,
    body: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
    schoolId,
  });
}

/**
 * Notification threshold configuration type
 */
interface NotificationThreshold {
  points: number;
  name: string;
  notifyParent: boolean;
  notifyHOD: boolean;
  notifyPrincipal: boolean;
  sendEmail: boolean;
  action: string;
}

/**
 * Check if a student has crossed any demerit thresholds and send notifications
 */
export async function checkDemeritThresholds(
  studentId: string,
  schoolId: string,
  newDemeritTotal: number
) {
  // Get the school's behavior policy with thresholds
  const policy = await prisma.behaviorPolicy.findFirst({
    where: {
      schoolId,
      type: "Demerit",
      isActive: true,
    },
  });

  if (!policy || !policy.thresholds) return;

  const thresholds = policy.thresholds as NotificationThreshold[];
  
  // Get student details
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parents: {
        where: { parentUserId: { not: null } },
        include: {
          parentUser: {
            include: { user: true },
          },
        },
      },
      classGroup: {
        include: { school: true },
      },
    },
  });

  if (!student) return;

  // Check if previous balance was below any threshold that is now crossed
  const previousBalance = await prisma.behaviorBalance.findUnique({
    where: { studentId },
  });

  const previousTotal = previousBalance?.demeritTotal || 0;

  // Find thresholds that were just crossed
  const crossedThresholds = thresholds.filter(
    (t) => t.points > previousTotal && t.points <= newDemeritTotal
  );

  for (const threshold of crossedThresholds) {
    // Create trigger record
    await prisma.behaviorThresholdTrigger.create({
      data: {
        studentId,
        schoolId,
        type: "Demerit",
        thresholdValue: threshold.points,
        thresholdName: threshold.name,
        action: threshold.action,
        status: "Pending",
      },
    });

    const notificationTitle = `Demerit Alert: ${student.firstName} ${student.lastName}`;
    const notificationBody = `${student.firstName} has reached ${newDemeritTotal} demerit points (${threshold.name}). ${threshold.action === "hearing" ? "A disciplinary hearing may be required." : `Action: ${threshold.action.replace(/_/g, " ")}`}`;

    // Notify parents
    if (threshold.notifyParent) {
      const parentUserIds = student.parents
        .filter((p) => p.parentUser?.userId)
        .map((p) => p.parentUser!.userId);

      if (parentUserIds.length > 0) {
        await createBulkNotifications({
          userIds: parentUserIds,
          type: "behavior",
          title: notificationTitle,
          body: notificationBody,
          actionUrl: "/parent/behavior",
          schoolId,
          data: {
            studentId,
            threshold: threshold.name,
            demeritTotal: newDemeritTotal,
            action: threshold.action,
          },
        });
      }
    }

    // Notify HOD (users with HOD role at this school)
    if (threshold.notifyHOD) {
      const hodUsers = await prisma.appUser.findMany({
        where: {
          schoolId,
          roleAssignments: {
            some: {
              role: { key: { in: ["hod", "head_of_department", "department_head"] } },
            },
          },
        },
        select: { id: true },
      });

      if (hodUsers.length > 0) {
        await createBulkNotifications({
          userIds: hodUsers.map((u) => u.id),
          type: "behavior",
          title: notificationTitle,
          body: notificationBody,
          actionUrl: "/behavior",
          schoolId,
          data: {
            studentId,
            threshold: threshold.name,
            demeritTotal: newDemeritTotal,
          },
        });
      }
    }

    // Notify Principal
    if (threshold.notifyPrincipal) {
      const principalUsers = await prisma.appUser.findMany({
        where: {
          schoolId,
          roleAssignments: {
            some: {
              role: { key: { in: ["principal", "school_admin", "admin"] } },
            },
          },
        },
        select: { id: true },
      });

      if (principalUsers.length > 0) {
        await createBulkNotifications({
          userIds: principalUsers.map((u) => u.id),
          type: "behavior",
          title: `URGENT: ${notificationTitle}`,
          body: notificationBody,
          actionUrl: "/behavior",
          schoolId,
          data: {
            studentId,
            threshold: threshold.name,
            demeritTotal: newDemeritTotal,
            urgent: true,
          },
        });
      }
    }
  }
}
