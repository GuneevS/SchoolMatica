import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  schoolId: z.string(),
  classGroupId: z.string().optional(),
  learnerData: z.record(z.string(), z.unknown()),
  guardianData: z.record(z.string(), z.unknown()),
  supportingDocs: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const classGroupId = searchParams.get("classGroupId") ?? undefined;
  const registrations = await prisma.learnerRegistration.findMany({
    where: {
      status,
      classGroupId,
    },
    include: {
      classGroup: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(registrations);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: parsed.data.schoolId } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  if (parsed.data.classGroupId) {
    const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId } });
    if (!classGroup || classGroup.schoolId !== parsed.data.schoolId) {
      return NextResponse.json({ error: "Class group is invalid for this school" }, { status: 400 });
    }
  }

  const registration = await prisma.learnerRegistration.create({
    data: {
      schoolId: parsed.data.schoolId,
      classGroupId: parsed.data.classGroupId ?? undefined,
      learnerData: parsed.data.learnerData as Prisma.JsonObject,
      guardianData: parsed.data.guardianData as Prisma.JsonObject,
      supportingDocs: (parsed.data.supportingDocs as Prisma.JsonObject) ?? null,
      status: "Submitted",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(registration, { status: 201 });
}

