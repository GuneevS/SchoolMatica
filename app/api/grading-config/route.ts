import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bandSchema = z.object({
  minPercent: z.number().min(0).max(100),
  level: z.number().int().min(1).max(7),
  descriptor: z.string(),
});

const payloadSchema = z.object({
  phases: z.record(z.string(), z.array(bandSchema)),
});

export async function GET() {
  const config = await prisma.gradingConfig.findFirst();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.gradingConfig.findFirst();
  if (!existing) {
    return NextResponse.json({ error: "No grading config" }, { status: 404 });
  }

  const updated = await prisma.gradingConfig.update({
    where: { id: existing.id },
    data: { phasesJson: parsed.data.phases },
  });

  return NextResponse.json(updated);
}
