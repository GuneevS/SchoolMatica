"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Assessment } from "@prisma/client";
import { WeightAdjuster } from "@/components/plans/weight-adjuster";

interface Props {
  planId: string;
  assessments: Assessment[];
}

export function WeightAdjusterPanel({ planId, assessments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSave(updates: { id: string; rawWeight: number }[]) {
    startTransition(async () => {
      await fetch(`/api/assessment-plans/${planId}/weights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      // Revalidate dashboard to update stats
      await fetch("/api/revalidate?path=/dashboard", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {isPending && <p className="text-xs text-muted-foreground">Saving weight adjustments…</p>}
      <WeightAdjuster assessments={assessments} onSave={handleSave} readOnly={false} />
    </div>
  );
}
