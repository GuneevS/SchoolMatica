import { getAuthContext, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CommunicationsPageClient } from "./communications-client";

export default async function CommunicationsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  let schoolId = auth.user.schoolId;

  // Super admins may not have a schoolId - use first available school
  if (!schoolId && isSuperAdmin(auth)) {
    const firstSchool = await prisma.school.findFirst({ orderBy: { createdAt: "desc" } });
    if (firstSchool) schoolId = firstSchool.id;
  }

  if (!schoolId) redirect("/dashboard?error=no_school");

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
    const participants = thread.participants as unknown as Array<{ id: string; type: string }>;
    return participants.some((p) => p.id === currentUserId);
  });

  // ── Batch-fetch all participant users (fixes N+1 query) ──
  const allParticipantIds = new Set<string>();
  for (const thread of userThreads) {
    const participants = thread.participants as unknown as Array<{ id: string; type: string }>;
    for (const p of participants) {
      if (p.id !== currentUserId) allParticipantIds.add(p.id);
    }
  }

  const participantUsers = await prisma.appUser.findMany({
    where: { id: { in: Array.from(allParticipantIds) } },
    include: {
      roleAssignments: {
        include: { role: true },
        take: 1,
      },
    },
  });

  const participantMap = new Map(participantUsers.map((u) => [u.id, u]));

  // Transform threads into conversations (no more N+1)
  const conversations = userThreads.map((thread) => {
    const participants = thread.participants as unknown as Array<{ id: string; type: string; name?: string }>;
    const otherParticipant = participants.find((p) => p.id !== currentUserId);

    let participantName = otherParticipant?.name || "Unknown";
    let participantRole = "User";
    let participantInitials = "??";

    if (otherParticipant) {
      const user = participantMap.get(otherParticipant.id);
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

    const lastMessage = thread.messages[0];

    return {
      id: thread.id,
      participantName,
      participantRole,
      participantInitials,
      lastMessage: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage?.createdAt.toISOString() || new Date().toISOString(),
      unreadCount: 0, // Simplified — full unread count computed client-side
      isOnline: false,
      childName: thread.subject || undefined,
    };
  });

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
      schoolId={schoolId}
      stats={stats}
    />
  );
}
