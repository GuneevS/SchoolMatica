import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";
import { DEFAULT_GRADING_BANDS } from "@/lib/constants/grading";
import { Prisma } from "@prisma/client";

const defaultBands = DEFAULT_GRADING_BANDS;

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

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "school:read");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  
  // System admins can see all schools
  const whereClause = isSystemAdmin(auth) 
    ? {}
    : { id: { in: getUserSchoolIds(auth) } };
  
  const schools = await prisma.school.findMany({
    where: whereClause,
    include: {
      gradingConfig: true,
      _count: { select: { classes: true, subjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schools);
}

export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "school:create");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  
  // Only system admins can create schools
  if (!isSystemAdmin(auth)) {
    return NextResponse.json({ error: "Only system administrators can create schools" }, { status: 403 });
  }
  
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const gradingConfig = await prisma.gradingConfig.create({
    data: {
      name: parsed.data.gradingName ?? `${parsed.data.name} Grading`,
      phasesJson: (parsed.data.phases ?? defaultBands) as unknown as Prisma.InputJsonValue,
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

