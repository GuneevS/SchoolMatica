import { prisma } from "@/lib/prisma";
import { StudentDirectory } from "@/components/students/student-directory";
import { getActiveSchool } from "@/lib/school";

export default async function StudentsPage() {
  const school = await getActiveSchool();
  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Create one from the Schools workspace to get started.</p>
      </div>
    );
  }
  const students = await prisma.student.findMany({
    where: { classGroup: { schoolId: school.id } },
    include: {
      classGroup: { include: { subject: true } },
      advisor: true,
      parents: true,
    },
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
    advisorName: student.advisor ? `${student.advisor.firstName} ${student.advisor.lastName}` : null,
    parents: student.parents.map((parent) => ({
      id: parent.id,
      fullName: parent.fullName,
      relationship: parent.relationship,
      email: parent.email,
      phone: parent.phone,
      primary: parent.primary,
    })),
    updatedAt: student.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <StudentDirectory students={directoryData} />
    </div>
  );
}
