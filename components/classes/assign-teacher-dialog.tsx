"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Option {
  id: string;
  name: string;
}

interface AssignTeacherDialogProps {
  classId: string;
  subjectId?: string;
  teachers: Option[];
  triggerLabel?: string;
}

export function AssignTeacherDialog({ classId, subjectId, teachers, triggerLabel = "Assign teacher" }: AssignTeacherDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id ?? "");
  const [role, setRole] = useState("Support");
  const [primary, setPrimary] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasTeachers = teachers.length > 0;

  function handleAssign() {
    if (!teacherId) return;
    startTransition(async () => {
      await fetch("/api/teacher-class-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId: classId,
          teacherId,
          role,
          subjectId,
          primary,
        }),
      });
      setOpen(false);
      setPrimary(false);
      setRole("Support");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!hasTeachers} onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign teacher</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Mentor">Mentor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))/0.5] px-3 py-2">
            <div>
              <Label className="text-sm font-medium">Set as primary teacher</Label>
              <p className="text-xs text-muted-foreground">Primary teachers appear on class cards and learner profiles.</p>
            </div>
            <Input type="checkbox" checked={primary} onChange={(event) => setPrimary(event.target.checked)} className="h-4 w-4" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isPending || !teacherId}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

