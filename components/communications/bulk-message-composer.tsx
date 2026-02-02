"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Send,
  Users,
  User,
  Search,
  X,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  Clock,
  MessageSquare,
  Mail,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "parent" | "teacher" | "student";
  childName?: string;
  className?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

interface BulkMessageComposerProps {
  recipients?: Recipient[];
  templates?: MessageTemplate[];
  onSend: (data: {
    recipients: Recipient[];
    subject: string;
    body: string;
    channels: ("app" | "email" | "sms")[];
    scheduleTime?: Date;
  }) => void;
  isLoading?: boolean;
}

// Pre-built templates
const defaultTemplates: MessageTemplate[] = [
  {
    id: "1",
    name: "Homework Reminder",
    subject: "Homework Due: {{assignment}}",
    body: `Dear {{parentName}},

This is a friendly reminder that {{childName}}'s {{assignment}} is due on {{dueDate}}.

Please ensure your child completes and submits the work on time.

Best regards,
{{teacherName}}`,
    variables: ["parentName", "childName", "assignment", "dueDate", "teacherName"],
  },
  {
    id: "2",
    name: "Merit Award Notification",
    subject: "Congratulations! {{childName}} Earned Merit Points",
    body: `Dear {{parentName}},

We are pleased to inform you that {{childName}} has earned {{points}} merit points for {{reason}}.

Current merit balance: {{totalMerits}} points

Keep up the excellent work!

Best regards,
{{schoolName}}`,
    variables: ["parentName", "childName", "points", "reason", "totalMerits", "schoolName"],
  },
  {
    id: "3",
    name: "Demerit Notification",
    subject: "Behaviour Notice for {{childName}}",
    body: `Dear {{parentName}},

We wish to inform you that {{childName}} has received {{points}} demerit points for {{reason}} on {{date}}.

Current demerit balance: {{totalDemerits}} points

We would appreciate your support in addressing this behaviour. Please feel free to contact us if you have any questions.

Best regards,
{{teacherName}}`,
    variables: ["parentName", "childName", "points", "reason", "date", "totalDemerits", "teacherName"],
  },
  {
    id: "4",
    name: "Parent Meeting Invitation",
    subject: "Parent-Teacher Meeting Invitation",
    body: `Dear {{parentName}},

You are cordially invited to attend a parent-teacher meeting scheduled for:

Date: {{date}}
Time: {{time}}
Venue: {{venue}}

This meeting will provide an opportunity to discuss {{childName}}'s progress and address any concerns.

Please confirm your attendance by {{rsvpDate}}.

Best regards,
{{schoolName}}`,
    variables: ["parentName", "childName", "date", "time", "venue", "rsvpDate", "schoolName"],
  },
  {
    id: "5",
    name: "Fee Reminder",
    subject: "School Fees Reminder - {{term}}",
    body: `Dear {{parentName}},

This is a reminder that the school fees for {{term}} are due on {{dueDate}}.

Amount due: {{amount}}
Student: {{childName}}

Please ensure payment is made by the due date to avoid any inconvenience.

For payment methods and queries, please contact the school bursar.

Best regards,
{{schoolName}}`,
    variables: ["parentName", "childName", "term", "dueDate", "amount", "schoolName"],
  },
];

// Mock recipients for demo
const mockRecipients: Recipient[] = [
  { id: "1", name: "Mr. Mokoena", email: "mokoena@email.com", role: "parent", childName: "Thabo Mokoena", className: "10A" },
  { id: "2", name: "Mrs. Nkosi", email: "nkosi@email.com", role: "parent", childName: "Sipho Nkosi", className: "10A" },
  { id: "3", name: "Mr. Dlamini", email: "dlamini@email.com", role: "parent", childName: "Nomvula Dlamini", className: "10A" },
  { id: "4", name: "Mrs. Zulu", email: "zulu@email.com", role: "parent", childName: "Ayanda Zulu", className: "10B" },
  { id: "5", name: "Mr. Botha", email: "botha@email.com", role: "parent", childName: "Johan Botha", className: "10B" },
];

