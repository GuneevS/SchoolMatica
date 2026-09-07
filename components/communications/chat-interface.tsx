"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  Check,
  CheckCheck,
  Smile,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderPictureUrl?: string | null;
  senderRole?: string;
  timestamp: Date;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  attachments?: { name: string; type: string; url: string }[];
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  participantInitials: string;
  participantPictureUrl?: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  childName?: string; // For parent conversations
}

interface ChatInterfaceProps {
  conversations: Conversation[];
  messages: Message[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onSendMessage: (content: string, attachments?: File[]) => void;
  onSearch?: (query: string) => void;
  currentUserId: string;
  isLoading?: boolean;
  isConnected?: boolean;
  typingUsers?: Map<string, string>;
  onTyping?: (isTyping: boolean) => void;
}

// Format an absolute time (e.g. "14:32") — stable across server/client.
function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Format a date relative to "today/yesterday" — depends on the current
// client clock. Only safe to call after mount, otherwise hydration mismatches.
function formatRelativeDate(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(date);
}

// SSR-safe absolute fallback used before the client mounts.
function formatAbsoluteDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ChatInterface({
  conversations,
  messages,
  activeConversation,
  onSelectConversation,
  onSendMessage,
  onSearch: _onSearch,
  currentUserId: _currentUserId,
  isLoading: _isLoading = false,
  isConnected: _isConnected = false,
  typingUsers = new Map(),
  onTyping: _onTyping,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mount flag — "Today/Yesterday" labels depend on the client clock.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll on count change only, not every messages-array reference.
  const messageCount = messages.length;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const handleSend = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessageInput("");
  }, [messageInput, onSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const safeDate = (d: Date) => (mounted ? formatRelativeDate(d) : formatAbsoluteDate(d));

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] overflow-hidden rounded-2xl border border-border bg-[hsl(var(--surface-strong))]">
      {/* Conversations list */}
      <aside
        aria-label="Conversations"
        className="hidden w-80 flex-col border-r border-border md:flex"
      >
        <div className="border-b border-border p-4">
          <label htmlFor="chat-conversation-search" className="sr-only">
            Search conversations
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="chat-conversation-search"
              placeholder="Search conversations…"
              className="border-0 bg-muted/50 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <ul role="list">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  aria-current={activeConversation?.id === conversation.id ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 p-4 text-left transition-colors",
                    "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                    activeConversation?.id === conversation.id &&
                      "border-l-2 border-[hsl(var(--accent-violet))] bg-[hsl(var(--accent-violet))/0.06] dark:bg-[hsl(var(--accent-violet))/0.2]",
                  )}
                >
                  <UserAvatar
                    src={conversation.participantPictureUrl}
                    name={conversation.participantName}
                    role={conversation.participantRole}
                    size="md"
                    showRing
                    showStatus
                    status={conversation.isOnline ? "online" : "offline"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{conversation.participantName}</p>
                      <time
                        dateTime={new Date(conversation.lastMessageTime).toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {safeDate(new Date(conversation.lastMessageTime))}
                      </time>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.participantRole}
                    </p>
                    {conversation.childName && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Re: {conversation.childName}
                      </Badge>
                    )}
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge
                      aria-label={`${conversation.unreadCount} unread`}
                      className="shrink-0 bg-[hsl(var(--accent-violet))] text-white"
                    >
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-[hsl(var(--surface-strong))] p-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={activeConversation.participantPictureUrl}
                  name={activeConversation.participantName}
                  role={activeConversation.participantRole}
                  size="sm"
                  showRing
                  showStatus
                  status={activeConversation.isOnline ? "online" : "offline"}
                />
                <div>
                  <p className="font-medium">{activeConversation.participantName}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeConversation.isOnline ? (
                      <span className="text-emerald-500">Online</span>
                    ) : (
                      activeConversation.participantRole
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Start voice call">
                  <Phone aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Start video call">
                  <Video aria-hidden="true" className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Conversation options">
                      <MoreVertical aria-hidden="true" className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View profile</DropdownMenuItem>
                    <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                    <DropdownMenuItem>Archive chat</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Block user</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages — announced to AT as a polite live log */}
            <ScrollArea className="flex-1 p-4">
              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label={`Conversation with ${activeConversation.participantName}`}
                className="space-y-4"
              >
                {messages.map((message, index) => {
                  const showDate =
                    index === 0 ||
                    new Date(messages[index - 1].timestamp).toDateString() !==
                      new Date(message.timestamp).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="my-4 flex justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {safeDate(new Date(message.timestamp))}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex gap-3",
                          message.isOwn ? "flex-row-reverse" : "",
                        )}
                      >
                        {!message.isOwn && (
                          <UserAvatar
                            src={message.senderPictureUrl}
                            name={message.senderName}
                            role={message.senderRole}
                            size="xs"
                            showRing
                          />
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl p-3",
                            message.isOwn
                              ? "rounded-br-md bg-[hsl(var(--accent-violet))] text-white"
                              : "rounded-bl-md bg-muted",
                          )}
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          <div
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1",
                              message.isOwn
                                ? "text-white/70"
                                : "text-muted-foreground",
                            )}
                          >
                            <time
                              dateTime={new Date(message.timestamp).toISOString()}
                              className="text-xs"
                            >
                              {formatTime(new Date(message.timestamp))}
                            </time>
                            {message.isOwn && (
                              <span
                                aria-label={message.status === "read" ? "Read" : "Sent"}
                                title={message.status === "read" ? "Read" : "Sent"}
                              >
                                {message.status === "read" ? (
                                  <CheckCheck aria-hidden="true" className="h-4 w-4" />
                                ) : (
                                  <Check aria-hidden="true" className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="px-4 py-2 text-sm italic text-muted-foreground"
              >
                {Array.from(typingUsers.values()).join(", ")}{" "}
                {typingUsers.size === 1 ? "is" : "are"} typing…
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-border bg-[hsl(var(--surface-strong))] p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-end gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  aria-label="Upload attachments"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0"
                  aria-label="Attach a file"
                >
                  <Paperclip aria-hidden="true" className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                  <label htmlFor="chat-message-input" className="sr-only">
                    Type a message
                  </label>
                  <Input
                    id="chat-message-input"
                    placeholder="Type a message…"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    aria-label="Insert emoji"
                  >
                    <Smile aria-hidden="true" className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="shrink-0"
                  aria-label="Send message"
                >
                  <Send aria-hidden="true" className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Send aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;
