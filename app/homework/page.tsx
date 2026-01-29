import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HomeworkPageClient } from "./homework-client";

export default async function HomeworkPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const schoolId = auth.user.schoolId;
  if (!schoolId) redirect("/login");

  // Fetch homework with submissions and related data
  const homework = await prisma.homework.findMany({
    where: { schoolId },
    include: {
      teacher: true,
      classGroup: {
        include: {
          students: true,
        },
      },
      submissions: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  // Transform data for the client component
  const transformedHomework = homework.map((hw) => {
    const totalStudents = hw.classGroup.students.length;
    const submitted = hw.submissions.filter((s) => s.status === "Submitted").length;
    const late = hw.submissions.filter((s) => s.status === "Late").length;
    const missing = totalStudents - hw.submissions.filter((s) => 
      s.status === "Submitted" || s.status === "Late" || s.status === "Excused"
    ).length;

    return {
      id: hw.id,
      title: hw.title,
      subject: hw.subject,
      class: hw.classGroup.name,
      teacher: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
      assignedDate: hw.assignedDate.toISOString().split("T")[0],
      dueDate: hw.dueDate.toISOString().split("T")[0],
      status: hw.status,
      submissions: { submitted, late, missing },
      totalStudents,
    };
  });

  // Get all submissions for the submission details dialog
  const allSubmissions = homework.flatMap((hw) =>
    hw.submissions.map((sub) => ({
      homeworkId: hw.id,
      id: sub.id,
      student: `${sub.student.firstName} ${sub.student.lastName}`,
      status: sub.status,
      submittedAt: sub.submittedAt?.toISOString().replace("T", " ").slice(0, 16) || null,
      grade: sub.grade,
    }))
  );

  // Add missing students as "Missing" submissions
  homework.forEach((hw) => {
    const submittedStudentIds = hw.submissions.map((s) => s.studentId);
    hw.classGroup.students.forEach((student) => {
      if (!submittedStudentIds.includes(student.id)) {
        allSubmissions.push({
          homeworkId: hw.id,
          id: `missing-${student.id}`,
          student: `${student.firstName} ${student.lastName}`,
          status: "Missing",
          submittedAt: null,
          grade: null,
        });
      }
    });
  });

  return (
    <HomeworkPageClient
      homework={transformedHomework}
      submissions={allSubmissions}
    />
  );
}
