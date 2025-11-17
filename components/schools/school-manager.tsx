"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type GradeLevel = {
  id: string;
  name: string;
  order: number;
};

type SchoolCard = {
  id: string;
  name: string;
  shortCode?: string | null;
  createdAt: string;
  gradeLevels: GradeLevel[];
  _count: {
    classes: number;
    subjects: number;
  };
};

interface SchoolManagerProps {
  schools: SchoolCard[];
}

export function SchoolManager({ schools }: SchoolManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", shortCode: "" });
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((state) => ({ ...state, [name]: value }));
  }

  function createSchool() {
    startTransition(async () => {
      await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, shortCode: form.shortCode || undefined }),
      });
      setOpen(false);
      setForm({ name: "", shortCode: "" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create school</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New school</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Northview College" />
              </div>
              <div className="space-y-1">
                <Label>Short code</Label>
                <Input name="shortCode" value={form.shortCode} onChange={handleChange} placeholder="NVC" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createSchool} disabled={isPending || !form.name}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {schools.map((school) => (
          <Card key={school.id} className="surface-panel border border-[hsl(var(--border-strong))/0.5]">
            <CardHeader>
              <CardTitle>{school.name}</CardTitle>
              {school.shortCode && <p className="text-sm text-muted-foreground">{school.shortCode}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Classes</p>
                  <p className="text-xl font-semibold">{school._count.classes}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Subjects</p>
                  <p className="text-xl font-semibold">{school._count.subjects}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70 mb-2">Grade levels</p>
                <div className="flex flex-wrap gap-2">
                  {school.gradeLevels.map((grade) => (
                    <span key={grade.id} className="rounded-full border border-[hsl(var(--border))/0.4] px-3 py-1 text-xs text-muted-foreground bg-white/10">
                      {grade.name}
                    </span>
                  ))}
                  {school.gradeLevels.length === 0 && <span className="text-xs text-muted-foreground">No grade levels yet.</span>}
                </div>
                <GradeInlineForm schoolId={school.id} onSuccess={() => router.refresh()} nextOrder={school.gradeLevels.length + 1} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GradeInlineForm({ schoolId, nextOrder, onSuccess }: { schoolId: string; nextOrder: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState(nextOrder);
  const [isPending, startTransition] = useTransition();

  function addGrade() {
    if (!name) return;
    startTransition(async () => {
      await fetch("/api/grade-levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, name, order }),
      });
      setName("");
      setOrder(nextOrder + 1);
      onSuccess();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Grade 10" className="max-w-[200px]" />
      <Input type="number" value={order} onChange={(event) => setOrder(Number(event.target.value))} className="w-20" />
      <Button variant="outline" size="sm" onClick={addGrade} disabled={isPending || !name}>
        Add grade
      </Button>
    </div>
  );
}

