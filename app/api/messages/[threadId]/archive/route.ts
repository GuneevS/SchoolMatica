import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Check if a user is a participant in a thread's participants JSON */
function isParticipant(participants: unknown, userId: string): boolean {
  try {
    const parsed = typeof participants === "string" ? JSON.parse(participants) : participants;
    if (!Array.isArray(parsed)) return false;
    return parsed.some((p: { id?: string }) => p.id === userId);
  } catch {
    return false;
  }
}

/**
 * POST /api/messages/[threadId]/archive
 * Archive a message thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const result = await authorizeWithSchool(request, "message:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const { threadId } = await params;

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (!hasSchoolAccess(auth, thread.schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify user is a participant in this thread
    if (!isParticipant(thread.participants, auth.user.id)) {
      return NextResponse.json({ error: "Not a participant in this thread" }, { status: 403 });
    }

    // Archive the thread
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving thread:", error);
    return NextResponse.json(
      { error: "Failed to archive thread" },
      { status: 500 }
    );
  }
}
