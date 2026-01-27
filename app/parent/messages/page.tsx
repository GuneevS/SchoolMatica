import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Plus,
  User,
  Clock,
  ChevronRight,
  Send,
} from "lucide-react";

export const metadata = {
  title: "Messages | SchoolMatica Parent Portal",
  description: "Communicate with teachers and school administration.",
};

// Mock data
const mockConversations = [
  {
    id: "1",
    participant: "Mrs. van der Berg",
    role: "Class Teacher - 10A",
    lastMessage: "Thank you for reaching out. Thabo has been doing well in class...",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "2",
    participant: "Mr. Nkosi",
    role: "Mathematics Teacher",
    lastMessage: "The extra practice worksheets are available for download.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "3",
    participant: "School Admin",
    role: "Administration",
    lastMessage: "Your fee statement for Term 1 has been generated.",
    time: "3 days ago",
    unread: false,
  },
  {
    id: "4",
    participant: "Mrs. Molapo",
    role: "Class Teacher - 7B",
    lastMessage: "Naledi received a merit for her excellent presentation!",
    time: "1 week ago",
    unread: false,
  },
];

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communicate with teachers and school staff.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mockConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
                    conversation.unread ? "bg-[hsl(var(--accent-iris))]/5" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold shrink-0">
                    {conversation.participant.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {conversation.participant}
                      </p>
                      {conversation.unread && (
                        <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{conversation.role}</p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{conversation.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message View */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold">
                  MV
                </div>
                <div>
                  <CardTitle className="text-base">Mrs. van der Berg</CardTitle>
                  <CardDescription>Class Teacher - 10A</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                  MV
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-sm">
                    Good morning! Thank you for reaching out about Thabo&apos;s progress.
                    I&apos;m happy to report that he has been doing well in class and
                    showing improvement in his participation.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">9:30 AM</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="bg-[hsl(var(--accent-iris))] text-white rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                  <p className="text-sm">
                    Thank you for the update, Mrs. van der Berg. We&apos;ve been
                    encouraging him to participate more at home as well. Is there
                    anything specific we should focus on?
                  </p>
                  <p className="text-xs text-white/70 mt-2">10:15 AM</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                  MV
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                  <p className="text-sm">
                    I would suggest focusing on his Afrikaans reading comprehension.
                    Some extra practice at home would really help. I can send you
                    some recommended resources.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">11:42 AM</p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
