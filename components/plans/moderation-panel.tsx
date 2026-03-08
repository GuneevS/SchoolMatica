"use client";

import { useState, useTransition } from "react";
import type { ModerationComment, ModerationThread } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useRoleStore } from "@/lib/stores/role-store";

interface ThreadEvent {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorRole: string;
  note: string | null;
  createdAt: string;
}

interface Props {
  planId: string;
  threads: (ModerationThread & {
    comments: ModerationComment[];
    events?: ThreadEvent[];
  })[];
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Open: "default",
  Resolved: "secondary",
  Escalated: "destructive",
};

export function ModerationPanel({ planId, threads }: Props) {
  const role = useRoleStore((state) => state.role);
  const [message, setMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [resolutionSummary, setResolutionSummary] = useState<Record<string, string>>({});
  const [escalationReason, setEscalationReason] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<Record<string, "resolve" | "escalate" | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const canModerate = role !== "Teacher";

  function createThread() {
    if (!message) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/moderation-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentPlanId: planId, createdByRole: role, message }),
      });
      if (res.ok) {
        setMessage("");
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || "Failed to create thread");
        } catch {
          setError("Failed to create thread");
        }
      }
      router.refresh();
    });
  }

  function addComment(threadId: string) {
    const draft = commentDrafts[threadId];
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/moderation-threads/${threadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorRole: role, message: draft }),
      });
      if (res.ok) {
        setCommentDrafts((s) => ({ ...s, [threadId]: "" }));
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || "Failed to add comment");
        } catch {
          setError("Failed to add comment");
        }
      }
      router.refresh();
    });
  }

  function updateStatus(
    threadId: string,
    status: "Open" | "Resolved" | "Escalated"
  ) {
    if (!canModerate) return;
    setError(null);

    const body: Record<string, string> = { status };
    if (status === "Resolved") {
      const summary = resolutionSummary[threadId];
      if (!summary || summary.length < 3) {
        setError("Please provide a resolution summary (at least 3 characters)");
        return;
      }
      body.resolutionSummary = summary;
    }
    if (status === "Escalated") {
      const reason = escalationReason[threadId];
      if (!reason || reason.length < 3) {
        setError("Please provide an escalation reason (at least 3 characters)");
        return;
      }
      body.escalationReason = reason;
    }

    startTransition(async () => {
      const res = await fetch(`/api/moderation-threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setActiveAction((s) => ({ ...s, [threadId]: null }));
        setResolutionSummary((s) => ({ ...s, [threadId]: "" }));
        setEscalationReason((s) => ({ ...s, [threadId]: "" }));
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || "Failed to update status");
        } catch {
          setError("Failed to update status");
        }
      }
      router.refresh();
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Posting as {role}</p>
          <Textarea
            placeholder="Open a moderation thread"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={createThread} disabled={isPending || !message} className="w-full">
            Open thread
          </Button>
        </div>

        <div className="space-y-4">
          {threads.map((thread) => {
            const action = activeAction[thread.id];
            const isResolved = thread.status === "Resolved";

            return (
              <div key={thread.id} className="rounded-md border p-3 text-sm space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">{thread.createdByRole}</span>
                  <Badge variant={STATUS_BADGE[thread.status] ?? "outline"}>
                    {thread.status}
                  </Badge>
                </div>

                {/* Resolution / Escalation info */}
                {thread.resolutionSummary && (
                  <div className="rounded bg-green-50 dark:bg-green-950/30 p-2 text-xs">
                    <span className="font-medium">Resolution:</span> {thread.resolutionSummary}
                  </div>
                )}
                {thread.escalationReason && thread.status === "Escalated" && (
                  <div className="rounded bg-red-50 dark:bg-red-950/30 p-2 text-xs">
                    <span className="font-medium">Escalation reason:</span> {thread.escalationReason}
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-2">
                  {thread.comments.map((comment) => (
                    <div key={comment.id} className="rounded bg-muted/60 p-2">
                      <p className="text-xs uppercase text-muted-foreground">{comment.authorRole}</p>
                      <p>{comment.message}</p>
                    </div>
                  ))}
                </div>

                {/* Event timeline */}
                {thread.events && thread.events.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Activity log ({thread.events.length})
                    </summary>
                    <div className="mt-1 space-y-1 border-l-2 border-muted pl-3">
                      {thread.events.map((evt) => (
                        <div key={evt.id} className="text-muted-foreground">
                          <span className="font-medium text-foreground">{evt.actorRole}</span>
                          {" "}
                          {evt.eventType === "resolution" && "resolved"}
                          {evt.eventType === "escalation" && "escalated"}
                          {evt.eventType === "reopen" && "reopened"}
                          {evt.eventType === "status_change" && `changed status to ${evt.toStatus}`}
                          {evt.note && <span className="italic"> — {evt.note}</span>}
                          <span className="ml-1">{formatDate(evt.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Comment input (disabled for resolved threads) */}
                {!isResolved && (
                  <>
                    <Textarea
                      placeholder="Add comment"
                      value={commentDrafts[thread.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((s) => ({ ...s, [thread.id]: e.target.value }))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addComment(thread.id)}
                      disabled={!commentDrafts[thread.id]}
                    >
                      Comment
                    </Button>
                  </>
                )}

                {/* Action buttons */}
                {canModerate && (
                  <div className="space-y-2 border-t pt-2">
                    {/* Resolve action */}
                    {action === "resolve" && (
                      <div className="space-y-1">
                        <Textarea
                          placeholder="Resolution summary (required)"
                          value={resolutionSummary[thread.id] ?? ""}
                          onChange={(e) =>
                            setResolutionSummary((s) => ({ ...s, [thread.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => updateStatus(thread.id, "Resolved")}
                            disabled={isPending}
                          >
                            Confirm resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveAction((s) => ({ ...s, [thread.id]: null }))}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Escalate action */}
                    {action === "escalate" && (
                      <div className="space-y-1">
                        <Textarea
                          placeholder="Escalation reason (required)"
                          value={escalationReason[thread.id] ?? ""}
                          onChange={(e) =>
                            setEscalationReason((s) => ({ ...s, [thread.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(thread.id, "Escalated")}
                            disabled={isPending}
                          >
                            Confirm escalate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveAction((s) => ({ ...s, [thread.id]: null }))}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Main action buttons (visible when no sub-form is open) */}
                    {!action && (
                      <div className="flex flex-wrap gap-1">
                        {thread.status === "Open" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveAction((s) => ({ ...s, [thread.id]: "resolve" }))}
                            >
                              Mark resolved
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/50"
                              onClick={() => setActiveAction((s) => ({ ...s, [thread.id]: "escalate" }))}
                            >
                              Escalate
                            </Button>
                          </>
                        )}
                        {thread.status === "Resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(thread.id, "Open")}
                            disabled={isPending}
                          >
                            Reopen
                          </Button>
                        )}
                        {thread.status === "Escalated" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveAction((s) => ({ ...s, [thread.id]: "resolve" }))}
                            >
                              Mark resolved
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatus(thread.id, "Open")}
                              disabled={isPending}
                            >
                              Reopen
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {threads.length === 0 && <p className="text-sm text-muted-foreground">No threads yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
