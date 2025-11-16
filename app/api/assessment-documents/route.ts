import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  assessmentPlanId: z.string().optional(),
  assessmentId: z.string().optional(),
  threadId: z.string().optional(),
  label: z.string().min(2),
  fileName: z.string().min(2),
  mimeType: z.string().min(2),
  fileUrl: z.string().url(),
  storageKey: z.string().min(2),
  status: z.enum(["Draft", "Pending", "Approved", "ChangesRequested"]).optional(),
  uploadedByRole: z.enum(["Teacher", "HOD", "SMT"]),
  uploadedByName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assessmentPlanId = searchParams.get("assessmentPlanId") ?? undefined;
  const assessmentId = searchParams.get("assessmentId") ?? undefined;
  const documents = await prisma.assessmentDocument.findMany({
    where: {
      assessmentPlanId,
      assessmentId,
    },
    include: { approvals: true },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  if (!parsed.data.assessmentPlanId && !parsed.data.assessmentId && !parsed.data.threadId) {
    return NextResponse.json({ error: "Document must target a plan, assessment, or thread." }, { status: 400 });
  }
  const document = await prisma.assessmentDocument.create({
    data: parsed.data,
    include: { approvals: true },
  });
  return NextResponse.json(document, { status: 201 });
}

