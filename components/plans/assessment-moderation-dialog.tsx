"use client";

import { useState, useTransition } from "react";
import type { Assessment, ModerationComment, ModerationThread } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRoleStore } from "@/lib/stores/role-store";
import { useRouter } from "next/navigation";

interface Props {
  assessment: Assessment;
  threads: (ModerationThread & { comments: ModerationComment[] })[];
  canResolve: boolean;
}

export function AssessmentModerationDialog({ assessment, threads, canResolve }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const role = useRoleStore((state) => state.role);

  function openThread() {
    if (!message) return;
    startTransition(async () => {
      await fetch("/api/moderation-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id, createdByRole: role, message }),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Moderation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Moderation for {assessment.taskName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase text-muted-foreground">New thread</p>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Raise an issue" />
            <DialogFooter>
              <Button onClick={openThread} disabled={isPending || !message}>
                Open thread
              </Button>
            </DialogFooter>
          </div>
          <div className="space-y-3">
            {threads.map((thread) => (
              <div key={thread.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{thread.createdByRole}</span>
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
                <div className="space-y-2">
                  {thread.comments.map((comment) => (
                    <div key={comment.id} className="rounded bg-muted/60 p-2 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">{comment.authorRole}</p>
                      <p>{comment.message}</p>
                    </div>
                  ))}
                </div>
                <Textarea
                  placeholder="Add comment"
                  value={commentDrafts[thread.id] ?? ""}
                  onChange={(event) =>
                    setCommentDrafts((state) => ({ ...state, [thread.id]: event.target.value }))
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
              </div>
            ))}
            {threads.length === 0 && <p className="text-sm text-muted-foreground">No assessment-specific threads.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