export function BulkMessageComposer({
  recipients = mockRecipients,
  templates = defaultTemplates,
  onSend,
  isLoading = false,
}: BulkMessageComposerProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [channels, setChannels] = useState<("app" | "email" | "sms")[]>(["app"]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [filterClass, setFilterClass] = useState<string>("");

  const filteredRecipients = recipients.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.childName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !filterClass || r.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(recipients.map(r => r.className).filter(Boolean)));

  const toggleRecipient = (recipient: Recipient) => {
    if (selectedRecipients.find(r => r.id === recipient.id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const selectAll = () => {
    setSelectedRecipients(filteredRecipients);
  };

  const clearAll = () => {
    setSelectedRecipients([]);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(body + `{{${variable}}}`);
  };

  const toggleChannel = (channel: "app" | "email" | "sms") => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const getPersonalizedPreview = (recipient: Recipient) => {
    let previewBody = body;
    previewBody = previewBody.replace(/{{parentName}}/g, recipient.name);
    previewBody = previewBody.replace(/{{childName}}/g, recipient.childName || "");
    previewBody = previewBody.replace(/{{className}}/g, recipient.className || "");
    return previewBody;
  };

  const handleSend = () => {
    const scheduledDateTime = isScheduled && scheduleDate
      ? new Date(`${scheduleDate}T${scheduleTime || "09:00"}`)
      : undefined;

    onSend({
      recipients: selectedRecipients,
      subject,
      body,
      channels,
      scheduleTime: scheduledDateTime,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Recipients Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
            Recipients
          </CardTitle>
          <CardDescription>
            Select who will receive this message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls!}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All ({filteredRecipients.length})
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>

          {/* Selected Count */}
          <div className="flex items-center gap-2 p-2 bg-[hsl(var(--accent-violet))/0.06] dark:bg-[hsl(var(--accent-violet))/0.2] rounded-lg">
            <CheckCircle className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
            <span className="text-sm font-medium">
              {selectedRecipients.length} recipients selected
            </span>
          </div>

          {/* Recipients List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredRecipients.map((recipient) => {
                const isSelected = selectedRecipients.some((r) => r.id === recipient.id);
                return (
                  <div
                    key={recipient.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => toggleRecipient(recipient)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleRecipient(recipient);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                      isSelected
                        ? "bg-[hsl(var(--accent-violet))/0.12] dark:bg-[hsl(var(--accent-violet))/0.28]"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recipient.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {recipient.childName} • {recipient.className}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
            Compose Message
          </CardTitle>
          <CardDescription>
            Create personalized messages with dynamic variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Templates */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Message</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Insert variable:</span>
                {["parentName", "childName", "className"].map(variable => (
                  <Button
                    key={variable}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => insertVariable(variable)}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-[200px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Use {"{{variableName}}"} to insert personalized content for each recipient.
            </p>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>Delivery Channels</Label>
            <div className="flex gap-3">
              {[
                { id: "app", icon: MessageSquare, label: "In-App" },
                { id: "email", icon: Mail, label: "Email" },
                { id: "sms", icon: Zap, label: "SMS" },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => toggleChannel(channel.id as "app" | "email" | "sms")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                    channels.includes(channel.id as "app" | "email" | "sms")
                      ? "border-[hsl(var(--accent-violet))] bg-[hsl(var(--accent-violet))/0.06] dark:bg-[hsl(var(--accent-violet))/0.2] text-[hsl(var(--accent-violet))] dark:text-[hsl(var(--accent-violet))]"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <channel.icon className="h-4 w-4" />
                  {channel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="schedule"
                checked={isScheduled}
                onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
              />
              <Label htmlFor="schedule" className="cursor-pointer">
                Schedule for later
              </Label>
            </div>
            {isScheduled && (
              <div className="flex gap-3 pl-6">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-auto"
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!selectedRecipients.length || !body}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Message Preview</DialogTitle>
                  <DialogDescription>
                    See how your message will appear to recipients
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-4 p-4">
                    {selectedRecipients.slice(0, 3).map((recipient) => (
                      <div key={recipient.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{recipient.name}</Badge>
                          <span className="text-xs text-slate-500">
                            {recipient.childName}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{subject}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {getPersonalizedPreview(recipient)}
                        </p>
                      </div>
                    ))}
                    {selectedRecipients.length > 3 && (
                      <p className="text-sm text-center text-slate-500">
                        And {selectedRecipients.length - 3} more recipients...
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSend}
              disabled={isLoading || !selectedRecipients.length || !body || !channels.length}
              className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
            >
              {isScheduled ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Send
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedRecipients.length} Recipients
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BulkMessageComposer;
