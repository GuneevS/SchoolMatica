import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const subjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  phase: z.string().min(2),
  schoolId: z.string(),
});

export async function GET() {
  const subjects = await prisma.subject.findMany({
    include: { school: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = subjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: parsed.data.schoolId } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const subject = await prisma.subject.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      phase: parsed.data.phase,
      schoolId: parsed.data.schoolId,
    },
  });
  return NextResponse.json(subject, { status: 201 });
}
