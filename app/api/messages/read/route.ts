import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/messages/read
 * Mark messages in a thread as read by the current user
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const { threadId } = body;

    if (!threadId) {
      return NextResponse.json({ error: "Thread ID required" }, { status: 400 });
    }

    // Get the thread to verify access
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (!hasSchoolAccess(auth, thread.schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all unread messages in the thread
    const messages = await prisma.message.findMany({
      where: { threadId },
    });

    // Update readBy for each message
    const updates = messages.map((message: { id: string; readBy: unknown }) => {
      const readBy = parseReadBy(message.readBy);
      if (!readBy.includes(auth.user.id)) {
        readBy.push(auth.user.id);
        return prisma.message.update({
          where: { id: message.id },
          data: { readBy: JSON.stringify(readBy) },
        });
      }
      return null;
    });

    await Promise.all(updates.filter(Boolean));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}

function parseReadBy(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string");
  }
  return [];
}
