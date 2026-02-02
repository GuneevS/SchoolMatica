import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";

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

  let selectedMessages: Array<{
    id: string;
    content: string;
    time: string;
    isOwn: boolean;
    senderName: string;
    senderInitials: string;
  }> = [];

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
        time: msg.createdAt.toLocaleTimeString("en-ZA", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        isOwn: msg.senderId === auth.user.id,
        senderName: msg.sender.displayName || msg.sender.name || "Unknown",
        senderInitials: getInitials(msg.sender.displayName || msg.sender.name || "U"),
      }));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with teachers and school staff.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start a new message to connect with staff.</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
                      conversation.unread ? "bg-[hsl(var(--accent-iris))]/5" : ""
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold shrink-0">
                      {getInitials(conversation.participant)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conversation.participant}</p>
                        {conversation.unread && <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{conversation.role}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{conversation.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold">
                      {getInitials(selectedConversation.participant)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.participant}</CardTitle>
                      <CardDescription>{selectedConversation.role}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {selectedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.isOwn ? "justify-end" : ""}`}>
                        {!message.isOwn && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                            {message.senderInitials}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl p-3 max-w-[80%] ${
                            message.isOwn
                              ? "bg-[hsl(var(--accent-iris))] text-white rounded-tr-none"
                              : "bg-muted rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t p-4">
                  <div className="flex gap-3">
                    <Input placeholder="Type your message..." className="flex-1" />
                    <Button>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No conversation selected</p>
                <p className="text-sm mt-1">Select a conversation or start a new one</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
