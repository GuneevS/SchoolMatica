import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ timetableId: string }>;
}

const createPeriodSchema = z.object({
  name: z.string(),
  periodNumber: z.number().min(1),
  startTime: z.string(),
  endTime: z.string(),
  dayOfWeek: z.number().min(0).max(6),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  const json = await request.json();
  const parsed = createPeriodSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const period = await prisma.timetablePeriod.create({
    data: {
      ...parsed.data,
      timetableId,
    },
  });

  return NextResponse.json(period, { status: 201 });
}

export async function GET(_: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  
  const periods = await prisma.timetablePeriod.findMany({
    where: { timetableId },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    include: {
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
        },
      },
    },
  });

  return NextResponse.json(periods);
}
