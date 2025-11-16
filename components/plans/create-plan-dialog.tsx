"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoleStore } from "@/lib/stores/role-store";

const schema = z.object({
  name: z.string().min(3),
  year: z.number().min(2000),
  termCount: z.number().min(1).max(4),
  classGroupId: z.string(),
  templateId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClassOption {
  id: string;
  name: string;
}

interface TemplateOption {
  id: string;
  name: string;
  grade: number;
  subjectName: string;
}

interface Props {
  classes: ClassOption[];
  templates: TemplateOption[];
}

export function CreatePlanDialog({ classes, templates }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "New plan",
      year: new Date().getFullYear(),
      termCount: 4,
      classGroupId: classes[0]?.id,
      templateId: undefined,
    },
  });
  const [selectedClass, setSelectedClass] = useState(form.getValues("classGroupId") ?? classes[0]?.id ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState(form.getValues("templateId") ?? "");
  const canCreate = role !== "Teacher";

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      await fetch("/api/assessment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          templateId: selectedTemplate || undefined,
          useTemplateAssessments: Boolean(selectedTemplate),
        }),
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate} variant={canCreate ? "default" : "outline"}>
          {canCreate ? "Create plan" : "HOD/SMT only"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New assessment plan</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name") } />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" {...form.register("year", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label>Term count</Label>
            <Input type="number" {...form.register("termCount", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                form.setValue("classGroupId", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => {
                setSelectedTemplate(value);
                form.setValue("templateId", value || undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Manual configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Manual configuration</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} · Grade {template.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
