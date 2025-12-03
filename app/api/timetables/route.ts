import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(3),
  schoolId: z.string(),
  year: z.number().min(2000),
  term: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cycleType: z.enum(["Weekly", "Rotating", "Custom"]).default("Weekly"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const year = searchParams.get("year");
  const term = searchParams.get("term");

  const where: Prisma.TimetableWhereInput = {};
  if (schoolId) where.schoolId = schoolId;
  if (year) where.year = parseInt(year);
  if (term) where.term = term;

  const timetables = await prisma.timetable.findMany({
    where,
    include: {
      school: true,
      periods: {
        orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
      },
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
          assessmentPlan: true,
        },
      },
      _count: {
        select: { periods: true, slots: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(timetables);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { name, schoolId, year, term, startDate, endDate, cycleType } = parsed.data;

  const timetable = await prisma.timetable.create({
    data: {
      name,
      schoolId,
      year,
      term,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      cycleType,
      status: "Draft",
    },
    include: {
      school: true,
      periods: true,
      slots: true,
    },
  });

  return NextResponse.json(timetable, { status: 201 });
}
