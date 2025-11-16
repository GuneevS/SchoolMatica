import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ threadId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Open", "Resolved", "Escalated"]),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { threadId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const thread = await prisma.moderationThread.update({
    where: { id: threadId },
    data: parsed.data,
  });

  return NextResponse.json(thread);
}
