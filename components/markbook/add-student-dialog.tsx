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

const schema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  classId: string;
}

export function AddStudentDialog({ classId }: Props) {
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
    },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, classGroupId: classId }),
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
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {isPending ? "Adding..." : success ? "Added!" : "Save learner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
