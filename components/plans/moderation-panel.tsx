"use client";

import { useState, useTransition } from "react";
import type { ModerationComment, ModerationThread } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useRoleStore } from "@/lib/stores/role-store";

interface Props {
  planId: string;
  threads: (ModerationThread & { comments: ModerationComment[] })[];
}

export function ModerationPanel({ planId, threads }: Props) {
  const role = useRoleStore((state) => state.role);
  const [message, setMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const canResolve = role !== "Teacher";

  function createThread() {
    if (!message) return;
    startTransition(async () => {
      await fetch("/api/moderation-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentPlanId: planId, createdByRole: role, message }),
      });
      setMessage("");
      router.refresh();
    });
  }

  function addComment(threadId: string) {
    const draft = commentDrafts[threadId];
    if (!draft) return;
    startTransition(async () => {
      await fetch(`/api/moderation-threads/${threadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorRole: role, message: draft }),
      });
      setCommentDrafts((state) => ({ ...state, [threadId]: "" }));
      router.refresh();
    });
  }

  function updateStatus(threadId: string, status: "Open" | "Resolved") {
    if (!canResolve) return;
    startTransition(async () => {
      await fetch(`/api/moderation-threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Posting as {role}</p>
          <Textarea
            placeholder="Open a moderation thread"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button onClick={createThread} disabled={isPending || !message} className="w-full">
            Open thread
          </Button>
        </div>
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{thread.createdByRole}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{thread.status}</span>
                  {canResolve && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(thread.id, thread.status === "Open" ? "Resolved" : "Open")}
                    >
                      {thread.status === "Open" ? "Mark resolved" : "Reopen"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {thread.comments.map((comment) => (
                  <div key={comment.id} className="rounded bg-muted/60 p-2">
                    <p className="text-xs uppercase text-muted-foreground">{comment.authorRole}</p>
                    <p>{comment.message}</p>
                  </div>
                ))}
              </div>
              <Textarea
                className="mt-2"
                placeholder="Add comment"
                value={commentDrafts[thread.id] ?? ""}
                onChange={(event) =>
                  setCommentDrafts((state) => ({ ...state, [thread.id]: event.target.value }))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => addComment(thread.id)}
                disabled={!commentDrafts[thread.id]}
              >
                Comment
              </Button>
            </div>
          ))}
          {threads.length === 0 && <p className="text-sm text-muted-foreground">No threads yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
