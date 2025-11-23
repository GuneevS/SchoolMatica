"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Teacher, ClassTeacherAssignment } from "@prisma/client";
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
import { Loader2, Plus, Trash2, UserX } from "lucide-react";

interface TeacherWithAssignment extends ClassTeacherAssignment {
  teacher: Teacher;
}

interface Props {
  classId: string;
  assignments: TeacherWithAssignment[];
  allTeachers: Teacher[];
}

export function ManageTeachers({ classId, assignments, allTeachers }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [role, setRole] = useState("Support");
  const [isPending, startTransition] = useTransition();
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
          }),
        });

        if (!res.ok) {
            const data = await res.json();
             throw new Error(data.error || "Failed to assign teacher");
        }

        setOpen(false);
        setSelectedTeacher("");
        router.refresh();
      } catch (error) {
        console.error(error);
        alert("Failed to assign teacher");
      }
    });
  };

  const handleRemove = async (teacherId: string) => {
    if (!confirm("Are you sure you want to remove this teacher from the class?")) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/teachers?teacherId=${teacherId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to remove teacher");

        router.refresh();
      } catch (error) {
        console.error(error);
        alert("Failed to remove teacher");
      }
    });
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
                      <SelectItem value="Support">Support Teacher</SelectItem>
                      <SelectItem value="Substitute">Substitute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Badge variant={assignment.role === "Lead" ? "default" : "secondary"}>
                    {assignment.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => handleRemove(assignment.teacherId)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
