import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, hasSchoolAccess } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ThreadParticipant {
  id: string;
  type: string;
}

/**
 * POST /api/pusher/auth
 * Authenticate users for Pusher private channels
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json({ error: "Real-time messaging not configured" }, { status: 503 });
    }

    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
    }

    // Validate channel access based on channel type
    const isAuthorized = await validateChannelAccess(auth, channelName);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Access denied to channel" }, { status: 403 });
    }

    // Generate auth response
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: auth.user.id,
      user_info: {
        name: auth.user.displayName || auth.user.email,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

/**
 * Validate that the user has access to the requested channel
 */
async function validateChannelAccess(
  auth: Awaited<ReturnType<typeof getAuthContext>>,
  channelName: string
): Promise<boolean> {
  if (!auth) return false;

  // User's personal channel
  if (channelName.startsWith("private-user-")) {
    const userId = channelName.replace("private-user-", "");
    return userId === auth.user.id;
  }

  // Thread channel - check if user is a participant
  if (channelName.startsWith("private-thread-")) {
    const threadId = channelName.replace("private-thread-", "");
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) return false;

    // Check school access
    if (!hasSchoolAccess(auth, thread.schoolId)) return false;

    // Check if user is a participant
    const participants = thread.participants as unknown as ThreadParticipant[];
    return participants.some((p) => p.id === auth.user.id);
  }

  // School channel - check if user has access to the school
  if (channelName.startsWith("private-school-")) {
    const schoolId = channelName.replace("private-school-", "");
    return hasSchoolAccess(auth, schoolId);
  }

  return false;
}
