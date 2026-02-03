"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  X,
  User,
  GraduationCap,
  Users,
  Shield,
  Check,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipientOption, Participant } from "./messaging-types";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (data: {
    recipients: Participant[];
    subject?: string;
    message: string;
    type: string;
  }) => Promise<void>;
  schoolId: string;
  userRole: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  teacher: <GraduationCap className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  parent: <Users className="h-4 w-4" />,
  student: <User className="h-4 w-4" />,
  staff: <User className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  teacher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  parent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  student: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  staff: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateConversation,
  schoolId,
  userRole,
}: NewConversationDialogProps) {
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Search for recipients
  const searchRecipients = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/users?search=${encodeURIComponent(query)}&schoolId=${schoolId}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        const users = (data.users || []).map((user: {
          id: string;
          displayName?: string;
          name?: string;
          email?: string;
          role?: string;
          teacher?: { role?: string };
        }) => ({
          id: user.id,
          name: user.displayName || user.name || "Unknown",
          email: user.email,
          role: user.teacher?.role || user.role || "Staff",
          type: user.teacher ? "teacher" : (user.role?.toLowerCase() || "staff"),
          subtitle: user.email,
        }));
        // Filter out already selected recipients
        setSearchResults(users.filter((u: RecipientOption) => !recipients.some(r => r.id === u.id)));
      }
    } catch (error) {
      console.error("Failed to search recipients:", error);
    } finally {
      setIsSearching(false);
    }
  }, [schoolId, recipients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchRecipients(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchRecipients]);

  const addRecipient = (recipient: RecipientOption) => {
    setRecipients((prev) => [...prev, recipient]);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCreate = async () => {
    if (recipients.length === 0 || !message.trim()) return;

    setIsCreating(true);
    try {
      await onCreateConversation({
        recipients: recipients.map((r) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          type: r.type,
        })),
        subject: subject.trim() || undefined,
        message: message.trim(),
        type: recipients.length > 1 ? "Group" : "Direct",
      });
      // Reset form
      setRecipients([]);
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-[hsl(var(--accent-iris))]" />
            New Conversation
          </DialogTitle>
          <DialogDescription>
            Start a conversation with teachers, staff, or administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex flex-wrap gap-2 p-2 min-h-[44px] border rounded-lg bg-muted/30">
              {recipients.map((recipient) => (
                <Badge
                  key={recipient.id}
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-1.5 pr-1",
                    roleColors[recipient.type || "staff"]
                  )}
                >
                  {roleIcons[recipient.type || "staff"]}
                  <span>{recipient.name}</span>
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="ml-1 rounded-full hover:bg-black/10 p-0.5"
                    aria-label={`Remove ${recipient.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground"
                    aria-label="Add recipient"
                  >
                    <Search className="h-3.5 w-3.5 mr-1" />
                    {recipients.length === 0 ? "Search for recipient..." : "Add more..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {isSearching ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                        <CommandEmpty>No results found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {searchResults.map((result) => (
                            <CommandItem
                              key={result.id}
                              onSelect={() => addRecipient(result)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(result.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{result.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.role}
                                  {result.subtitle && ` · ${result.subtitle}`}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {result.type}
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Subject (optional) */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Question about homework"
              className="bg-muted/30"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="bg-muted/30 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={recipients.length === 0 || !message.trim() || isCreating}
            className="bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] hover:opacity-90"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
