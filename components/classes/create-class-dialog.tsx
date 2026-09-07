"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Home, BookOpen } from "lucide-react";

const schema = z.object({
  name: z.string().min(3),
  grade: z.number().int(),
  year: z.number().int(),
  classType: z.enum(["Homeroom", "Subject"]),
  subjectId: z.string().optional(),
  gradeLevelId: z.string().optional(),
  primaryTeacherId: z.string().optional(),
}).refine((data) => {
  // Subject is required only for Subject-type classes
  if (data.classType === "Subject" && !data.subjectId) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for subject-specific classes",
  path: ["subjectId"],
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
  order?: number;
}

interface Props {
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  grades: GradeOption[];
}

// Helper to determine default class type based on grade
function getDefaultClassType(grade: number): "Homeroom" | "Subject" {
  // Foundation (R-3) defaults to homeroom, but user can always override
  // Intermediate (4-6) defaults to homeroom but many schools use subject classes
  // Senior (7-9) and FET (10-12) default to subject-specific classes
  return grade <= 3 ? "Homeroom" : grade <= 6 ? "Homeroom" : "Subject";
}

export function CreateClassDialog({ subjects, teachers, grades }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const defaultGrade = grades[0]?.order ?? 8;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      grade: defaultGrade,
      year: new Date().getFullYear(),
      classType: getDefaultClassType(defaultGrade),
      subjectId: "",
      gradeLevelId: grades[0]?.id,
      primaryTeacherId: "",
    },
  });
  
  const classType = useWatch({ control: form.control, name: "classType" });
  const gradeValue = useWatch({ control: form.control, name: "grade" });
  const gradeLevelId = useWatch({ control: form.control, name: "gradeLevelId" }) ?? "";
  const primaryTeacherId = useWatch({ control: form.control, name: "primaryTeacherId" }) ?? "";
  const [selectedSubject, setSelectedSubject] = useState("");

  // Auto-update class type default when grade changes (suggestion only, not forced)
  useEffect(() => {
    const suggestedType = getDefaultClassType(gradeValue);
    // Only auto-update if the form hasn't been touched for classType
    // This provides a smart default without overriding the user's explicit choice
    if (!form.formState.dirtyFields.classType) {
      form.setValue("classType", suggestedType);
    }
  }, [gradeValue, form]);

  // Update name placeholder based on class type
  const namePlaceholder = classType === "Homeroom" 
    ? `Grade ${gradeValue}A` 
    : `Grade ${gradeValue}A Mathematics`;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        // Clear subjectId for Homeroom classes
        subjectId: values.classType === "Homeroom" ? undefined : values.subjectId,
      };
      
      await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOpen(false);
      form.reset();
      setSelectedSubject("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset();
        setSelectedSubject("");
      }
    }}>
      <DialogTrigger asChild>
        <Button>Create class</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create new class</DialogTitle>
          <DialogDescription>
            {classType === "Homeroom" 
              ? "Homeroom class with one teacher teaching all subjects (typical for Foundation/Intermediate phase)"
              : "Subject-specific class with dedicated subject teacher (typical for Senior/FET phase)"
            }
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Class Type Selection */}
          <div className="space-y-2">
            <Label>Class type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => form.setValue("classType", "Homeroom")}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  classType === "Homeroom"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Home className={`h-5 w-5 ${classType === "Homeroom" ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm">Homeroom</p>
                  <p className="text-xs text-muted-foreground">One teacher, all subjects</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => form.setValue("classType", "Subject")}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  classType === "Subject"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <BookOpen className={`h-5 w-5 ${classType === "Subject" ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm">Subject</p>
                  <p className="text-xs text-muted-foreground">Subject-specific class</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Class name</Label>
            <Input placeholder={namePlaceholder} {...form.register("name")} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Grade</Label>
              <Select
                value={String(gradeValue)}
                onValueChange={(v) => form.setValue("grade", parseInt(v), { shouldDirty: false })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>Grade {i === 0 ? "R" : i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" {...form.register("year", { valueAsNumber: true })} />
            </div>
          </div>
          
          {/* Subject - only shown for Subject-type classes */}
          {classType === "Subject" && (
            <div className="space-y-1">
              <Label>Subject <span className="text-destructive">*</span></Label>
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
              {form.formState.errors.subjectId && (
                <p className="text-xs text-destructive">{form.formState.errors.subjectId.message}</p>
              )}
            </div>
          )}
          
          <div className="space-y-1">
            <Label>Grade level</Label>
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
            {classType === "Homeroom" && (
              <p className="text-xs text-muted-foreground mt-1">
                This teacher will teach all subjects for this class
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
