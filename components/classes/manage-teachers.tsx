"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Teacher, ClassTeacherAssignment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface TeacherWithAssignment extends ClassTeacherAssignment {
  teacher: Teacher;
}

interface Props {
  classId: string;
  assignments: TeacherWithAssignment[];
  allTeachers: Teacher[];
  subjects?: { id: string; name: string }[];
}

export function ManageTeachers({ classId, assignments, allTeachers, subjects = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [role, setRole] = useState("Support");
  const [isPending, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<TeacherWithAssignment | null>(null);
  const router = useRouter();

  // Filter out teachers already assigned
  const availableTeachers = allTeachers.filter(
    (t) => !assignments.some((a) => a.teacherId === t.id)
  );

  const handleAssign = async () => {
    if (!selectedTeacher) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/teachers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId: selectedTeacher,
            role: role,
            subjectId: selectedSubject || undefined,
          }),
        });

        if (!res.ok) {
            const data = await res.json();
             throw new Error(data.error || "Failed to assign teacher");
        }

        setOpen(false);
        setSelectedTeacher("");
        setSelectedSubject("");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not assign teacher. Please try again.");
      }
    });
  };

  // Awaitable so ConfirmDialog can keep its loader visible until done.
  const performRemove = async (teacherId: string) => {
    try {
      const res = await fetch(
        `/api/classes/${classId}/teachers?teacherId=${teacherId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to remove teacher");
      toast.success("Teacher removed from class");
      router.refresh();
    } catch (error) {
      console.error("[ManageTeachers] remove failed:", error);
      toast.error("Could not remove teacher. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Manage educators assigned to this class</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Teacher</DialogTitle>
                <DialogDescription>
                  Select a teacher to assign to this class.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead Teacher</SelectItem>
                      <SelectItem value="Subject">Subject Teacher</SelectItem>
                      <SelectItem value="Support">Support Teacher</SelectItem>
                      <SelectItem value="Substitute">Substitute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {subjects.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject (optional)</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific subject</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Specify which subject this teacher will teach in this class</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={isPending || !selectedTeacher}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No teachers assigned yet.
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between rounded-lg border p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignment.teacher.firstName} ${assignment.teacher.lastName}`} />
                    <AvatarFallback>{assignment.teacher.firstName[0]}{assignment.teacher.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-none">
                      {assignment.teacher.firstName} {assignment.teacher.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{assignment.teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={assignment.role === "Lead" ? "default" : assignment.role === "Subject" ? "outline" : "secondary"}>
                    {assignment.role}
                  </Badge>
                  {assignment.subjectId && subjects.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {subjects.find(s => s.id === assignment.subjectId)?.name || "Subject"}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => setRemoveTarget(assignment)}
                    aria-label={`Remove ${assignment.teacher.firstName} ${assignment.teacher.lastName} from class`}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove teacher from class?"
        description={
          removeTarget ? (
            <span>
              <span className="font-medium text-foreground">
                {removeTarget.teacher.firstName} {removeTarget.teacher.lastName}
              </span>{" "}
              will no longer be assigned to this class. Their other class
              assignments and the teacher record itself remain unchanged.
            </span>
          ) : undefined
        }
        confirmLabel="Remove teacher"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (removeTarget) await performRemove(removeTarget.teacherId);
        }}
      />
    </Card>
  );
}
