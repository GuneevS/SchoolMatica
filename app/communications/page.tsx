import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CommunicationsPageClient } from "./communications-client";

export default async function CommunicationsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const schoolId = auth.user.schoolId;
  if (!schoolId) redirect("/login");

  const currentUserId = auth.user.id;

  // Fetch message threads for this user (where they are a participant)
  const threads = await prisma.messageThread.findMany({
    where: {
      schoolId,
      isArchived: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: true,
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Filter threads where current user is a participant
  const userThreads = threads.filter((thread) => {
    const participants = thread.participants as Array<{ id: string; type: string }>;
    return participants.some((p) => p.id === currentUserId);
  });

  // Transform threads into conversations
  const conversations = await Promise.all(
    userThreads.map(async (thread) => {
      const participants = thread.participants as Array<{ id: string; type: string; name?: string }>;
      const otherParticipant = participants.find((p) => p.id !== currentUserId);
      
      // Get participant details if available
      let participantName = otherParticipant?.name || "Unknown";
      let participantRole = "User";
      let participantInitials = "??";

      if (otherParticipant) {
        const user = await prisma.appUser.findUnique({
          where: { id: otherParticipant.id },
          include: {
            roleAssignments: {
              include: { role: true },
              take: 1,
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

      // Count unread messages
      const lastMessage = thread.messages[0];
      const unreadCount = lastMessage && !lastMessage.senderId.includes(currentUserId) 
        ? await prisma.message.count({
            where: {
              threadId: thread.id,
              NOT: {
                readBy: {
                  array_contains: currentUserId,
                },
              },
            },
          }).catch(() => 0)
        : 0;

      return {
        id: thread.id,
        participantName,
        participantRole,
        participantInitials,
        lastMessage: lastMessage?.content || "No messages yet",
        lastMessageTime: lastMessage?.createdAt.toISOString() || new Date().toISOString(),
        unreadCount,
        isOnline: false,
        childName: thread.subject || undefined,
      };
    })
  );

  // Fetch announcements for the school
  const announcements = await prisma.announcement.findMany({
    where: {
      schoolId,
      status: "Published",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      createdBy: true,
    },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
  });

  const transformedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    isPinned: a.isPinned,
    createdBy: a.createdBy.displayName || a.createdBy.name || "Unknown",
    createdAt: a.createdAt.toISOString(),
    audience: a.audience as string[],
  }));

  // Calculate stats
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const todayMessages = await prisma.message.count({
    where: {
      thread: { schoolId },
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const stats = {
    unreadMessages: totalUnread,
    messagesToday: todayMessages,
    activeThreads: userThreads.length,
    scheduledMessages: 0, // Would need a scheduled messages table
  };

  return (
    <CommunicationsPageClient
      conversations={conversations}
      announcements={transformedAnnouncements}
      currentUserId={currentUserId}
      stats={stats}
    />
  );
}
