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

const schema = z.object({
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  classId: string;
}

export function AddStudentDialog({ classId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
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
    startTransition(async () => {
      await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, classGroupId: classId }),
      });
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add learner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add learner to class</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label>Admission number</Label>
            <Input {...form.register("admissionNumber")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>First name</Label>
              <Input {...form.register("firstName")} />
            </div>
            <div className="space-y-1">
              <Label>Last name</Label>
              <Input {...form.register("lastName")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Input {...form.register("gender")} placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save learner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
