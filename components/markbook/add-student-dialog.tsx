"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { useHasPermission } from "@/lib/hooks/use-auth";

const schema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().optional(),
  advisorTeacherId: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TeacherOption {
  id: string;
  name: string;
}

interface Props {
  classId: string;
  teachers: TeacherOption[];
}

export function AddStudentDialog({ classId, teachers }: Props) {
  const canCreateStudent = useHasPermission("student:create");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      admissionNumber: "",
      firstName: "",
      lastName: "",
      gender: "",
      advisorTeacherId: teachers[0]?.id ?? "",
      guardianName: "",
      guardianRelationship: "Guardian",
      guardianEmail: "",
      guardianPhone: "",
    },
  });

  // Check permission before returning dialog
  if (!canCreateStudent) {
    return null;
  }

  function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            classGroupId: classId,
            advisorTeacherId: values.advisorTeacherId || undefined,
            parents: values.guardianName
              ? [
                {
                  fullName: values.guardianName,
                  relationship: values.guardianRelationship || "Guardian",
                  email: values.guardianEmail || undefined,
                  phone: values.guardianPhone || undefined,
                  primary: true,
                },
              ]
              : undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add student");
        }

        setSuccess(true);
        form.reset();
        router.refresh();

        // Close dialog after showing success message
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add student");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5">
          <UserPlus className="h-4 w-4 mr-2" />
          Add learner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add learner to class
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>Student added successfully!</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="admissionNumber" className="text-sm font-semibold">
              Admission number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="admissionNumber"
              {...form.register("admissionNumber")}
              className={form.formState.errors.admissionNumber ? "border-destructive" : ""}
              disabled={isPending || success}
            />
            {form.formState.errors.admissionNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.admissionNumber.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                className={form.formState.errors.firstName ? "border-destructive" : ""}
                disabled={isPending || success}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                className={form.formState.errors.lastName ? "border-destructive" : ""}
                disabled={isPending || success}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-semibold">
              Gender <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="gender"
              {...form.register("gender")}
              placeholder="e.g., Male, Female, Other"
              disabled={isPending || success}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Advisor teacher</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register("advisorTeacherId")}
                disabled={isPending || success}
              >
                <option value="">Unassigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Guardian relationship</Label>
              <Input
                {...form.register("guardianRelationship")}
                placeholder="e.g. Parent, Guardian"
                disabled={isPending || success}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Guardian name</Label>
            <Input
              {...form.register("guardianName")}
              placeholder="Full name"
              disabled={isPending || success}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Guardian email</Label>
              <Input
                type="email"
                {...form.register("guardianEmail")}
                placeholder="guardian@example.com"
                disabled={isPending || success}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Guardian phone</Label>
              <Input
                {...form.register("guardianPhone")}
                placeholder="+27 82 000 0000"
                disabled={isPending || success}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending || success}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || success}
              className="bg-gradient-to-r from-primary to-[hsl(var(--accent-violet))] hover:from-primary/90 hover:to-[hsl(var(--accent-violet))]/90"
            >
              {isPending ? "Adding..." : success ? "Added!" : "Save learner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
