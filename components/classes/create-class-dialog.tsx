"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(3),
  grade: z.number().int(),
  year: z.number().int(),
  subjectId: z.string(),
  gradeLevelId: z.string().optional(),
  primaryTeacherId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SubjectOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface GradeOption {
  id: string;
  name: string;
}

interface Props {
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  grades: GradeOption[];
}

export function CreateClassDialog({ subjects, teachers, grades }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      grade: 8,
      year: new Date().getFullYear(),
      subjectId: subjects[0]?.id ?? "",
      gradeLevelId: grades[0]?.id,
      primaryTeacherId: "",
    },
  });
  const [selectedSubject, setSelectedSubject] = useState(form.getValues("subjectId"));
  const gradeLevelId = useWatch({ control: form.control, name: "gradeLevelId" }) ?? "";
  const primaryTeacherId = useWatch({ control: form.control, name: "primaryTeacherId" }) ?? "";

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create class</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new class</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label>Class name</Label>
            <Input placeholder="Grade 10A English HL" {...form.register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Grade</Label>
              <Input type="number" {...form.register("grade", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" {...form.register("year", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Select
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value);
                form.setValue("subjectId", value);
              }}
            >
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
            <Label>Grade band</Label>
            <Select
              value={gradeLevelId}
              onValueChange={(value) => form.setValue("gradeLevelId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((gradeOption) => (
                  <SelectItem key={gradeOption.id} value={gradeOption.id}>
                    {gradeOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Primary teacher</Label>
            <Select
              value={primaryTeacherId}
              onValueChange={(value) => form.setValue("primaryTeacherId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign lead teacher" />
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
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
