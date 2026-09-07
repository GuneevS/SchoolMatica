"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Student } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Pencil, Search, Trash2 } from "lucide-react";

interface Props {
  /**
   * Identifier of the class these students belong to. Currently used by
   * callers for routing context — the component itself relies on each
   * student's record for the API call.
   */
  classId: string;
  students: Student[];
}

export function ManageStudents({ students }: Props) {
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Filter students
  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(search.toLowerCase()) || 
    s.lastName.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      admissionNumber: formData.get("admissionNumber"),
    };

    startTransition(async () => {
      try {
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to update student");

        setEditingStudent(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not update student. Please try again.");
      }
    });
  };

  // Returns a promise so ConfirmDialog can keep its loader spinning until done.
  const performRemove = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove student");
      toast.success("Student removed from class");
      router.refresh();
    } catch (error) {
      console.error("[ManageStudents] remove failed:", error);
      toast.error("Could not remove student. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage learners in this class ({students.length} total)</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No students match your search." : "No students in this class."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.firstName} ${student.lastName}`} />
                      <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium leading-none truncate" title={`${student.firstName} ${student.lastName}`}>
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {student.admissionNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog open={editingStudent?.id === student.id} onOpenChange={(open) => !open && setEditingStudent(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingStudent(student)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Student</DialogTitle>
                          <DialogDescription>
                            Update details for {student.firstName} {student.lastName}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="admissionNumber">Admission Number</Label>
                                <Input 
                                    id="admissionNumber" 
                                    name="admissionNumber" 
                                    defaultValue={student.admissionNumber} 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        name="firstName" 
                                        defaultValue={student.firstName} 
                                        required 
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        name="lastName" 
                                        defaultValue={student.lastName} 
                                        required 
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => setRemoveTarget(student)}
                      aria-label={`Remove ${student.firstName} ${student.lastName} from class`}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove student from class?"
        description={
          removeTarget ? (
            <span>
              <span className="font-medium text-foreground">
                {removeTarget.firstName} {removeTarget.lastName}
              </span>{" "}
              will be removed from this class. Any marks captured for this class
              are also deleted. This action cannot be undone.
            </span>
          ) : undefined
        }
        confirmLabel="Remove student"
        confirmVariant="destructive"
        typedConfirmation={
          removeTarget
            ? {
                expected: `${removeTarget.firstName} ${removeTarget.lastName}`,
                label: "Type the student's full name to confirm",
              }
            : undefined
        }
        onConfirm={async () => {
          if (removeTarget) await performRemove(removeTarget.id);
        }}
      />
    </Card>
  );
}
