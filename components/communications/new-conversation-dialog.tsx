"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User, Users, Loader2 } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email?: string;
  role: string;
  initials: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateThread: (data: {
    type: "Direct" | "Class" | "School";
    participants: Array<{ id: string; type: string; name?: string }>;
    subject?: string;
    initialMessage?: string;
  }) => Promise<{ threadId: string } | null>;
  schoolId: string;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateThread,
  schoolId,
}: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [threadType, setThreadType] = useState<"Direct" | "Class" | "School">("Direct");

  // Search for users when query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setRecipients([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&schoolId=${schoolId}`
        );
        if (response.ok) {
          const data = await response.json();
          setRecipients(
            data.users.map((u: { id: string; displayName?: string; name?: string; email?: string; role?: string }) => ({
              id: u.id,
              name: u.displayName || u.name || u.email || "Unknown",
              email: u.email,
              role: u.role || "User",
              initials: (u.displayName || u.name || "??")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, schoolId]);

  const handleSelectRecipient = (recipient: Recipient) => {
    if (!selectedRecipients.find((r) => r.id === recipient.id)) {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
    setSearchQuery("");
    setRecipients([]);
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.id !== recipientId));
  };

  const handleCreate = async () => {
    if (selectedRecipients.length === 0) return;

    setIsCreating(true);
    try {
      const result = await onCreateThread({
        type: threadType,
        participants: selectedRecipients.map((r) => ({
          id: r.id,
          type: "user",
          name: r.name,
        })),
        subject: subject || undefined,
        initialMessage: initialMessage || undefined,
      });

      if (result) {
        // Reset form and close dialog
        setSelectedRecipients([]);
        setSubject("");
        setInitialMessage("");
        setSearchQuery("");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedRecipients([]);
    setSubject("");
    setInitialMessage("");
    setSearchQuery("");
    setRecipients([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with a parent, teacher, or staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thread Type */}
          <div className="space-y-2">
            <Label>Conversation Type</Label>
            <Select value={threadType} onValueChange={(v) => setThreadType(v as typeof threadType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Direct Message
                  </div>
                </SelectItem>
                <SelectItem value="Class">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Class Discussion
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Search */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search for users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            {/* Search Results */}
            {recipients.length > 0 && (
              <ScrollArea className="h-40 border rounded-md">
                <div className="p-2 space-y-1">
                  {recipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => handleSelectRecipient(recipient)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-flamingo))] text-white">
                          {recipient.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipient.name}</p>
                        <p className="text-xs text-slate-500 truncate">{recipient.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Selected Recipients */}
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedRecipients.map((recipient) => (
                  <Badge
                    key={recipient.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {recipient.name}
                    <button
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      className="ml-1 h-4 w-4 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject (optional) */}
          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <Input
              placeholder="e.g., Regarding homework assignment"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Initial Message (optional) */}
          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Start the conversation..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedRecipients.length === 0 || isCreating}
            className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Start Conversation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationDialog;
