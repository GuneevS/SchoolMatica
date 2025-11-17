import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  order: z.number().int(),
  schoolId: z.string(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const grades = await prisma.gradeLevel.findMany({
    where: schoolId ? { schoolId } : undefined,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(grades);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const grade = await prisma.gradeLevel.create({ data: parsed.data });
  return NextResponse.json(grade, { status: 201 });
}

