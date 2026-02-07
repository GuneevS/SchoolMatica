import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

  if (!appId || !key || !secret) {
    console.warn("Pusher credentials not configured - real-time messaging disabled");
    return null;
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServer;
}

// Client-side Pusher instance (singleton)
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (pusherClient) return pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

  if (!key) {
    console.warn("Pusher key not configured - real-time messaging disabled");
    return null;
  }

  pusherClient = new PusherClient(key, {
    cluster,
    forceTLS: true,
  });

  return pusherClient;
}

// Channel naming conventions
export const CHANNEL_NAMES = {
  // Private channel for a specific thread
  thread: (threadId: string) => `private-thread-${threadId}`,
  // Private channel for a user's notifications
  user: (userId: string) => `private-user-${userId}`,
  // Private channel for school-wide announcements
  school: (schoolId: string) => `private-school-${schoolId}`,
} as const;

// Event names
export const EVENT_NAMES = {
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_EDITED: "message-edited",
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  THREAD_ARCHIVED: "thread-archived",
  NEW_THREAD: "new-thread",
} as const;

// Message payload types
export interface NewMessagePayload {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  createdAt: string;
  attachments?: unknown[];
}

export interface MessageReadPayload {
  threadId: string;
  messageIds: string[];
  readBy: string;
  readAt: string;
}

export interface TypingPayload {
  threadId: string;
  userId: string;
  userName: string;
}

/**
 * Trigger a new message event to all thread participants
 */
export async function triggerNewMessage(
  threadId: string,
  message: NewMessagePayload
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(CHANNEL_NAMES.thread(threadId), EVENT_NAMES.NEW_MESSAGE, message);
  } catch (error) {
    console.error("Failed to trigger new message event:", error);
  }
}

/**
 * Trigger a message read event
 */
export async function triggerMessageRead(
  threadId: string,
  payload: MessageReadPayload
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(CHANNEL_NAMES.thread(threadId), EVENT_NAMES.MESSAGE_READ, payload);
  } catch (error) {
    console.error("Failed to trigger message read event:", error);
  }
}

/**
 * Trigger typing indicator
 */
export async function triggerTyping(
  threadId: string,
  payload: TypingPayload,
  isTyping: boolean
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(
      CHANNEL_NAMES.thread(threadId),
      isTyping ? EVENT_NAMES.TYPING_START : EVENT_NAMES.TYPING_STOP,
      payload
    );
  } catch (error) {
    console.error("Failed to trigger typing event:", error);
  }
}

/**
 * Notify a user about a new thread they've been added to
 */
export async function triggerNewThread(
  userId: string,
  threadInfo: {
    id: string;
    type: string;
    subject?: string;
    participantName: string;
  }
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(CHANNEL_NAMES.user(userId), EVENT_NAMES.NEW_THREAD, threadInfo);
  } catch (error) {
    console.error("Failed to trigger new thread event:", error);
  }
}
