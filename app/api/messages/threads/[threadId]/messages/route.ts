import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, hasSchoolAccess, isSuperAdmin, isSystemAdmin } from "@/lib/auth";
import { auditMessageAction } from "@/lib/chat-audit";
import { triggerNewMessage, triggerMessageRead, NewMessagePayload } from "@/lib/pusher";

export const dynamic = "force-dynamic";

interface ThreadParticipant {
  id: string;
  type: string;
  name?: string;
}

/**
 * Check if user is a participant in the thread
 */
function isThreadParticipant(participants: ThreadParticipant[], userId: string): boolean {
  return participants.some((p) => p.id === userId);
}

/**
 * GET /api/messages/threads/[threadId]/messages
 * Get all messages in a thread with proper access control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await params;

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check school access
    if (!hasSchoolAccess(auth, thread.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Check if user is a participant (admins can view all threads in their school)
    const participants = thread.participants as ThreadParticipant[];
    const isParticipant = isThreadParticipant(participants, auth.user.id);
    const isAdmin = isSystemAdmin(auth) || isSuperAdmin(auth);

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Not a participant in this thread" }, { status: 403 });
    }

    // Mark messages as read by this user
    const unreadMessages = thread.messages.filter((m) => {
      const readBy = parseReadBy(m.readBy);
      return !readBy.includes(auth.user.id);
    });

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map((message) => {
          const readBy = parseReadBy(message.readBy);
          readBy.push(auth.user.id);
          return prisma.message.update({
            where: { id: message.id },
            data: { readBy: JSON.stringify(readBy) },
          });
        })
      );
    }

    // Audit log for message access (for compliance)
    await auditMessageAction(auth, "read_thread", threadId, thread.schoolId, {
      messageCount: thread.messages.length,
    });

    // Transform messages for response
    const messages = thread.messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      sender: {
        id: m.sender.id,
        displayName: m.sender.displayName,
        name: m.sender.name,
      },
      attachments: m.attachments,
      readBy: parseReadBy(m.readBy),
      isEdited: m.isEdited,
      editedAt: m.editedAt,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      thread: {
        id: thread.id,
        type: thread.type,
        subject: thread.subject,
        participants,
        lastMessageAt: thread.lastMessageAt?.toISOString(),
        isArchived: thread.isArchived,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/threads/[threadId]/messages
 * Send a new message to a thread
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { content, attachments } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Validate content length (prevent abuse)
    if (content.length > 10000) {
      return NextResponse.json({ error: "Message too long (max 10000 characters)" }, { status: 400 });
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.isArchived) {
      return NextResponse.json({ error: "Cannot send messages to archived thread" }, { status: 400 });
    }

    // Check school access
    if (!hasSchoolAccess(auth, thread.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Check if user is a participant
    const participants = thread.participants as ThreadParticipant[];
    if (!isThreadParticipant(participants, auth.user.id)) {
      return NextResponse.json({ error: "Not a participant in this thread" }, { status: 403 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: auth.user.id,
        content: content.trim(),
        attachments: attachments ? JSON.stringify(attachments) : null,
        readBy: JSON.stringify([auth.user.id]),
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    });

    // Update thread's lastMessageAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    // Audit log for message sent
    await auditMessageAction(auth, "send_message", threadId, thread.schoolId, {
      messageId: message.id,
      contentLength: content.length,
      hasAttachments: !!attachments,
    });

    // Trigger real-time notification via Pusher
    const senderName = auth.user.displayName || auth.user.name || auth.user.email || "Unknown";
    const senderInitials = senderName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const realtimePayload: NewMessagePayload = {
      id: message.id,
      threadId,
      content: message.content,
      senderId: message.senderId,
      senderName,
      senderInitials,
      createdAt: message.createdAt.toISOString(),
      attachments: attachments || undefined,
    };

    // Fire and forget - don't block the response
    triggerNewMessage(threadId, realtimePayload).catch((err) => {
      console.error("Failed to send real-time message:", err);
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: message.sender,
        attachments: message.attachments,
        readBy: [auth.user.id],
        isEdited: false,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * Parse readBy field which can be JSON string or array
 */
function parseReadBy(readBy: unknown): string[] {
  if (Array.isArray(readBy)) return readBy;
  if (typeof readBy === "string") {
    try {
      const parsed = JSON.parse(readBy);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
