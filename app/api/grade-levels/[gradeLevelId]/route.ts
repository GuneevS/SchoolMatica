import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ gradeLevelId: string }>;
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  order: z.number().int().optional(),
});

export async function GET(_: NextRequest, { params }: Params) {
  const { gradeLevelId } = await params;

  const gradeLevel = await prisma.gradeLevel.findUnique({
    where: { id: gradeLevelId },
    include: {
      school: true,
      _count: {
        select: { classes: true },
      },
    },
  });

  if (!gradeLevel) {
    return NextResponse.json({ error: "Grade level not found" }, { status: 404 });
  }

  return NextResponse.json(gradeLevel);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { gradeLevelId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const gradeLevel = await prisma.gradeLevel.update({
      where: { id: gradeLevelId },
      data: parsed.data,
    });

    return NextResponse.json(gradeLevel);
  } catch (error) {
    console.error("Failed to update grade level", error);
    return NextResponse.json({ error: "Grade level not found" }, { status: 404 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { gradeLevelId } = await params;

  try {
    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { id: gradeLevelId },
      include: {
        _count: {
          select: { classes: true },
        },
      },
    });

    if (!gradeLevel) {
      return NextResponse.json({ error: "Grade level not found" }, { status: 404 });
    }

    if (gradeLevel._count.classes > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete grade level. It is assigned to ${gradeLevel._count.classes} class(es). Please reassign or delete those classes first.`,
        },
        { status: 400 }
      );
    }

    await prisma.gradeLevel.delete({
      where: { id: gradeLevelId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete grade level", error);
    return NextResponse.json({ error: "Failed to delete grade level" }, { status: 500 });
  }
}
