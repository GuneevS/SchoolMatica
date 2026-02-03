"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Image as ImageIcon,
  File,
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
}

export function ChatInterface({
  conversations,
  messages,
  activeConversation,
  onSelectConversation,
  onSendMessage,
  onSearch,
  currentUserId,
  isLoading = false,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "short",
      }).format(date);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-slate-50 dark:bg-slate-700/50 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition-colors",
                "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                activeConversation?.id === conversation.id &&
                  "bg-[hsl(var(--accent-violet))/0.06] dark:bg-[hsl(var(--accent-violet))/0.2] border-l-2 border-[hsl(var(--accent-violet))]"
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-flamingo))] text-white font-semibold">
                    {conversation.participantInitials}
                  </AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{conversation.participantName}</p>
                  <span className="text-xs text-slate-500">
                    {formatDate(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{conversation.participantRole}</p>
                {conversation.childName && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Re: {conversation.childName}
                  </Badge>
                )}
                <p className="text-sm text-slate-500 truncate mt-1">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <Badge className="bg-[hsl(var(--accent-violet))] text-white shrink-0">
                  {conversation.unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-flamingo))] text-white font-semibold">
                    {activeConversation.participantInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{activeConversation.participantName}</p>
                  <p className="text-sm text-slate-500">
                    {activeConversation.isOnline ? (
                      <span className="text-emerald-500">Online</span>
                    ) : (
                      activeConversation.participantRole
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Archive Chat</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const showDate =
                    index === 0 ||
                    new Date(messages[index - 1].timestamp).toDateString() !==
                      new Date(message.timestamp).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex gap-3",
                          message.isOwn ? "flex-row-reverse" : ""
                        )}
                      >
                        {!message.isOwn && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs">
                              {message.senderInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl p-3",
                            message.isOwn
                              ? "bg-[hsl(var(--accent-violet))] text-white rounded-br-md"
                              : "bg-slate-100 dark:bg-slate-700/50 rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              message.isOwn ? "text-white/70" : "text-slate-500"
                            )}
                          >
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            {message.isOwn && (
                              <>
                                {message.status === "read" ? (
                                  <CheckCheck className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </>
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

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  aria-label="Upload attachments"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="shrink-0 bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm text-slate-500 mt-1">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;
