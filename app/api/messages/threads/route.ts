import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, hasSchoolAccess, isSuperAdmin, isSystemAdmin } from "@/lib/auth";
import { auditMessageAction } from "@/lib/chat-audit";

export const dynamic = "force-dynamic";

interface ThreadParticipant {
  id: string;
  type: "user" | "class" | "grade";
  name?: string;
}

interface CreateThreadRequest {
  type: "Direct" | "Class" | "School" | "Announcement";
  subject?: string;
  participants: ThreadParticipant[];
  initialMessage?: string;
  schoolId?: string;
}

/**
 * GET /api/messages/threads
 * Get all message threads for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const includeArchived = searchParams.get("includeArchived") === "true";

    if (!schoolId) {
      return NextResponse.json({ error: "School ID required" }, { status: 400 });
    }

    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const isAdmin = isSystemAdmin(auth) || isSuperAdmin(auth);

    // Get threads where user is a participant
    const threads = await prisma.messageThread.findMany({
      where: {
        schoolId,
        isArchived: includeArchived ? undefined : false,
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
                name: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: limit,
    });

    // Filter threads where current user is a participant (unless admin)
    const userThreads = threads.filter((thread) => {
      if (isAdmin) return true;
      const participants = thread.participants as ThreadParticipant[];
      return participants.some((p) => p.id === auth.user.id);
    });

    // Transform threads for response
    const transformedThreads = await Promise.all(
      userThreads.map(async (thread) => {
        const participants = thread.participants as ThreadParticipant[];
        const otherParticipant = participants.find((p) => p.id !== auth.user.id);
        const lastMessage = thread.messages[0];

        // Count unread messages for this user
        const unreadCount = await prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: auth.user.id },
            NOT: {
              readBy: {
                string_contains: auth.user.id,
              },
            },
          },
        }).catch(() => 0);

        // Get participant details
        let participantName = otherParticipant?.name || "Unknown";
        let participantRole = "User";
        let participantInitials = "??";

        if (otherParticipant && otherParticipant.type === "user") {
          const user = await prisma.appUser.findUnique({
            where: { id: otherParticipant.id },
            include: {
              roleAssignments: {
                include: { role: true },
                take: 1,
                orderBy: { role: { priority: "desc" } },
              },
            },
          });
          if (user) {
            participantName = user.displayName || user.name || "Unknown";
            participantRole = user.roleAssignments[0]?.role.name || "User";
            participantInitials = participantName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
          }
        }

        return {
          id: thread.id,
          type: thread.type,
          subject: thread.subject,
          participantName,
          participantRole,
          participantInitials,
          participants,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: thread.lastMessageAt?.toISOString() || thread.createdAt.toISOString(),
          lastMessageSender: lastMessage?.sender
            ? {
                id: lastMessage.sender.id,
                name: lastMessage.sender.displayName || lastMessage.sender.name,
              }
            : null,
          unreadCount,
          isArchived: thread.isArchived,
          createdAt: thread.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ threads: transformedThreads });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/threads
 * Create a new message thread
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateThreadRequest = await request.json();
    const { type, subject, participants, initialMessage, schoolId: requestSchoolId } = body;

    // Validate required fields
    if (!type || !["Direct", "Class", "School", "Announcement"].includes(type)) {
      return NextResponse.json({ error: "Invalid thread type" }, { status: 400 });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "At least one participant is required" }, { status: 400 });
    }

    // Validate participants structure
    for (const p of participants) {
      if (!p.id || !p.type) {
        return NextResponse.json({ error: "Invalid participant format" }, { status: 400 });
      }
    }

    const schoolId = requestSchoolId || auth.user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "School ID required" }, { status: 400 });
    }

    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Ensure current user is included in participants
    const allParticipants: ThreadParticipant[] = [...participants];
    if (!allParticipants.some((p) => p.id === auth.user.id)) {
      allParticipants.push({
        id: auth.user.id,
        type: "user",
        name: auth.user.displayName || auth.user.email || undefined,
      });
    }

    // For Direct messages, check if a thread already exists between these participants
    if (type === "Direct" && allParticipants.length === 2) {
      const existingThread = await findExistingDirectThread(
        schoolId,
        allParticipants.map((p) => p.id)
      );
      if (existingThread) {
        // Return existing thread instead of creating a new one
        return NextResponse.json({
          thread: {
            id: existingThread.id,
            type: existingThread.type,
            subject: existingThread.subject,
            participants: existingThread.participants,
            isArchived: existingThread.isArchived,
            createdAt: existingThread.createdAt.toISOString(),
          },
          existing: true,
        });
      }
    }

    // Create the thread
    const thread = await prisma.messageThread.create({
      data: {
        schoolId,
        type,
        subject: subject || null,
        participants: allParticipants,
        createdBy: auth.user.id,
        lastMessageAt: initialMessage ? new Date() : null,
        messages: initialMessage
          ? {
              create: {
                senderId: auth.user.id,
                content: initialMessage,
                readBy: [auth.user.id],
              },
            }
          : undefined,
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit log for thread creation
    await auditMessageAction(auth, "create_thread", thread.id, schoolId, {
      threadType: type,
      participantCount: allParticipants.length,
      hasInitialMessage: !!initialMessage,
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        type: thread.type,
        subject: thread.subject,
        participants: thread.participants,
        isArchived: thread.isArchived,
        createdAt: thread.createdAt.toISOString(),
        messages: thread.messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          sender: m.sender,
          createdAt: m.createdAt.toISOString(),
        })),
      },
      existing: false,
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

/**
 * Find an existing direct message thread between two users
 */
async function findExistingDirectThread(schoolId: string, participantIds: string[]) {
  const threads = await prisma.messageThread.findMany({
    where: {
      schoolId,
      type: "Direct",
      isArchived: false,
    },
  });

  // Find a thread where participants match exactly
  return threads.find((thread) => {
    const participants = thread.participants as ThreadParticipant[];
    if (participants.length !== participantIds.length) return false;
    const threadParticipantIds = participants.map((p) => p.id).sort();
    const targetIds = [...participantIds].sort();
    return threadParticipantIds.every((id, i) => id === targetIds[i]);
  });
}
