"use client";

import * as React from "react";
import { useId, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
import { Search, User, Users, Loader2, X } from "lucide-react";

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
  const typeId = useId();
  const searchId = useId();
  const subjectId = useId();
  const messageId = useId();

  const [searchQuery, setSearchQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [threadType, setThreadType] = useState<"Direct" | "Class" | "School">("Direct");

  const abortRef = useRef<AbortController | null>(null);

  // Debounced + cancellable user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setRecipients([]);
      return;
    }

    const debounce = setTimeout(() => {
      // Cancel any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const searchUsers = async () => {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/users/search?q=${encodeURIComponent(searchQuery)}&schoolId=${schoolId}`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();
          setRecipients(
            data.users.map(
              (u: {
                id: string;
                displayName?: string;
                name?: string;
                email?: string;
                role?: string;
              }) => ({
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
              }),
            ),
          );
        } catch (error) {
          if ((error as Error).name === "AbortError") return;
          console.error("[NewConversation] search failed:", error);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      };

      searchUsers();
    }, 300);

    return () => {
      clearTimeout(debounce);
      abortRef.current?.abort();
    };
  }, [searchQuery, schoolId]);

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipients((prev) =>
      prev.find((r) => r.id === recipient.id) ? prev : [...prev, recipient],
    );
    setSearchQuery("");
    setRecipients([]);
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== recipientId));
  };

  const resetState = () => {
    setSelectedRecipients([]);
    setSubject("");
    setInitialMessage("");
    setSearchQuery("");
    setRecipients([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const handleCreate = async () => {
    if (selectedRecipients.length === 0 || isCreating) return;

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
        toast.success("Conversation started");
        resetState();
        onOpenChange(false);
      } else {
        toast.error("Could not start the conversation. Please try again.");
      }
    } catch (error) {
      console.error("[NewConversation] create failed:", error);
      toast.error("Could not start the conversation. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with a parent, teacher, or staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Thread type */}
          <div className="space-y-2">
            <Label htmlFor={typeId}>Conversation type</Label>
            <Select
              value={threadType}
              onValueChange={(v) => setThreadType(v as typeof threadType)}
            >
              <SelectTrigger id={typeId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct">
                  <div className="flex items-center gap-2">
                    <User aria-hidden="true" className="h-4 w-4" />
                    Direct message
                  </div>
                </SelectItem>
                <SelectItem value="Class">
                  <div className="flex items-center gap-2">
                    <Users aria-hidden="true" className="h-4 w-4" />
                    Class discussion
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient search */}
          <div className="space-y-2">
            <Label htmlFor={searchId}>
              Recipients <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={searchId}
                placeholder="Search for users…"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-describedby={`${searchId}-help`}
              />
              {isSearching && (
                <Loader2
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                />
              )}
            </div>
            <p id={`${searchId}-help`} className="text-xs text-muted-foreground">
              Type at least 2 characters to search.
            </p>

            {recipients.length > 0 && (
              <ScrollArea className="h-40 rounded-xl border">
                <ul className="space-y-1 p-2" role="listbox" aria-label="Search results">
                  {recipients.map((recipient) => (
                    <li key={recipient.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={!!selectedRecipients.find((r) => r.id === recipient.id)}
                        onClick={() => handleSelectRecipient(recipient)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-flamingo))] text-xs text-white">
                            {recipient.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{recipient.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{recipient.role}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}

            {selectedRecipients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedRecipients.map((recipient) => (
                  <Badge
                    key={recipient.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {recipient.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      aria-label={`Remove ${recipient.name}`}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor={subjectId}>Subject (optional)</Label>
            <Input
              id={subjectId}
              placeholder="e.g., Regarding homework assignment"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Initial message */}
          <div className="space-y-2">
            <Label htmlFor={messageId}>Message (optional)</Label>
            <textarea
              id={messageId}
              className="min-h-[88px] w-full rounded-xl border border-[hsl(var(--border))/0.9] bg-[hsl(var(--surface-strong))] px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-white/15 dark:bg-white/5"
              placeholder="Start the conversation…"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedRecipients.length === 0 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Start conversation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationDialog;
