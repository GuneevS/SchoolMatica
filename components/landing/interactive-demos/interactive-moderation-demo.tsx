"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateDemoModerationData, getModerationStatusColor } from "@/lib/demo/demo-data-generator";
import { cn } from "@/lib/utils";

const PRESET_COMMENTS = {
  Teacher: [
    "Submitted assessment plan for Term 3. Total weighting: 35% as per CAPS requirements.",
    "I've updated the assessment dates to avoid clashes with other exams.",
    "The PAT rubric is attached with detailed assessment criteria.",
  ],
  HOD: [
    "Plan structure looks good. Could you clarify the PAT assessment criteria?",
    "Please check the Test 3 date - it may clash with Grade 11 exam schedule.",
    "Plan approved. Ensure moderation samples are ready by end of term.",
  ],
  SMT: [
    "This assessment structure aligns well with our school's assessment policy.",
    "Excellent integration of formative and summative assessments.",
    "Approved for implementation. Looking forward to the results.",
  ],
};

interface InteractiveModerationDemoProps {
  onInteraction?: () => void;
}

export function InteractiveModerationDemo({ onInteraction }: InteractiveModerationDemoProps) {
  const initialData = useMemo(() => generateDemoModerationData(), []);

  const [thread, setThread] = useState(initialData);
  const [activeRole, setActiveRole] = useState<"Teacher" | "HOD" | "SMT">("Teacher");
  const [commentDraft, setCommentDraft] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  // Handle role switch
  const handleRoleSwitch = (role: "Teacher" | "HOD" | "SMT") => {
    if (onInteraction) onInteraction();
    setActiveRole(role);
    setCommentDraft("");
    setSelectedPreset("");
  };

  // Handle preset comment selection
  const handlePresetSelect = (comment: string) => {
    if (onInteraction) onInteraction();
    setSelectedPreset(comment);
    setCommentDraft(comment);
  };

  // Handle add comment
  const handleAddComment = () => {
    if (onInteraction) onInteraction();
    if (!commentDraft.trim()) return;

    const newComment = {
      id: `comment_${Date.now()}`,
      authorRole: activeRole,
      authorName: activeRole === "Teacher" ? "Ms. Mokoena" : activeRole === "HOD" ? "Mr. Nkosi" : "Dr. Mthembu",
      message: commentDraft,
      createdAt: new Date(),
    };

    setThread({
      ...thread,
      comments: [...thread.comments, newComment],
      updatedAt: new Date(),
    });

    setCommentDraft("");
    setSelectedPreset("");
  };

  // Handle status change
  const handleStatusChange = (status: typeof thread.status) => {
    if (onInteraction) onInteraction();
    setThread({ ...thread, status, updatedAt: new Date() });
  };

  // Get role avatar color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Teacher":
        return "bg-blue-500";
      case "HOD":
        return "bg-[hsl(var(--accent-iris))]";
      case "SMT":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("");
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{thread.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created by {thread.createdByRole} • {thread.comments.length} comments
              </p>
            </div>
            <Badge className={getModerationStatusColor(thread.status)}>
              {thread.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Role Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">View as:</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Teacher", "HOD", "SMT"] as const).map((role) => (
                <Button
                  key={role}
                  variant={activeRole === role ? "default" : "outline"}
                  onClick={() => handleRoleSwitch(role)}
                  className="w-full"
                >
                  {role}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeRole === "Teacher" && "Teachers can create threads and respond to concerns."}
              {activeRole === "HOD" && "HODs can review, comment, and resolve threads."}
              {activeRole === "SMT" && "SMT can approve, resolve, and provide final oversight."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comment Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Discussion Thread
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {thread.comments.map((comment, index) => (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg transition-all",
                  comment.authorRole === activeRole ? "bg-primary/5" : "bg-muted/30",
                  "animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar className={cn("w-10 h-10", getRoleColor(comment.authorRole))}>
                  <AvatarFallback className="text-white font-semibold">
                    {getInitials(comment.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.authorName}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.authorRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {comment.createdAt.toLocaleDateString()} {comment.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Avatar className={cn("w-8 h-8", getRoleColor(activeRole))}>
                <AvatarFallback className="text-white text-xs font-semibold">
                  {activeRole[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Add comment as {activeRole}</span>
            </div>

            {/* Preset Comments */}
            <Select value={selectedPreset} onValueChange={handlePresetSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a quick response..." />
              </SelectTrigger>
              <SelectContent>
                {PRESET_COMMENTS[activeRole].map((comment, index) => (
                  <SelectItem key={index} value={comment}>
                    {comment.substring(0, 50)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder={`Write your ${activeRole} comment here...`}
              value={commentDraft}
              onChange={(e) => {
                if (onInteraction) onInteraction();
                setCommentDraft(e.target.value);
              }}
              rows={3}
              className="resize-none"
            />

            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddComment}
                disabled={!commentDraft.trim()}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Add Comment
              </Button>

              {(activeRole === "HOD" || activeRole === "SMT") && (
                <>
                  {thread.status !== "Approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("Approved")}
                      className="text-green-600"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {thread.status !== "ChangesRequested" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("ChangesRequested")}
                      className="text-orange-600"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Workflow Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { role: "Teacher", action: "Created thread", time: thread.createdAt },
              ...thread.comments.slice(0, 3).map((c) => ({
                role: c.authorRole,
                action: "Added comment",
                time: c.createdAt,
              })),
            ].map((event, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", getRoleColor(event.role))} />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{event.role}</span> {event.action}
                </div>
                <span className="text-xs text-muted-foreground">
                  {event.time.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>Demo Features:</strong> Switch roles to see different perspectives, select quick responses, add custom comments, and approve/request changes as HOD or SMT.
        </p>
      </div>
    </div>
  );
}
