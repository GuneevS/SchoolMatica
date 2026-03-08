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
 * GET /api/messages
 * Get message threads for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "message:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all threads for the school, then filter by participant membership
    const allThreads = await prisma.messageThread.findMany({
      where: {
        schoolId,
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Filter to only threads where current user is a participant
    const threads = allThreads
      .filter((t) => isParticipant(t.participants, auth.user.id))
      .slice(0, limit);

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Create a new message thread or send a message
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "message:send");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const { threadId, content, schoolId, type, subject, participants } = body;

    const effectiveSchoolId = schoolId || auth.user.schoolId;
    if (!effectiveSchoolId || !hasSchoolAccess(auth, effectiveSchoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If threadId is provided, add message to existing thread
    if (threadId) {
      const thread = await prisma.messageThread.findUnique({
        where: { id: threadId },
      });

      if (!thread || thread.schoolId !== effectiveSchoolId) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      // Verify sender is a participant in this thread
      if (!isParticipant(thread.participants, auth.user.id)) {
        return NextResponse.json({ error: "Not a participant in this thread" }, { status: 403 });
      }

      const message = await prisma.message.create({
        data: {
          threadId,
          senderId: auth.user.id,
          content,
          readBy: JSON.stringify([auth.user.id]),
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      // Update thread's lastMessageAt
      await prisma.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json({ message });
    }

    // Create new thread with first message
    if (!type || !participants || !content) {
      return NextResponse.json(
        { error: "Missing required fields for new thread" },
        { status: 400 }
      );
    }

    const thread = await prisma.messageThread.create({
      data: {
        schoolId: effectiveSchoolId,
        type,
        subject,
        participants: JSON.stringify(participants),
        lastMessageAt: new Date(),
        createdBy: auth.user.id,
        messages: {
          create: {
            senderId: auth.user.id,
            content,
            readBy: JSON.stringify([auth.user.id]),
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
