import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagesWrapper } from "./messages-wrapper";
import type { Conversation, Message } from "@/components/messaging";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Messages | SchoolMatica Parent Portal",
  description: "Communicate with teachers and school administration.",
};

// Helper to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const normaliseParticipants = (
  value: unknown,
): Array<{ id: string; type?: string; name?: string; role?: string }> => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normaliseParticipants(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") {
      return (value as string[]).map((id) => ({ id }));
    }
    return value as Array<{ id: string; type?: string; name?: string; role?: string }>;
  }
  return [];
};

const normaliseReadBy = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normaliseReadBy(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") {
      return value as string[];
    }
  }
  return [];
};

export default async function MessagesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Get parent user to verify they're a parent
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  school: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    redirect("/login");
  }

  // Get school IDs for the parent's children
  const schoolIds = [...new Set(parentUser.contacts.map(c => c.student.classGroup.schoolId))];

  // Get message threads where this user is a participant
  const messageThreads = await prisma.messageThread.findMany({
    where: {
      schoolId: { in: schoolIds },
      isArchived: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
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
  });

  // Filter threads where current user is a participant
  const userThreads = messageThreads.filter((thread) =>
    normaliseParticipants(thread.participants).some((p) => p.id === auth.user.id),
  );

  // Process conversations for display
  const conversations = await Promise.all(
    userThreads.map(async (thread) => {
      const participants = normaliseParticipants(thread.participants);
      
      // Find the other participant (not the current user)
      const otherParticipant = participants.find((p) => p.id !== auth.user.id);
      
      // Get participant details
      let participantName = otherParticipant?.name || "Unknown";
      let participantRole = otherParticipant?.role || "Staff";
      
      // Try to get more details about the participant
      if (otherParticipant?.id) {
        const otherUser = await prisma.appUser.findUnique({
          where: { id: otherParticipant.id },
          include: {
            teacher: true,
          },
        });
        if (otherUser) {
          participantName = otherUser.displayName || otherUser.name || participantName;
          if (otherUser.teacher) {
            participantRole = `${otherUser.teacher.role} - ${otherUser.teacher.firstName} ${otherUser.teacher.lastName}`;
          }
        }
      }

      const lastMessage = thread.messages[0];
      const readByArray = normaliseReadBy(lastMessage?.readBy);
      const isUnread = lastMessage && !readByArray.includes(auth.user.id);

      return {
        id: thread.id,
        participant: participantName,
        role: participantRole,
        lastMessage: lastMessage?.content?.substring(0, 100) + (lastMessage?.content?.length > 100 ? "..." : "") || "No messages",
        time: lastMessage ? getTimeAgo(lastMessage.createdAt) : "",
        unread: isUnread,
        subject: thread.subject || "Direct Message",
      };
    })
  );

  // Get the first conversation for display (if any)
  const selectedConversation = conversations.length > 0 ? conversations[0] : null;

  // Get messages for selected conversation
  let selectedMessages: Message[] = [];

  if (selectedConversation) {
    const fullThread = await prisma.messageThread.findUnique({
      where: { id: selectedConversation.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
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

    if (fullThread) {
      selectedMessages = fullThread.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName: msg.sender.displayName || msg.sender.name || "Unknown",
        senderInitials: getInitials(msg.sender.displayName || msg.sender.name || "U"),
        createdAt: msg.createdAt,
        time: msg.createdAt.toLocaleTimeString("en-ZA", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        isOwn: msg.senderId === auth.user.id,
        isRead: true,
      }));
    }
  }

  // Format conversations for the client component
  const formattedConversations: Conversation[] = conversations.map((c) => ({
    id: c.id,
    participant: c.participant,
    role: c.role,
    type: "Direct" as const,
    lastMessage: c.lastMessage,
    time: c.time,
    unread: c.unread,
    subject: c.subject,
  }));

  // Get the primary school ID
  const primarySchoolId = schoolIds[0] || "";

  return (
    <MessagesWrapper
      conversations={formattedConversations}
      messages={selectedMessages}
      selectedConversationId={selectedConversation?.id}
      currentUserId={auth.user.id}
      currentUserName={auth.user.displayName || auth.user.name || "Parent"}
      schoolId={primarySchoolId}
    />
  );
}
