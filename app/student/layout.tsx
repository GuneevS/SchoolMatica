import { StudentShell } from "@/components/student/student-shell";
import { prisma } from "@/lib/prisma";
import { type SchoolBranding } from "@/lib/branding";
import { getStudentContext } from "@/lib/student-context";

const normaliseParticipantIds = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normaliseParticipantIds(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") {
      return value as string[];
    }
    return (value as Array<{ id?: string }>).map((p) => p.id).filter(Boolean) as string[];
  }
  return [];
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, student, school } = await getStudentContext();

  const schoolBranding = (school?.branding as SchoolBranding | null) ?? null;
  const className = student.classGroup.name;
  const gradeLabel = student.classGroup.gradeLevel?.name ?? `Grade ${student.classGroup.grade}`;

  let unreadMessageCount = 0;
  try {
    const threads = await prisma.messageThread.findMany({
      where: {
        isArchived: false,
      },
      select: {
        id: true,
        participants: true,
      },
    });

    const userThreadIds = threads
      .filter((t) => normaliseParticipantIds(t.participants).includes(auth.user.id))
      .map((t) => t.id);

    if (userThreadIds.length > 0) {
      const messages = await prisma.message.findMany({
        where: {
          threadId: { in: userThreadIds },
          senderId: { not: auth.user.id },
        },
        select: {
          id: true,
          readBy: true,
        },
      });

      unreadMessageCount = messages.filter((m) => {
        const readBy = normaliseParticipantIds(m.readBy);
        return !readBy.includes(auth.user.id);
      }).length;
    }
  } catch (error) {
    console.error("Error fetching student unread message count:", error);
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let homeworkCount = { upcoming: 0, overdue: 0 };

  try {
    const [upcoming, overdue] = await Promise.all([
      prisma.homework.count({
        where: {
          classGroupId: student.classGroupId,
          status: "Active",
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
          submissions: {
            none: {
              studentId: student.id,
              status: { in: ["Submitted", "Late", "Excused"] },
            },
          },
        },
      }),
      prisma.homework.count({
        where: {
          classGroupId: student.classGroupId,
          status: "Active",
          dueDate: { lt: now },
          submissions: {
            none: {
              studentId: student.id,
              status: { in: ["Submitted", "Late", "Excused"] },
            },
          },
        },
      }),
    ]);

    homeworkCount = { upcoming, overdue };
  } catch (error) {
    console.error("Error fetching student homework count:", error);
  }

  const reportCount = await prisma.reportCard.count({
    where: {
      studentId: student.id,
      status: { in: ["Published", "Finalized"] },
    },
  });

  return (
    <StudentShell
      user={{
        id: auth.user.id,
        email: auth.user.email || "",
        displayName: auth.user.displayName,
      }}
      schoolName={school?.name ?? "SchoolMatica"}
      className={className}
      gradeLabel={gradeLabel}
      branding={schoolBranding}
      unreadMessageCount={unreadMessageCount}
      homeworkCount={homeworkCount}
      reportCount={reportCount}
    >
      {children}
    </StudentShell>
  );
}
