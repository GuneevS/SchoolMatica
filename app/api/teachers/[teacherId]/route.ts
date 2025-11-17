import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const payload = await request.json();
  const { teacherId } = await params;
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: parsed.data,
  });
  return NextResponse.json(teacher);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const { teacherId } = await params;
  await prisma.teacher.delete({ where: { id: teacherId } });
  return NextResponse.json({ success: true });
}

