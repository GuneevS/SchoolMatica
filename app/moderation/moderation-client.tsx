"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import {
  Shield,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  Send,
  RotateCcw,
  ArrowUpRight,
  Activity,
  FileText,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationComment {
  id: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

interface ModerationThread {
  id: string;
  title: string;
  kind: string;
  status: string;
  createdByRole: string;
  resolutionSummary: string | null;
  escalationReason: string | null;
  createdAt: string;
  updatedAt: string;
  className: string;
  grade: string;
  subject: string;
  assessmentPlanId: string | null;
  assessmentId: string | null;
  comments: ModerationComment[];
  documentCount: number;
}

interface ModerationHubClientProps {
  threads: ModerationThread[];
  stats: { open: number; escalated: number; resolved: number; total: number };
  currentRole: string;
  schoolId: string;
}

const STATUS_CONFIG = {
  Open: { badge: "default" as const, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
  Escalated: { badge: "destructive" as const, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
  Resolved: { badge: "secondary" as const, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const ROLE_COLORS: Record<string, string> = {
  Teacher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HOD: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Head of Department": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  SMT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Senior Management": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Principal: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "School Admin": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Admin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

export function ModerationHubClient({ threads, stats, currentRole, schoolId }: ModerationHubClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [escalationDrafts, setEscalationDrafts] = useState<Record<string, string>>({});
  const [actionMode, setActionMode] = useState<Record<string, "resolve" | "escalate" | null>>({});
  const [error, setError] = useState<string | null>(null);

  const canModerate = !["Teacher"].includes(currentRole);

  const filteredThreads = threads.filter((thread) => {
    if (statusFilter !== "all" && thread.status !== statusFilter) return false;
    if (kindFilter !== "all" && thread.kind !== kindFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(q) ||
        thread.subject.toLowerCase().includes(q) ||
        thread.className.toLowerCase().includes(q) ||
        thread.grade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function addComment(threadId: string) {
    const draft = commentDrafts[threadId];
    if (!draft?.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/moderation-threads/${threadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorRole: currentRole, message: draft.trim() }),
      });
      if (res.ok) {
        setCommentDrafts((s) => ({ ...s, [threadId]: "" }));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Failed to add comment");
      }
      router.refresh();
    });
  }

  async function updateStatus(threadId: string, status: "Open" | "Resolved" | "Escalated") {
    if (!canModerate) return;
    setError(null);

    const body: Record<string, string> = { status };
    if (status === "Resolved") {
      const summary = resolutionDrafts[threadId];
      if (!summary || summary.length < 3) {
        setError("Resolution summary required (min 3 characters)");
        return;
      }
      body.resolutionSummary = summary;
    }
    if (status === "Escalated") {
      const reason = escalationDrafts[threadId];
      if (!reason || reason.length < 3) {
        setError("Escalation reason required (min 3 characters)");
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
        setActionMode((s) => ({ ...s, [threadId]: null }));
        setResolutionDrafts((s) => ({ ...s, [threadId]: "" }));
        setEscalationDrafts((s) => ({ ...s, [threadId]: "" }));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Failed to update status");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <AuroraHero
        eyebrow="Quality Assurance"
        title={
          <>
            <span className="gradient-text">Moderation</span> Hub
          </>
        }
        description="Review, moderate, and approve assessments across all grades and subjects. Track quality assurance workflows aligned with South African CAPS moderation standards."
        badges={[
          { label: "Pre-moderation", color: "hsl(var(--accent-iris))" },
          { label: "Post-moderation", color: "hsl(var(--accent-mint))" },
          { label: "Escalation workflows", color: "hsl(var(--accent-violet))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Moderation overview"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              { label: "Open", value: stats.open.toString(), helper: "Awaiting review", accent: stats.open > 0 ? "highlight" : undefined },
              { label: "Escalated", value: stats.escalated.toString(), helper: "Needs attention", accent: stats.escalated > 0 ? "highlight" : undefined },
              { label: "Resolved", value: stats.resolved.toString() },
              { label: "Total", value: stats.total.toString() },
            ]}
          />
        }
      />

      {/* SA Moderation Context */}
      <Card className="border-[hsl(var(--accent-iris))/0.3] bg-[hsl(var(--accent-iris))/0.05]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[hsl(var(--accent-iris))] mt-0.5" />
            <div>
              <p className="text-sm font-medium">SA CAPS Moderation Workflow</p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Teacher</strong> submits assessment for pre-moderation →{" "}
                <strong>HOD</strong> reviews quality, alignment to CAPS, and mark allocation →{" "}
                <strong>HOD</strong> approves, requests changes, or escalates to SMT →{" "}
                <strong>SMT/Principal</strong> handles escalated items and provides final sign-off.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, subject, class, or grade..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="plan">Assessment Plan</SelectItem>
                <SelectItem value="assessment">Individual Assessment</SelectItem>
                <SelectItem value="moderation">General Moderation</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="h-9 px-3">
              Posting as <span className="font-semibold ml-1">{currentRole}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Thread List */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium">No moderation threads</h3>
              <p className="text-sm text-muted-foreground">
                {threads.length === 0
                  ? "No assessments have been submitted for moderation yet. Teachers can submit assessments for review from the Assessment Plans page."
                  : "No threads match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredThreads.map((thread) => {
            const config = STATUS_CONFIG[thread.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Open;
            const StatusIcon = config.icon;
            const isExpanded = expandedThreadId === thread.id;
            const action = actionMode[thread.id];

            return (
              <Card key={thread.id} className="overflow-hidden">
                <div className="flex">
                  <div className={cn("w-1.5 shrink-0", config.bg.replace("/10", ""))} />
                  <div className="flex-1">
                    {/* Thread Header */}
                    <button
                      onClick={() => setExpandedThreadId(isExpanded ? null : thread.id)}
                      className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant={config.badge}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {thread.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {thread.kind === "plan" ? "Assessment Plan" : thread.kind === "assessment" ? "Assessment" : "Moderation"}
                            </Badge>
                            {thread.documentCount > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <FileText className="h-3 w-3" />
                                {thread.documentCount}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base truncate">{thread.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users2 className="h-3 w-3" />
                              {thread.grade} · {thread.className}
                            </span>
                            <span>{thread.subject}</span>
                            <span>·</span>
                            <span>Opened by {thread.createdByRole}</span>
                            <span>·</span>
                            <span>{formatShortDate(thread.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {thread.comments.length}
                          </Badge>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t px-5 pb-5">
                        {/* Resolution / Escalation Info */}
                        {thread.resolutionSummary && (
                          <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">Resolution:</span>{" "}
                            {thread.resolutionSummary}
                          </div>
                        )}
                        {thread.escalationReason && thread.status === "Escalated" && (
                          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm">
                            <span className="font-medium text-red-700 dark:text-red-400">Escalation reason:</span>{" "}
                            {thread.escalationReason}
                          </div>
                        )}

                        {/* Comments Thread */}
                        <div className="mt-4 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Discussion ({thread.comments.length})
                          </p>
                          {thread.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                                {comment.authorRole.charAt(0)}
                              </div>
                              <div className="flex-1 rounded-lg bg-muted/50 p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={cn("text-xs", ROLE_COLORS[comment.authorRole] || "bg-slate-100 text-slate-700")}>
                                    {comment.authorRole}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment */}
                        {thread.status !== "Resolved" && (
                          <div className="mt-4 flex gap-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={commentDrafts[thread.id] || ""}
                              onChange={(e) => setCommentDrafts((s) => ({ ...s, [thread.id]: e.target.value }))}
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              className="self-end"
                              onClick={() => addComment(thread.id)}
                              disabled={isPending || !commentDrafts[thread.id]?.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {canModerate && (
                          <div className="mt-4 border-t pt-4 space-y-3">
                            {/* Resolve form */}
                            {action === "resolve" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Resolution summary — describe what was approved, changed, or agreed upon..."
                                  value={resolutionDrafts[thread.id] || ""}
                                  onChange={(e) => setResolutionDrafts((s) => ({ ...s, [thread.id]: e.target.value }))}
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateStatus(thread.id, "Resolved")} disabled={isPending}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Confirm Resolution
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setActionMode((s) => ({ ...s, [thread.id]: null }))}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Escalate form */}
                            {action === "escalate" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Escalation reason — why does this need SMT/Principal attention..."
                                  value={escalationDrafts[thread.id] || ""}
                                  onChange={(e) => setEscalationDrafts((s) => ({ ...s, [thread.id]: e.target.value }))}
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="destructive" onClick={() => updateStatus(thread.id, "Escalated")} disabled={isPending}>
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                    Confirm Escalation
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setActionMode((s) => ({ ...s, [thread.id]: null }))}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Main action buttons */}
                            {!action && (
                              <div className="flex flex-wrap gap-2">
                                {thread.status === "Open" && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => setActionMode((s) => ({ ...s, [thread.id]: "resolve" }))}>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Mark Resolved
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                      onClick={() => setActionMode((s) => ({ ...s, [thread.id]: "escalate" }))}
                                    >
                                      <ArrowUpRight className="h-4 w-4 mr-1" />
                                      Escalate to SMT
                                    </Button>
                                  </>
                                )}
                                {thread.status === "Escalated" && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => setActionMode((s) => ({ ...s, [thread.id]: "resolve" }))}>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Mark Resolved
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => updateStatus(thread.id, "Open")} disabled={isPending}>
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Reopen
                                    </Button>
                                  </>
                                )}
                                {thread.status === "Resolved" && (
                                  <Button variant="outline" size="sm" onClick={() => updateStatus(thread.id, "Open")} disabled={isPending}>
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Reopen for Further Review
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
