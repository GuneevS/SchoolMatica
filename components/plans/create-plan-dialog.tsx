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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleStore } from "@/lib/stores/role-store";

const schema = z.object({
  name: z.string().min(3),
  year: z.number().min(2000),
  termCount: z.number().min(1).max(4),
  classGroupId: z.string(),
  templateId: z.string().optional(),
});

const MANUAL_TEMPLATE_VALUE = "__MANUAL__";

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
  const [selectedTemplate, setSelectedTemplate] = useState(
    form.getValues("templateId") ?? MANUAL_TEMPLATE_VALUE,
  );
  const [termWeights, setTermWeights] = useState<Record<string, number>>({});
  const [configureWeights, setConfigureWeights] = useState(false);
  const canCreate = role !== "Teacher";

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload: any = {
        ...values,
        templateId: selectedTemplate || undefined,
        useTemplateAssessments: Boolean(selectedTemplate),
      };
      
      if (configureWeights && Object.keys(termWeights).length > 0) {
        payload.termWeights = termWeights;
      }
      
      await fetch("/api/assessment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOpen(false);
      setTermWeights({});
      setConfigureWeights(false);
      router.refresh();
    });
  }
  
  const handleTermWeightChange = (term: string, value: number) => {
    setTermWeights((prev) => ({ ...prev, [term]: value }));
  };
  
  const termCount = form.watch("termCount") || 4;
  const terms = Array.from({ length: termCount }, (_, i) => `T${i + 1}`);
  const totalWeight = Object.values(termWeights).reduce((sum, w) => sum + w, 0);
  const isWeightValid = !configureWeights || Math.abs(totalWeight - 100) < 0.01;

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
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="weights">Term Weights</TabsTrigger>
          </TabsList>
          
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("name")} />
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
                    form.setValue("templateId", value === MANUAL_TEMPLATE_VALUE ? undefined : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Manual configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MANUAL_TEMPLATE_VALUE}>Manual configuration</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} · Grade {template.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="weights" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Configure Term Weights</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfigureWeights(!configureWeights)}
                  >
                    {configureWeights ? "Disable" : "Enable"}
                  </Button>
                </div>
                
                {configureWeights && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Set how each term contributes to the final year mark. Total must equal 100%.
                    </p>
                    {terms.map((term) => (
                      <div key={term} className="flex items-center gap-3">
                        <Label className="w-16">{term}</Label>
                        <Input
                          type="number"
                          value={termWeights[term] || ""}
                          onChange={(e) => handleTermWeightChange(term, Number(e.target.value))}
                          placeholder="%"
                          step="0.5"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className={`text-sm font-bold ${isWeightValid ? "text-green-600" : "text-destructive"}`}>
                        {totalWeight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isPending || !isWeightValid}>Create</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
