import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, hasSchoolAccess } from "@/lib/auth";
import { triggerTyping } from "@/lib/pusher";

export const dynamic = "force-dynamic";

interface ThreadParticipant {
  id: string;
  type: string;
}

/**
 * POST /api/messages/typing
 * Send typing indicator to thread participants
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, isTyping } = body;

    if (!threadId || typeof isTyping !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify thread exists and user is a participant
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (!hasSchoolAccess(auth, thread.schoolId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const participants = thread.participants as ThreadParticipant[];
    if (!participants.some((p) => p.id === auth.user.id)) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Trigger typing event
    const userName = auth.user.displayName || auth.user.name || auth.user.email || "Unknown";
    await triggerTyping(
      threadId,
      {
        threadId,
        userId: auth.user.id,
        userName,
      },
      isTyping
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending typing indicator:", error);
    return NextResponse.json(
      { error: "Failed to send typing indicator" },
      { status: 500 }
    );
  }
}
