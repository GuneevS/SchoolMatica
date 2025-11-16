import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  assessmentPlanId: z.string().optional(),
  assessmentId: z.string().optional(),
  createdByRole: z.enum(["Teacher", "HOD", "SMT"]),
  message: z.string().min(3),
  title: z.string().optional(),
  kind: z.enum(["plan", "assessment", "moderation"]).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assessmentPlanId = searchParams.get("assessmentPlanId");
  const assessmentId = searchParams.get("assessmentId");
  const threads = await prisma.moderationThread.findMany({
    where: {
      assessmentPlanId: assessmentPlanId ?? undefined,
      assessmentId: assessmentId ?? undefined,
    },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  if (!parsed.data.assessmentPlanId && !parsed.data.assessmentId) {
    return NextResponse.json({ error: "Thread must target a plan or assessment" }, { status: 400 });
  }

  const thread = await prisma.moderationThread.create({
    data: {
      assessmentPlanId: parsed.data.assessmentPlanId,
      assessmentId: parsed.data.assessmentId,
      status: "Open",
      createdByRole: parsed.data.createdByRole,
      title: parsed.data.title,
      kind: parsed.data.kind ?? (parsed.data.assessmentId ? "assessment" : "plan"),
      comments: {
        create: [
          {
            authorRole: parsed.data.createdByRole,
            message: parsed.data.message,
          },
        ],
      },
    },
    include: { comments: true, documents: true },
  });

  return NextResponse.json(thread, { status: 201 });
}
