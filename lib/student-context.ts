import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

export async function getStudentContext() {
  const auth = await getServerAuthContext();

  if (!auth) {
    redirect("/login?callbackUrl=/student");
  }

  const studentUser = await prisma.studentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      student: {
        include: {
          behaviorBalance: true,
          reportCards: true,
          classGroup: {
            include: {
              school: true,
              subject: true,
              gradeLevel: true,
            },
          },
        },
      },
    },
  });

  if (!studentUser) {
    redirect("/dashboard?error=student_access_required");
  }

  const student = studentUser.student;
  const school = student.classGroup.school;

  return {
    auth,
    studentUser,
    student,
    school,
  };
}
