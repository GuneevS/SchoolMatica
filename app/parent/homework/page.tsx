import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ParentHomeworkClient } from "./parent-homework-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Homework | Parent Portal | SchoolMatica",
  description: "View your children's homework assignments and submission status.",
};

export default async function ParentHomeworkPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Get parent user with all children data
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  gradeLevel: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    redirect("/login");
  }

  // Get all children IDs
  const childrenIds = parentUser.contacts.map((c) => c.student.id);

  if (childrenIds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Children Linked</h2>
          <p className="text-muted-foreground">
            Your account is not linked to any students yet.
          </p>
        </div>
      </div>
    );
  }

  // Get all homework for children's classes
  const allHomework = await prisma.homework.findMany({
    where: {
      classGroup: {
        students: { some: { id: { in: childrenIds } } },
      },
      status: "Active",
    },
    include: {
      classGroup: {
        include: {
          gradeLevel: true,
          students: {
            where: { id: { in: childrenIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      teacher: true,
      submissions: {
        where: { studentId: { in: childrenIds } },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  // Process homework data for the client
  const now = new Date();
  
  const processedHomework = allHomework.map((hw) => {
    // Get the child this homework is for
    const childInClass = hw.classGroup.students[0];
    const submission = hw.submissions.find((s) => s.studentId === childInClass?.id);
    
    // Determine status
    let status: "pending" | "submitted" | "late" | "missing" | "excused" = "pending";
    const isOverdue = hw.dueDate < now;
    
    if (submission) {
      if (submission.status === "Submitted") status = "submitted";
      else if (submission.status === "Late") status = "late";
      else if (submission.status === "Excused") status = "excused";
      else if (isOverdue) status = "missing";
    } else if (isOverdue) {
      status = "missing";
    }

    return {
      id: hw.id,
      title: hw.title,
      description: hw.description,
      subject: hw.subject,
      className: hw.classGroup.name,
      gradeLevel: hw.classGroup.gradeLevel?.name || `Grade ${hw.classGroup.grade}`,
      teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
      assignedDate: hw.assignedDate.toISOString(),
      dueDate: hw.dueDate.toISOString(),
      status,
      isOverdue,
      points: hw.points,
      childId: childInClass?.id || "",
      childName: childInClass ? `${childInClass.firstName} ${childInClass.lastName}` : "",
      submittedAt: submission?.submittedAt?.toISOString() || null,
      homeworkGrade: submission?.grade || null,
      feedback: submission?.feedback || null,
    };
  });

  // Get children data for filter
  const children = parentUser.contacts.map((c) => ({
    id: c.student.id,
    name: `${c.student.firstName} ${c.student.lastName}`,
    grade: c.student.classGroup.gradeLevel?.name || `Grade ${c.student.classGroup.grade}`,
    className: c.student.classGroup.name,
  }));

  // Get unique subjects for filter
  const subjects = [...new Set(allHomework.map((hw) => hw.subject))];

  // Calculate stats
  const stats = {
    total: processedHomework.length,
    pending: processedHomework.filter((hw) => hw.status === "pending").length,
    submitted: processedHomework.filter((hw) => hw.status === "submitted" || hw.status === "late").length,
    missing: processedHomework.filter((hw) => hw.status === "missing").length,
    overdue: processedHomework.filter((hw) => hw.isOverdue && hw.status !== "submitted" && hw.status !== "late" && hw.status !== "excused").length,
  };

  return (
    <ParentHomeworkClient
      homework={processedHomework}
      children={children}
      subjects={subjects}
      stats={stats}
    />
  );
}
