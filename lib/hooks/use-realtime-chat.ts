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

/**
 * Subscribes to a Pusher channel for a chat thread. Callbacks are stored in a
 * ref so that passing a fresh handler each render does NOT cause the
 * subscription to tear down and recreate — only `threadId`/`currentUserId`
 * trigger resubscription. This avoids the "subscribe→unsubscribe storm" that
 * drops realtime messages between cycles.
 */
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
  const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Stable handler refs — updated each render without retriggering the
  // subscription effect.
  const handlersRef = useRef({
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
  });
  useEffect(() => {
    handlersRef.current = {
      onNewMessage,
      onMessageRead,
      onTypingStart,
      onTypingStop,
    };
  }, [onNewMessage, onMessageRead, onTypingStart, onTypingStop]);

  // Subscribe to thread channel — depends only on the *identity* of the
  // resource, not on the callbacks. The previous effect's cleanup resets
  // isConnected to false; we don't set it here to avoid a cascading render.
  useEffect(() => {
    if (!threadId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      console.warn("[useRealtimeChat] Pusher client not available");
      return;
    }

    const channelName = CHANNEL_NAMES.thread(threadId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("[useRealtimeChat] subscription error:", error);
      setIsConnected(false);
    });

    channel.bind(EVENT_NAMES.NEW_MESSAGE, (data: NewMessagePayload) => {
      // Echo own messages too — the consumer decides whether to dedupe;
      // optimistic-update flows pass their own id check.
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
      handlersRef.current.onNewMessage?.(message);
    });

    channel.bind(
      EVENT_NAMES.MESSAGE_READ,
      (data: { messageIds: string[]; readBy: string }) => {
        handlersRef.current.onMessageRead?.(data);
      },
    );

    channel.bind(
      EVENT_NAMES.TYPING_START,
      (data: { userId: string; userName: string }) => {
        if (data.userId === currentUserId) return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });

        const existingTimeout = typingTimeoutRef.current.get(data.userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimeoutRef.current.delete(data.userId);
        }, 3000);

        typingTimeoutRef.current.set(data.userId, timeout);
        handlersRef.current.onTypingStart?.(data);
      },
    );

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

      handlersRef.current.onTypingStop?.(data);
    });

    // Capture the ref value so cleanup uses what was current when the effect ran.
    const timeoutsAtMount = typingTimeoutRef.current;

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      setIsConnected(false);

      timeoutsAtMount.forEach((timeout) => clearTimeout(timeout));
      timeoutsAtMount.clear();
      setTypingUsers(new Map());
    };
  }, [threadId, currentUserId]);

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
        console.error("[useRealtimeChat] typing indicator failed:", error);
      }
    },
    [threadId],
  );

  return {
    isConnected,
    typingUsers,
    sendTypingIndicator,
  };
}

/**
 * Hook for subscribing to user-level notifications (new threads, etc.).
 * Same ref pattern as the chat hook — handler doesn't trigger resubscribe.
 */
export function useUserNotifications(
  userId: string,
  onNewThread?: (data: { id: string; type: string; subject?: string; participantName: string }) => void,
) {
  const [isConnected, setIsConnected] = useState(false);
  const handlerRef = useRef(onNewThread);

  useEffect(() => {
    handlerRef.current = onNewThread;
  }, [onNewThread]);

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = CHANNEL_NAMES.user(userId);
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind(
      EVENT_NAMES.NEW_THREAD,
      (data: { id: string; type: string; subject?: string; participantName: string }) => {
        handlerRef.current?.(data);
      },
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [userId]);

  return { isConnected };
}
