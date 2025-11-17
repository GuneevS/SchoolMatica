import { prisma } from "@/lib/prisma";
import { StudentDirectory } from "@/components/students/student-directory";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: { classGroup: { include: { subject: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const directoryData = students.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    admissionNumber: student.admissionNumber,
    gender: student.gender,
    grade: student.classGroup.grade,
    className: student.classGroup.name,
    classId: student.classGroup.id,
    subjectName: student.classGroup.subject.name,
    subjectCode: student.classGroup.subject.code,
    subjectPhase: student.classGroup.subject.phase,
    updatedAt: student.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <StudentDirectory students={directoryData} />
    </div>
  );
}
