"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { MessagingClient } from "@/components/messaging";
import type { Conversation, Message } from "@/components/messaging";

interface MessagesWrapperProps {
  conversations: Conversation[];
  messages: Message[];
  selectedConversationId?: string;
  currentUserId: string;
  currentUserName: string;
  schoolId: string;
}

export function MessagesWrapper({
  conversations,
  messages,
  selectedConversationId,
  currentUserId,
  currentUserName,
  schoolId,
}: MessagesWrapperProps) {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communicate with teachers and school staff.
          </p>
        </div>
        <Button
          onClick={() => setIsNewDialogOpen(true)}
          className="bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <MessagingClient
        initialConversations={conversations}
        initialMessages={messages}
        selectedConversationId={selectedConversationId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        schoolId={schoolId}
        userRole="parent"
        portalType="parent"
      />
    </div>
  );
}
