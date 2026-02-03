import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { MessagesWrapper } from "./messages-wrapper";
import type { Conversation, Message } from "@/components/messaging";

export const dynamic = "force-dynamic";

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

export default async function StudentMessagesPage() {
  const { auth, school } = await getStudentContext();

  if (!auth) {
    redirect("/login");
  }

  const messageThreads = await prisma.messageThread.findMany({
    where: {
      schoolId: school.id,
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

  const userThreads = messageThreads.filter((thread) =>
    normaliseParticipants(thread.participants).some((p) => p.id === auth.user.id),
  );

  const conversations = userThreads.map((thread) => {
    const participants = normaliseParticipants(thread.participants);
    const otherParticipant = participants.find((p) => p.id !== auth.user.id);
    const lastMessage = thread.messages[0];
    const readByArray = normaliseReadBy(lastMessage?.readBy);
    const isUnread = lastMessage && !readByArray.includes(auth.user.id);

    return {
      id: thread.id,
      participant: otherParticipant?.name || "School Staff",
      role: otherParticipant?.role || "Teacher",
      lastMessage:
        lastMessage?.content?.substring(0, 100) + (lastMessage?.content?.length > 100 ? "..." : "") ||
        "No messages",
      time: lastMessage ? getTimeAgo(lastMessage.createdAt) : "",
      unread: isUnread,
      subject: thread.subject || "Direct Message",
    };
  });

  const selectedConversation = conversations.length > 0 ? conversations[0] : null;

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
      selectedMessages = fullThread.messages.map((msg: {
        id: string;
        content: string;
        senderId: string;
        createdAt: Date;
        sender: { displayName: string | null; name: string | null };
      }) => ({
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
  const formattedConversations: Conversation[] = conversations.map((c: {
    id: string;
    participant: string;
    role: string;
    lastMessage: string;
    time: string;
    unread: boolean;
    subject: string;
  }) => ({
    id: c.id,
    participant: c.participant,
    role: c.role,
    type: "Direct" as const,
    lastMessage: c.lastMessage,
    time: c.time,
    unread: c.unread,
    subject: c.subject,
  }));

  return (
    <MessagesWrapper
      conversations={formattedConversations}
      messages={selectedMessages}
      selectedConversationId={selectedConversation?.id}
      currentUserId={auth.user.id}
      currentUserName={auth.user.displayName || "Student"}
      schoolId={school.id}
    />
  );
}
