import { prisma } from "@/lib/prisma";
import { StudentDirectory } from "@/components/students/student-directory";
import { getServerAuthContext, getAuthorizedActiveSchool } from "@/lib/auth-server";
import { redirect } from "next/navigation";

// Force dynamic rendering - requires database
export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");

  const school = await getAuthorizedActiveSchool();
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
    subjectName: student.classGroup.subject?.name ?? "No Subject",
    subjectCode: student.classGroup.subject?.code ?? "",
    subjectPhase: student.classGroup.subject?.phase ?? "FET",
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
