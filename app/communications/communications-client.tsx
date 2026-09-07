"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface, BulkMessageComposer, NewConversationDialog, Conversation, Message } from "@/components/communications";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { useRealtimeChat, RealtimeMessage } from "@/lib/hooks/use-realtime-chat";
import {
  MessageSquare,
  Users,
  Clock,
  Activity,
  Plus,
  Megaphone,
  Pin,
} from "lucide-react";

interface CommunicationsPageClientProps {
  conversations: Array<{
    id: string;
    participantName: string;
    participantRole: string;
    participantInitials: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline: boolean;
    childName?: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    createdBy: string;
    createdAt: string;
    audience: string[];
  }>;
  currentUserId: string;
  schoolId: string;
  stats: {
    unreadMessages: number;
    messagesToday: number;
    activeThreads: number;
    scheduledMessages: number;
  };
}

const heroHighlights = [
  { label: "Real-time messaging", color: "hsl(var(--accent-iris))" },
  { label: "Bulk communications", color: "hsl(var(--accent-violet))" },
  { label: "Automated workflows", color: "hsl(var(--accent-mint))" },
];

export function CommunicationsPageClient({
  conversations: initialConversations,
  announcements,
  currentUserId,
  schoolId,
  stats,
}: CommunicationsPageClientProps) {
  const [activeTab, setActiveTab] = useState("messages");

  // Transform conversations once per server-prop change.
  const conversations = useMemo<Conversation[]>(
    () =>
      initialConversations.map((c) => ({
        ...c,
        lastMessageTime: new Date(c.lastMessageTime),
      })),
    [initialConversations],
  );

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(
    () => conversations[0] || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState<Conversation[]>(conversations);

  // Keep local conversations list in sync when server data refreshes.
  useEffect(() => {
    setConversationsList((prev) => {
      // Preserve any locally-added (optimistic) conversations not yet on the server.
      const serverIds = new Set(conversations.map((c) => c.id));
      const localOnly = prev.filter((c) => !serverIds.has(c.id));
      return [...conversations, ...localOnly];
    });
  }, [conversations]);

  // Handle incoming real-time messages.
  const handleRealtimeMessage = useCallback((realtimeMsg: RealtimeMessage) => {
    setMessages((prev) => {
      // Don't add duplicates if Pusher echoes a message we already have.
      if (prev.some((m) => m.id === realtimeMsg.id)) return prev;
      const newMessage: Message = {
        id: realtimeMsg.id,
        content: realtimeMsg.content,
        senderId: realtimeMsg.senderId,
        senderName: realtimeMsg.senderName,
        senderInitials: realtimeMsg.senderInitials,
        timestamp: new Date(realtimeMsg.createdAt),
        isOwn: realtimeMsg.senderId === currentUserId,
        status: "delivered",
      };
      return [...prev, newMessage];
    });
  }, [currentUserId]);

  // Real-time chat hook
  const { isConnected, typingUsers } = useRealtimeChat({
    threadId: activeConversation?.id || null,
    currentUserId,
    onNewMessage: handleRealtimeMessage,
  });

  // Fetch messages when conversation changes, with cancellation on switch.
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();
    const threadId = activeConversation.id;
    setIsLoadingMessages(true);

    (async () => {
      try {
        const response = await fetch(
          `/api/messages/threads/${threadId}/messages`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const data = await response.json();
        const transformedMessages: Message[] = data.messages.map((m: {
          id: string;
          content: string;
          senderId: string;
          sender: { displayName?: string; name?: string };
          createdAt: string;
          readBy: string[];
        }) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          senderName: m.sender?.displayName || m.sender?.name || "Unknown",
          senderInitials: (m.sender?.displayName || m.sender?.name || "??")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          timestamp: new Date(m.createdAt),
          isOwn: m.senderId === currentUserId,
          status: m.readBy?.includes(currentUserId) ? "read" : "delivered",
        }));
        if (!controller.signal.aborted) setMessages(transformedMessages);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("[Communications] failed to fetch messages:", error);
        if (!controller.signal.aborted) {
          toast.error("Could not load messages. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingMessages(false);
      }
    })();

    return () => controller.abort();
  }, [activeConversation, currentUserId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation) return;

      const tempId = `temp-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        content,
        senderId: currentUserId,
        senderName: "You",
        senderInitials: "ME",
        timestamp: new Date(),
        isOwn: true,
        status: "sent",
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const response = await fetch(
          `/api/messages/threads/${activeConversation.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          },
        );
        if (!response.ok) throw new Error(`Send failed: ${response.status}`);
        const data = await response.json().catch(() => null);
        const serverId: string | undefined = data?.message?.id ?? data?.id;
        if (serverId) {
          // Reconcile temp message with server-assigned id.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, id: serverId, status: "delivered" } : m,
            ),
          );
        }
      } catch (error) {
        console.error("[Communications] send failed:", error);
        // Roll back the optimistic message.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Message couldn't be sent. Please try again.");
      }
    },
    [activeConversation, currentUserId],
  );

  const handleCreateThread = async (data: {
    type: "Direct" | "Class" | "School";
    participants: Array<{ id: string; type: string; name?: string }>;
    subject?: string;
    initialMessage?: string;
  }): Promise<{ threadId: string } | null> => {
    try {
      const response = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        const newThread = result.thread;

        // Add to conversations list
        const otherParticipant = data.participants[0];
        const newConversation: Conversation = {
          id: newThread.id,
          participantName: otherParticipant?.name || "Unknown",
          participantRole: "User",
          participantInitials: (otherParticipant?.name || "??")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          lastMessage: data.initialMessage || "No messages yet",
          lastMessageTime: new Date(),
          unreadCount: 0,
          isOnline: false,
          childName: data.subject,
        };

        setConversationsList((prev) => [newConversation, ...prev]);
        setActiveConversation(newConversation);

        return { threadId: newThread.id };
      }
      return null;
    } catch (error) {
      console.error("Failed to create thread:", error);
      return null;
    }
  };

  const handleBulkSend = async (data: {
    recipients: unknown[];
    subject: string;
    body: string;
    channels: ("app" | "email" | "sms")[];
    scheduleTime?: Date;
  }) => {
    try {
      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Bulk send failed: ${response.status}`);
      toast.success(
        `Sent to ${data.recipients.length} recipient${data.recipients.length === 1 ? "" : "s"}`,
        { description: `Via ${data.channels.join(", ")}` },
      );
    } catch (error) {
      console.error("[Communications] bulk send failed:", error);
      toast.error("Could not send the bulk message. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Communications"
        title={
          <>
            <span className="gradient-text">Connect</span> with your school community
          </>
        }
        description="Send personalized messages to parents, manage bulk communications, and keep everyone informed with automated workflows."
        badges={heroHighlights}
        aside={
          <HeroMetricPanel
            title="Communication stats"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              {
                label: "Unread messages",
                value: stats.unreadMessages.toString(),
                helper: "Awaiting response",
                accent: "highlight",
              },
              { label: "Messages today", value: stats.messagesToday.toString() },
              { label: "Active threads", value: stats.activeThreads.toString() },
              { label: "Scheduled", value: stats.scheduledMessages.toString() },
            ]}
          />
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bulk Messaging
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => setIsNewConversationOpen(true)}
            className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <TabsContent value="messages">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a new conversation to connect with parents or staff
                </p>
                <Button 
                  onClick={() => setIsNewConversationOpen(true)}
                  className="mt-4 bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ChatInterface
              conversations={conversationsList}
              messages={messages}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
              onSendMessage={handleSendMessage}
              currentUserId={currentUserId}
              isLoading={isLoadingMessages}
              isConnected={isConnected}
              typingUsers={typingUsers}
            />
          )}
        </TabsContent>

        <TabsContent value="bulk">
          <BulkMessageComposer onSend={handleBulkSend} />
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>School Announcements</CardTitle>
                  <CardDescription>
                    Create and manage school-wide announcements
                  </CardDescription>
                </div>
                <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-[hsl(var(--accent-violet))/0.12] dark:bg-[hsl(var(--accent-violet))/0.28] flex items-center justify-center mb-4">
                    <Megaphone className="h-8 w-8 text-[hsl(var(--accent-violet))]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                  <p className="text-sm text-slate-500 max-w-md mb-4">
                    Announcements are displayed prominently to all selected recipients
                    and can be pinned to dashboards.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        announcement.priority === "Urgent" 
                          ? "bg-red-100 dark:bg-red-900/30" 
                          : announcement.priority === "High"
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-[hsl(var(--accent-violet))/0.12] dark:bg-[hsl(var(--accent-violet))/0.28]"
                      }`}>
                        <Megaphone className={`h-5 w-5 ${
                          announcement.priority === "Urgent" 
                            ? "text-red-600" 
                            : announcement.priority === "High"
                            ? "text-amber-600"
                            : "text-[hsl(var(--accent-violet))]"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{announcement.title}</h4>
                          {announcement.isPinned && (
                            <Pin className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          By {announcement.createdBy} • {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Messages</CardTitle>
              <CardDescription>
                View and manage messages scheduled for future delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Scheduled Messages</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Schedule messages to be sent automatically at a specific time.
                  Use bulk messaging to schedule communications.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onCreateThread={handleCreateThread}
        schoolId={schoolId}
      />
    </div>
  );
}
