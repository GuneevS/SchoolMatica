"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { getPusherClient, CHANNEL_NAMES, EVENT_NAMES, NewMessagePayload } from "@/lib/pusher";
import type { Channel } from "pusher-js";

export interface RealtimeMessage {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  createdAt: string;
  attachments?: unknown[];
}

interface UseRealtimeChatOptions {
  threadId: string | null;
  currentUserId: string;
  onNewMessage?: (message: RealtimeMessage) => void;
  onMessageRead?: (data: { messageIds: string[]; readBy: string }) => void;
  onTypingStart?: (data: { userId: string; userName: string }) => void;
  onTypingStop?: (data: { userId: string }) => void;
}

interface UseRealtimeChatReturn {
  isConnected: boolean;
  typingUsers: Map<string, string>;
  sendTypingIndicator: (isTyping: boolean) => void;
}

export function useRealtimeChat({
  threadId,
  currentUserId,
  onNewMessage,
  onMessageRead,
  onTypingStart,
  onTypingStop,
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<Channel | null>(null);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Subscribe to thread channel
  useEffect(() => {
    if (!threadId) {
      setIsConnected(false);
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn("Pusher client not available");
      return;
    }

    const channelName = CHANNEL_NAMES.thread(threadId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("Pusher subscription error:", error);
      setIsConnected(false);
    });

    // Handle new messages
    channel.bind(EVENT_NAMES.NEW_MESSAGE, (data: NewMessagePayload) => {
      // Don't process our own messages (we already have them via optimistic update)
      if (data.senderId === currentUserId) return;

      const message: RealtimeMessage = {
        id: data.id,
        threadId: data.threadId,
        content: data.content,
        senderId: data.senderId,
        senderName: data.senderName,
        senderInitials: data.senderInitials,
        createdAt: data.createdAt,
        attachments: data.attachments,
      };

      onNewMessage?.(message);
    });

    // Handle message read events
    channel.bind(EVENT_NAMES.MESSAGE_READ, (data: { messageIds: string[]; readBy: string }) => {
      onMessageRead?.(data);
    });

    // Handle typing indicators
    channel.bind(EVENT_NAMES.TYPING_START, (data: { userId: string; userName: string }) => {
      if (data.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.userName);
        return next;
      });

      // Clear existing timeout for this user
      const existingTimeout = typingTimeoutRef.current.get(data.userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      // Auto-clear typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        typingTimeoutRef.current.delete(data.userId);
      }, 3000);

      typingTimeoutRef.current.set(data.userId, timeout);
      onTypingStart?.(data);
    });

    channel.bind(EVENT_NAMES.TYPING_STOP, (data: { userId: string }) => {
      if (data.userId === currentUserId) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });

      const existingTimeout = typingTimeoutRef.current.get(data.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeoutRef.current.delete(data.userId);
      }

      onTypingStop?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      setIsConnected(false);

      // Clear all typing timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      setTypingUsers(new Map());
    };
  }, [threadId, currentUserId, onNewMessage, onMessageRead, onTypingStart, onTypingStop]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      if (!threadId) return;

      try {
        await fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, isTyping }),
        });
      } catch (error) {
        console.error("Failed to send typing indicator:", error);
      }
    },
    [threadId]
  );

  return {
    isConnected,
    typingUsers,
    sendTypingIndicator,
  };
}

/**
 * Hook for subscribing to user-level notifications (new threads, etc.)
 */
export function useUserNotifications(
  userId: string,
  onNewThread?: (data: { id: string; type: string; subject?: string; participantName: string }) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = CHANNEL_NAMES.user(userId);
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind(EVENT_NAMES.NEW_THREAD, (data: { id: string; type: string; subject?: string; participantName: string }) => {
      onNewThread?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [userId, onNewThread]);

  return { isConnected };
}
