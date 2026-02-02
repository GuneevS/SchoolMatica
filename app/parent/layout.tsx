import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";
import { ParentShell } from "@/components/parent/parent-shell";
import { prisma } from "@/lib/prisma";
import { type SchoolBranding } from "@/lib/branding";

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

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerAuthContext();

  if (!auth) {
    redirect("/login?callbackUrl=/parent");
  }

  // Verify user has a ParentUser record
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  school: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    // Not a parent - redirect to main dashboard with error
    redirect("/dashboard?error=parent_access_required");
  }

  // Get unread message count for this parent
  // First get threads where the parent is a participant, then count unread messages
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

    // Filter threads where the user is a participant (JSON array)
    const userThreadIds = threads
      .filter((t) => normaliseParticipantIds(t.participants).includes(auth.user.id))
      .map((t) => t.id);

    if (userThreadIds.length > 0) {
      // Get messages in those threads that are unread by this user
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

      // Count messages where user hasn't read (not in readBy array)
      unreadMessageCount = messages.filter((m) => {
        const readBy = normaliseParticipantIds(m.readBy);
        return !readBy.includes(auth.user.id);
      }).length;
    }
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    // Default to 0 on error
  }

  // Get child names for display
  const childNames = parentUser.contacts.map((c) => c.student.firstName);

  const schools = parentUser.contacts
    .map((c) => c.student.classGroup?.school)
    .filter((school): school is NonNullable<typeof school> => Boolean(school));
  const primarySchool = schools[0];
  const uniqueSchoolNames = Array.from(new Set(schools.map((school) => school.name)));
  const schoolName = uniqueSchoolNames.length === 1 ? uniqueSchoolNames[0] : "Multiple schools";
  const schoolBranding = (primarySchool?.branding as SchoolBranding | null) ?? null;

  // Get homework counts for badge display
  const childrenIds = parentUser.contacts.map((c) => c.student.id);
  let homeworkCount = { upcoming: 0, overdue: 0 };
  
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Count upcoming homework (due in next 7 days, not submitted)
    const upcomingHomework = await prisma.homework.count({
      where: {
        classGroup: {
          students: { some: { id: { in: childrenIds } } },
        },
        status: "Active",
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        submissions: {
          none: {
            studentId: { in: childrenIds },
            status: { in: ["Submitted", "Late", "Excused"] },
          },
        },
      },
    });

    // Count overdue homework (past due, not submitted)
    const overdueHomework = await prisma.homework.count({
      where: {
        classGroup: {
          students: { some: { id: { in: childrenIds } } },
        },
        status: "Active",
        dueDate: { lt: now },
        submissions: {
          none: {
            studentId: { in: childrenIds },
            status: { in: ["Submitted", "Late", "Excused"] },
          },
        },
      },
    });

    homeworkCount = { upcoming: upcomingHomework, overdue: overdueHomework };
  } catch (error) {
    console.error("Error fetching homework count:", error);
    // Default to 0 on error
  }

  return (
    <ParentShell
      user={{
        id: auth.user.id,
        email: auth.user.email || "",
        displayName: auth.user.displayName,
      }}
      schoolName={schoolName}
      branding={schoolBranding}
      unreadMessageCount={unreadMessageCount}
      homeworkCount={homeworkCount}
      childNames={childNames}
    >
      {children}
    </ParentShell>
  );
}
