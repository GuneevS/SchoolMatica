import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ threadId: string }>;
}

const commentSchema = z.object({
  authorRole: z.enum(["Teacher", "HOD", "SMT"]),
  message: z.string().min(2),
  attachmentUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { threadId } = await params;
  const json = await request.json();
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const comment = await prisma.moderationComment.create({
    data: {
      threadId,
      authorRole: parsed.data.authorRole,
      message: parsed.data.message,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}
