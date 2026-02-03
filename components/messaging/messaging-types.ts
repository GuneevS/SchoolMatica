// Types for the messaging system

export interface Participant {
  id: string;
  name: string;
  role?: string;
  type?: "teacher" | "parent" | "student" | "admin" | "staff";
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  createdAt: Date;
  time: string;
  isOwn: boolean;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  participant: string;
  participantId?: string;
  role: string;
  type: "Direct" | "Class" | "School" | "Announcement";
  lastMessage: string;
  time: string;
  unread: boolean;
  subject?: string;
  participants?: Participant[];
}

export interface MessageThreadData {
  id: string;
  type: string;
  subject?: string;
  schoolId: string;
  participants: Participant[];
  messages: Message[];
}

export interface RecipientOption {
  id: string;
  name: string;
  role: string;
  type: "teacher" | "parent" | "student" | "admin" | "staff";
  email?: string;
  avatar?: string;
  subtitle?: string;
}

export interface NewMessagePayload {
  threadId?: string;
  content: string;
  schoolId?: string;
  type?: string;
  subject?: string;
  participants?: Participant[];
}
