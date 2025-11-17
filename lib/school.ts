import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SCHOOL_COOKIE = "sm-school-id";

export async function getActiveSchool() {
  const cookieStore = await cookies();
  const storedId = cookieStore.get(SCHOOL_COOKIE)?.value;
  if (storedId) {
    const school = await prisma.school.findUnique({
      where: { id: storedId },
      include: { gradingConfig: true },
    });
    if (school) {
      return school;
    }
  }

  const fallback = await prisma.school.findFirst({ include: { gradingConfig: true } });
  return fallback ?? null;
}

export async function getActiveSchoolId() {
  const school = await getActiveSchool();
  return school?.id ?? null;
}

