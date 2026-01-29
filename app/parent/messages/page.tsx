import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Plus,
  User,
  Clock,
  ChevronRight,
  Send,
  Inbox,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const userThreads = messageThreads.filter((thread) => {
    const participants = thread.participants as Array<{ id: string; type: string }>;
    return participants?.some((p) => p.id === auth.user.id);
  });

  // Process conversations for display
  const conversations = await Promise.all(
    userThreads.map(async (thread) => {
      const participants = thread.participants as Array<{ id: string; type: string; name?: string; role?: string }>;
      
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
      const readByArray = (lastMessage?.readBy as string[]) || [];
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
          <p className="text-muted-foreground mt-1">
            Communicate with teachers and school staff.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
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
                <p className="text-sm mt-1">Start a new message to communicate with teachers</p>
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
                        <p className="text-sm font-medium truncate">
                          {conversation.participant}
                        </p>
                        {conversation.unread && (
                          <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />
                        )}
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

        {/* Message View */}
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
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {selectedMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.isOwn ? "justify-end" : ""}`}
                      >
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
                          <p
                            className={`text-xs mt-2 ${
                              message.isOwn ? "text-white/70" : "text-muted-foreground"
                            }`}
                          >
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Type your message..."
                      className="flex-1"
                    />
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
