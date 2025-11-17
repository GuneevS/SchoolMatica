import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const defaultBands = {
  FET: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 40, level: 2, descriptor: "Elementary" },
    { minPercent: 50, level: 3, descriptor: "Moderate" },
    { minPercent: 60, level: 4, descriptor: "Adequate" },
    { minPercent: 70, level: 5, descriptor: "Substantial" },
    { minPercent: 80, level: 6, descriptor: "Meritorious" },
    { minPercent: 90, level: 7, descriptor: "Outstanding" },
  ],
};

const createSchema = z.object({
  name: z.string().min(3),
  shortCode: z.string().optional(),
  gradingName: z.string().optional(),
  phases: z.record(z.string(), z.array(z.object({
    minPercent: z.number(),
    level: z.number(),
    descriptor: z.string(),
  }))).optional(),
});

export async function GET() {
  const schools = await prisma.school.findMany({
    include: {
      gradingConfig: true,
      _count: { select: { classes: true, subjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schools);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const gradingConfig = await prisma.gradingConfig.create({
    data: {
      name: parsed.data.gradingName ?? `${parsed.data.name} Grading`,
      phasesJson: parsed.data.phases ?? defaultBands,
    },
  });

  const school = await prisma.school.create({
    data: {
      name: parsed.data.name,
      shortCode: parsed.data.shortCode,
      gradingConfig: { connect: { id: gradingConfig.id } },
    },
    include: { gradingConfig: true },
  });

  return NextResponse.json(school, { status: 201 });
}

