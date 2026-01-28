"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface, BulkMessageComposer, Conversation, Message } from "@/components/communications";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import {
  MessageSquare,
  Users,
  Bell,
  Send,
  Megaphone,
  Clock,
  Activity,
  Plus,
} from "lucide-react";

// Mock data for demonstrations
const mockConversations: Conversation[] = [
  {
    id: "1",
    participantName: "Mr. Mokoena",
    participantRole: "Parent",
    participantInitials: "MM",
    lastMessage: "Thank you for the update on Thabo's progress.",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    childName: "Thabo Mokoena",
  },
  {
    id: "2",
    participantName: "Mrs. van der Berg",
    participantRole: "Class Teacher - 10A",
    participantInitials: "VB",
    lastMessage: "The parent meeting has been rescheduled to next week.",
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    participantName: "Mrs. Nkosi",
    participantRole: "Parent",
    participantInitials: "MN",
    lastMessage: "When is the next assessment for Mathematics?",
    lastMessageTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: false,
    childName: "Sipho Nkosi",
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Good morning! I wanted to discuss Thabo's recent performance in class.",
    senderId: "user1",
    senderName: "You",
    senderInitials: "ME",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isOwn: true,
    status: "read",
  },
  {
    id: "2",
    content: "Good morning! Thank you for reaching out. Thabo has been doing well in most subjects, though he could improve in Mathematics. Would you like me to send some extra practice materials?",
    senderId: "parent1",
    senderName: "Mr. Mokoena",
    senderInitials: "MM",
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    isOwn: false,
  },
  {
    id: "3",
    content: "Yes, that would be very helpful! We've been trying to help him at home but some extra guidance would be appreciated.",
    senderId: "user1",
    senderName: "You",
    senderInitials: "ME",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isOwn: true,
    status: "delivered",
  },
  {
    id: "4",
    content: "Perfect! I'll send the materials home with Thabo tomorrow. Also, we have a parent-teacher consultation coming up next week. Would you be available on Tuesday at 3pm?",
    senderId: "parent1",
    senderName: "Mr. Mokoena",
    senderInitials: "MM",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isOwn: false,
  },
];

const heroHighlights = [
  { label: "Real-time messaging", color: "hsl(var(--accent-iris))" },
  { label: "Bulk communications", color: "hsl(var(--accent-violet))" },
  { label: "Automated workflows", color: "hsl(var(--accent-mint))" },
];

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState("messages");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(
    mockConversations[0]
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      senderId: "user1",
      senderName: "You",
      senderInitials: "ME",
      timestamp: new Date(),
      isOwn: true,
      status: "sent",
    };
    setMessages([...messages, newMessage]);
  };

  const handleBulkSend = (data: {
    recipients: any[];
    subject: string;
    body: string;
    channels: ("app" | "email" | "sms")[];
    scheduleTime?: Date;
  }) => {
    console.log("Sending bulk message:", data);
    // TODO: Implement actual API call
    alert(`Sending message to ${data.recipients.length} recipients via ${data.channels.join(", ")}`);
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
                value: "3",
                helper: "Awaiting response",
                accent: "highlight",
              },
              { label: "Messages today", value: "12" },
              { label: "Active threads", value: "8" },
              { label: "Scheduled", value: "2" },
            ]}
          />
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
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
          <Button className="bg-violet-500 hover:bg-violet-600">
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <TabsContent value="messages">
          <ChatInterface
            conversations={mockConversations}
            messages={activeConversation ? messages : []}
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
            onSendMessage={handleSendMessage}
            currentUserId="user1"
          />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkMessageComposer onSend={handleBulkSend} />
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>School Announcements</CardTitle>
              <CardDescription>
                Create and manage school-wide announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <Megaphone className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Create an Announcement</h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">
                  Announcements are displayed prominently to all selected recipients
                  and can be pinned to dashboards.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </div>
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
              <div className="space-y-4">
                {/* Mock scheduled messages */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Term 1 Fee Reminder</p>
                      <p className="text-sm text-slate-500">
                        To: All Parents (Grade 10) • Scheduled: Tomorrow, 9:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">45 recipients</Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500">Cancel</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Parent Meeting Reminder</p>
                      <p className="text-sm text-slate-500">
                        To: Class 10A Parents • Scheduled: Feb 14, 8:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">28 recipients</Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500">Cancel</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
