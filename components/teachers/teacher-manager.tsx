"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGate } from "@/components/auth/permission-gate";

type Assignment = {
  id: string;
  role: string;
  classGroup?: { id: string; name: string };
  subject?: { id: string; name: string };
};

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  bio?: string | null;
  classAssignments: Assignment[];
  subjectAssignments: { id: string; grade?: number | null; subject: { id: string; name: string } }[];
};

type Option = { id: string; name: string };

interface TeacherManagerProps {
  teachers: Teacher[];
  classes: Option[];
  subjects: Option[];
  schoolId: string;
}

export function TeacherManager({ teachers, classes, subjects, schoolId }: TeacherManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Teacher",
    bio: "",
  });
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((state) => ({ ...state, [name]: value }));
  }

  function createTeacher() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, schoolId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error 
            ? (Array.isArray(errorData.error) 
              ? errorData.error.map((e: { message?: string }) => e.message).join(", ")
              : errorData.error)
            : `Failed to create teacher (${response.status})`;
          toast.error("Error creating teacher", { description: errorMessage });
          return;
        }
        
        const teacher = await response.json();
        setOpen(false);
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "Teacher",
          bio: "",
        });
        toast.success("Teacher created", { 
          description: `${teacher.firstName} ${teacher.lastName} has been added successfully.` 
        });
        router.refresh();
      } catch (error) {
        console.error("Error creating teacher:", error);
        toast.error("Error creating teacher", { 
          description: "An unexpected error occurred. Please try again." 
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PermissionGate permission="teacher:create">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create teacher</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add teacher</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First name</Label>
                  <Input name="firstName" value={form.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Last name</Label>
                  <Input name="lastName" value={form.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+27..." />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Input name="role" value={form.role} onChange={handleChange} placeholder="Teacher / HOD" />
              </div>
              <div className="space-y-1">
                <Label>Bio</Label>
                <Textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="e.g. Senior English specialist" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTeacher} disabled={isPending || !form.firstName || !form.lastName || !form.email}>
                Save teacher
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </PermissionGate>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="surface-panel border border-[hsl(var(--border-strong))/0.5]">
            <CardHeader>
              <CardTitle className="text-xl">
                {teacher.firstName} {teacher.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{teacher.role}</p>
              <p className="text-xs text-muted-foreground">{teacher.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacher.bio && <p className="text-sm text-muted-foreground">{teacher.bio}</p>}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Classes</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.classAssignments.map((assignment) => (
                    <span key={assignment.id} className="rounded-full border border-[hsl(var(--border))/0.4] px-3 py-1 text-xs text-muted-foreground bg-white/10">
                      {assignment.classGroup?.name ?? "Unassigned"} · {assignment.role}
                    </span>
                  ))}
                  {teacher.classAssignments.length === 0 && <span className="text-xs text-muted-foreground">No class assignments yet.</span>}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjectAssignments.map((assignment) => (
                    <span key={assignment.id} className="rounded-full border border-[hsl(var(--border))/0.4] px-3 py-1 text-xs text-muted-foreground bg-white/10">
                      {assignment.subject.name}
                      {assignment.grade ? ` · Grade ${assignment.grade}` : ""}
                    </span>
                  ))}
                  {teacher.subjectAssignments.length === 0 && <span className="text-xs text-muted-foreground">No subject focus yet.</span>}
                </div>
              </div>
              <PermissionGate permission="class:manage">
                <div className="flex flex-wrap gap-2">
                  <AssignToClassButton teacherId={teacher.id} classes={classes} onSuccess={() => router.refresh()} />
                  <TagSubjectButton teacherId={teacher.id} subjects={subjects} onSuccess={() => router.refresh()} />
                </div>
              </PermissionGate>
            </CardContent>
          </Card>
        ))}
        {teachers.length === 0 && <p className="text-sm text-muted-foreground">No teachers captured yet.</p>}
      </div>
    </div>
  );
}

function AssignToClassButton({
  teacherId,
  classes,
  onSuccess,
}: {
  teacherId: string;
  classes: Option[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [role, setRole] = useState("Support");
  const [primary, setPrimary] = useState(false);
  const [isPending, startTransition] = useTransition();

  function assign() {
    if (!classId) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/teacher-class-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, classGroupId: classId, role, primary }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error("Error assigning class", { 
            description: errorData.error || `Failed to assign class (${response.status})` 
          });
          return;
        }
        
        setOpen(false);
        setPrimary(false);
        setRole("Support");
        toast.success("Class assigned", { description: "Teacher has been assigned to the class." });
        onSuccess();
      } catch (error) {
        console.error("Error assigning class:", error);
        toast.error("Error assigning class", { 
          description: "An unexpected error occurred. Please try again." 
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={classes.length === 0}>
          Assign to class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign teacher to class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
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
              <Label className="text-sm font-medium">Primary teacher</Label>
              <p className="text-xs text-muted-foreground">Primary teachers appear on class cards and reports.</p>
            </div>
            <Input type="checkbox" checked={primary} onChange={(event) => setPrimary(event.target.checked)} className="h-4 w-4" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={assign} disabled={isPending || !classId}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagSubjectButton({
  teacherId,
  subjects,
  onSuccess,
}: {
  teacherId: string;
  subjects: Option[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  function tag() {
    if (!subjectId) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/teacher-subject-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, subjectId, grade }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error("Error tagging subject", { 
            description: errorData.error || `Failed to tag subject (${response.status})` 
          });
          return;
        }
        
        setOpen(false);
        setGrade(undefined);
        toast.success("Subject tagged", { description: "Subject focus has been assigned." });
        onSuccess();
      } catch (error) {
        console.error("Error tagging subject:", error);
        toast.error("Error tagging subject", { 
          description: "An unexpected error occurred. Please try again." 
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={subjects.length === 0}>
          Tag subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign subject focus</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Grade (optional)</Label>
            <Input type="number" value={grade ?? ""} placeholder="e.g. 10" onChange={(event) => setGrade(event.target.value ? Number(event.target.value) : undefined)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={tag} disabled={isPending || !subjectId}>
            Save tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
