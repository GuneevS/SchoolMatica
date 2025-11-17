import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const teacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  schoolId: z.string(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const teachers = await prisma.teacher.findMany({
    where: schoolId ? { schoolId } : undefined,
    include: {
      classAssignments: {
        include: { classGroup: true, subject: true },
        orderBy: { createdAt: "desc" },
      },
      subjectAssignments: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      primaryClasses: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json(teachers);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = teacherSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const schoolExists = await prisma.school.count({ where: { id: parsed.data.schoolId } });
  if (!schoolExists) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }
  const teacher = await prisma.teacher.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role ?? "Teacher",
      bio: parsed.data.bio,
      schoolId: parsed.data.schoolId,
    },
  });
  return NextResponse.json(teacher, { status: 201 });
}

