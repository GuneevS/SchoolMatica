"use client";

import { useMemo, useState, useTransition } from "react";
import type { GradingConfig } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { DEFAULT_GRADING_BANDS } from "@/lib/constants/grading";

interface Props {
  config: GradingConfig | null;
}

export function GradingForm({ config }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultPhases = useMemo(() => {
    if (!config) return DEFAULT_GRADING_BANDS as Record<string, { minPercent: number; level: number; descriptor: string }[]>;
    return (config.phasesJson as Record<string, { minPercent: number; level: number; descriptor: string }[]>);
  }, [config]);
  const [draft, setDraft] = useState(defaultPhases);
  const phases = Object.keys(draft);
  if (phases.length === 0) {
    return <p className="text-sm text-muted-foreground">No grading configuration found.</p>;
  }

  function addBand(phase: string) {
    setDraft((state) => ({
      ...state,
      [phase]: [...(state[phase] ?? []), { minPercent: 0, level: 1, descriptor: "" }],
    }));
  }

  function updateBand(phase: string, index: number, key: "minPercent" | "level" | "descriptor", value: string) {
    setDraft((state) => {
      const phaseBands = state[phase] ?? [];
      const updated = phaseBands.map((band, idx) =>
        idx === index
          ? {
              ...band,
              [key]: key === "descriptor" ? value : Number(value),
            }
          : band,
      );
      return { ...state, [phase]: updated };
    });
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/grading-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: draft }),
      });
      router.refresh();
    });
  }

  return (
    <div>
      <Tabs defaultValue={phases[0]}>
        <TabsList className="mb-4">
          {phases.map((phase) => (
            <TabsTrigger key={phase} value={phase}>
              {phase}
            </TabsTrigger>
          ))}
        </TabsList>
        {phases.map((phase) => (
          <TabsContent key={phase} value={phase} className="space-y-3">
            {(draft[phase] ?? []).map((band, index) => (
              <div key={`${phase}-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                <Input
                  type="number"
                  value={band.minPercent}
                  onChange={(event) => updateBand(phase, index, "minPercent", event.target.value)}
                  placeholder="Min %"
                />
                <Input
                  type="number"
                  value={band.level}
                  onChange={(event) => updateBand(phase, index, "level", event.target.value)}
                  placeholder="Level"
                />
                <Input
                  value={band.descriptor}
                  onChange={(event) => updateBand(phase, index, "descriptor", event.target.value)}
                  placeholder="Descriptor"
                />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => addBand(phase)}>
              Add band
            </Button>
          </TabsContent>
        ))}
      </Tabs>
      <Button className="mt-4" onClick={save} disabled={isPending}>
        Save config
      </Button>
    </div>
  );
}
