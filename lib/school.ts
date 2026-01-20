import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

const SCHOOL_COOKIE = "sm-school-id";

export async function getActiveSchool() {
  const cookieStore = await cookies();
  const storedId = cookieStore.get(SCHOOL_COOKIE)?.value;
  const auth = await getServerAuthContext();

  const isAccessible = (schoolId: string) => {
    if (!auth) return false;
    if (auth.isAdmin) return true;
    return auth.schoolIds.includes(schoolId);
  };

  if (storedId) {
    const school = await prisma.school.findUnique({
      where: { id: storedId },
      include: { gradingConfig: true },
    });
    if (school && isAccessible(school.id)) {
      return school;
    }
  }

  // Pick first accessible school for this user
  if (auth) {
    if (auth.schoolIds.length > 0) {
      const school = await prisma.school.findUnique({
        where: { id: auth.schoolIds[0] },
        include: { gradingConfig: true },
      });
      if (school) return school;
    }
    if (auth.isAdmin) {
      const school = await prisma.school.findFirst({ include: { gradingConfig: true } });
      if (school) return school;
    }
  }

  return null;
}

export async function getActiveSchoolId() {
  const school = await getActiveSchool();
  return school?.id ?? null;
}

