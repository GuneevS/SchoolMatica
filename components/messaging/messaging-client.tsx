"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Search,
  Plus,
  Inbox,
  MoreVertical,
  Archive,
  Trash2,
  Pin,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./message-composer";
import { NewConversationDialog } from "./new-conversation-dialog";
import type { Conversation, Message, Participant } from "./messaging-types";
import { toast } from "sonner";

interface MessagingClientProps {
  initialConversations: Conversation[];
  initialMessages: Message[];
  selectedConversationId?: string;
  currentUserId: string;
  currentUserName: string;
  schoolId: string;
  userRole: string;
  portalType: "parent" | "student" | "teacher" | "admin";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessagingClient({
  initialConversations,
  initialMessages,
  selectedConversationId,
  currentUserId,
  currentUserName,
  schoolId,
  userRole,
  portalType,
}: MessagingClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedConversationId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // Filter conversations by search
  const filteredConversations = conversations.filter(
    (c) =>
      c.participant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages?threadId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = (data.messages || []).map((msg: {
          id: string;
          content: string;
          senderId: string;
          sender?: { displayName?: string; name?: string };
          createdAt: string;
          readBy?: string | string[];
        }) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.sender?.displayName || msg.sender?.name || "Unknown",
          senderInitials: getInitials(msg.sender?.displayName || msg.sender?.name || "U"),
          createdAt: new Date(msg.createdAt),
          time: formatMessageTime(new Date(msg.createdAt)),
          isOwn: msg.senderId === currentUserId,
          isRead: Array.isArray(msg.readBy) 
            ? msg.readBy.length > 1 
            : typeof msg.readBy === "string" 
              ? JSON.parse(msg.readBy).length > 1 
              : false,
        }));
        setMessages(formattedMessages);
        
        // Mark as read
        await fetch(`/api/messages/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: conversationId }),
        });
        
        // Update conversation unread status
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c))
        );
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    loadMessages(conversationId);
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!selectedId || !content.trim()) return;

    setIsSending(true);
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      senderName: currentUserName,
      senderInitials: getInitials(currentUserName),
      createdAt: new Date(),
      time: formatMessageTime(new Date()),
      isOwn: true,
      isRead: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: selectedId,
          content,
          schoolId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMessage.id
              ? {
                  ...m,
                  id: data.message.id,
                  createdAt: new Date(data.message.createdAt),
                  time: formatMessageTime(new Date(data.message.createdAt)),
                }
              : m
          )
        );
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: content, time: "Just now" }
              : c
          )
        );
        toast.success("Message sent");
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        throw new Error("Failed to send");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Create new conversation
  const handleCreateConversation = async (data: {
    recipients: Participant[];
    subject?: string;
    message: string;
    type: string;
  }) => {
    try {
      // Include current user in participants
      const allParticipants = [
        { id: currentUserId, name: currentUserName, role: userRole, type: portalType },
        ...data.recipients,
      ];

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.message,
          schoolId,
          type: data.type,
          subject: data.subject,
          participants: allParticipants,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newThread = result.thread;
        
        // Add to conversations list
        const newConversation: Conversation = {
          id: newThread.id,
          participant: data.recipients.map((r) => r.name).join(", "),
          role: data.recipients[0]?.role || "Staff",
          type: data.type as Conversation["type"],
          lastMessage: data.message.substring(0, 100),
          time: "Just now",
          unread: false,
          subject: data.subject,
        };
        
        setConversations((prev) => [newConversation, ...prev]);
        setSelectedId(newThread.id);
        
        // Load messages for the new thread
        loadMessages(newThread.id);
        
        toast.success(`Conversation started with ${newConversation.participant}`);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
      throw error;
    }
  };

  // Archive conversation
  const handleArchive = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/archive`, {
        method: "POST",
      });
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (selectedId === conversationId) {
          setSelectedId(undefined);
          setMessages([]);
        }
        toast.success("Conversation archived");
      }
    } catch (error) {
      console.error("Failed to archive:", error);
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {conversations.filter((c) => c.unread).length} unread
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-muted/50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No conversations</p>
                <p className="text-sm mt-1">Start a new conversation</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 text-left transition-all hover:bg-muted/50",
                        conversation.unread && "bg-[hsl(var(--accent-iris))]/5",
                        selectedId === conversation.id && "bg-muted"
                      )}
                    >
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold shrink-0 shadow-lg shadow-[hsl(var(--accent-iris))]/20">
                        {getInitials(conversation.participant)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-sm truncate",
                            conversation.unread ? "font-semibold" : "font-medium"
                          )}>
                            {conversation.participant}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {conversation.unread && (
                              <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))] animate-pulse" />
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {conversation.time}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{conversation.role}</p>
                        {conversation.subject && (
                          <p className="text-xs font-medium text-[hsl(var(--accent-iris))] mt-1 truncate">
                            {conversation.subject}
                          </p>
                        )}
                        <p className={cn(
                          "text-sm mt-1 truncate",
                          conversation.unread ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold shadow-lg shadow-[hsl(var(--accent-iris))]/20">
                      {getInitials(selectedConversation.participant)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.participant}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {selectedConversation.role}
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More options">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BellOff className="h-4 w-4 mr-2" />
                          Mute notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(selectedConversation.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={cn("flex gap-3", i % 2 === 0 && "justify-end")}>
                          {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                          <Skeleton className="h-16 w-[60%] rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const showDate = index === 0 || 
                          new Date(messages[index - 1].createdAt).toDateString() !== 
                          new Date(message.createdAt).toDateString();
                        
                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground font-medium">
                                  {new Date(message.createdAt).toLocaleDateString("en-ZA", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                            )}
                            <div className={cn("flex gap-3", message.isOwn && "justify-end")}>
                              {!message.isOwn && (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                                  {message.senderInitials}
                                </div>
                              )}
                              <div
                                className={cn(
                                  "rounded-2xl p-3.5 max-w-[75%] shadow-sm",
                                  message.isOwn
                                    ? "bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] text-white rounded-tr-sm"
                                    : "bg-muted rounded-tl-sm"
                                )}
                              >
                                {!message.isOwn && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {message.senderName}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <div className={cn(
                                  "flex items-center gap-1.5 mt-2 text-[10px]",
                                  message.isOwn ? "text-white/70 justify-end" : "text-muted-foreground"
                                )}>
                                  <Clock className="h-3 w-3" />
                                  {message.time}
                                  {message.isOwn && (
                                    <CheckCheck className={cn(
                                      "h-3 w-3 ml-1",
                                      message.isRead ? "text-white" : "text-white/50"
                                    )} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4 bg-background">
                  <MessageComposer
                    onSend={handleSendMessage}
                    disabled={isSending}
                    placeholder={`Message ${selectedConversation.participant}...`}
                  />
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground max-w-sm">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))]/20 to-[hsl(var(--accent-violet))]/20 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-[hsl(var(--accent-iris))]" />
                </div>
                <p className="font-semibold text-lg text-foreground">Your Messages</p>
                <p className="text-sm mt-2">
                  Select a conversation to view messages or start a new one to connect with teachers and staff.
                </p>
                <Button
                  onClick={() => setIsNewDialogOpen(true)}
                  className="mt-6 bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start a Conversation
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onCreateConversation={handleCreateConversation}
        schoolId={schoolId}
        userRole={userRole}
      />
    </>
  );
}
