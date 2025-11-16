import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ classId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const { classId } = await params;
  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    include: {
      subject: true,
      students: true,
      assessmentPlans: {
        orderBy: { createdAt: "desc" },
        include: { assessments: true },
      },
    },
  });

  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(classGroup);
}
