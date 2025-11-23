import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ subjectId: string }>;
}

const updateSubjectSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  phase: z.string().min(2).optional(),
});

export async function GET(_: NextRequest, { params }: Params) {
  const { subjectId } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      school: true,
      classes: {
        include: {
          _count: {
            select: { students: true },
          },
        },
      },
      teacherAssignments: {
        include: {
          teacher: true,
        },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json(subject);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { subjectId } = await params;
  const json = await request.json();
  const parsed = updateSubjectSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: parsed.data,
      include: {
        school: true,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Failed to update subject", error);
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { subjectId } = await params;

  try {
    // Check if subject is in use
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        _count: {
          select: {
            classes: true,
            teacherAssignments: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (subject._count.classes > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subject. It is assigned to ${subject._count.classes} class(es). Please reassign or delete those classes first.`,
        },
        { status: 400 }
      );
    }

    // Delete teacher assignments first
    if (subject._count.teacherAssignments > 0) {
      await prisma.teacherSubjectAssignment.deleteMany({
        where: { subjectId },
      });
    }

    await prisma.subject.delete({
      where: { id: subjectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subject", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
