import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

const SCHOOL_COOKIE = "sm-school-id";

export async function getActiveSchool() {
  const auth = await getServerAuthContext();
  if (!auth) {
    return null;
  }

  const cookieStore = await cookies();
  const storedId = cookieStore.get(SCHOOL_COOKIE)?.value;
  if (storedId && (auth.isAdmin || auth.schoolIds.includes(storedId))) {
    const school = await prisma.school.findUnique({
      where: { id: storedId },
      include: { gradingConfig: true },
    });
    if (school) {
      return school;
    }
  }

  if (auth.isAdmin) {
    const fallback = await prisma.school.findFirst({ include: { gradingConfig: true } });
    return fallback ?? null;
  }

  const fallbackId = auth.schoolIds[0] ?? null;
  if (!fallbackId) {
    return null;
  }

  const fallback = await prisma.school.findUnique({
    where: { id: fallbackId },
    include: { gradingConfig: true },
  });
  return fallback ?? null;
}

export async function getActiveSchoolId() {
  const school = await getActiveSchool();
  return school?.id ?? null;
}
