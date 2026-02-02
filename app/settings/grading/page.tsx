import { prisma } from "@/lib/prisma";
import { GradingForm } from "@/components/settings/grading-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Ruler } from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

// Force dynamic rendering - requires database
export const dynamic = "force-dynamic";

export default async function GradingSettingsPage() {
  const config = await prisma.gradingConfig.findFirst();
  const phases = (config?.phasesJson as Record<string, { minPercent: number; level: number; descriptor: string }[]>) ?? {};
  const phaseNames = Object.keys(phases);
  const bandCount = phaseNames.reduce((sum, phase) => sum + (phases[phase]?.length ?? 0), 0);
  const averageBands = phaseNames.length === 0 ? 0 : +(bandCount / phaseNames.length).toFixed(1);

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Standards"
        title={
          <>
            <span className="gradient-text">Grading bands</span> config
          </>
        }
        description="Define consistent performance descriptors per phase so every class speaks the same assessment language."
        badges={config ? [{ label: config.name, color: "hsl(var(--accent-iris))" }] : undefined}
        aside={
          <HeroMetricPanel
            title="Band coverage"
            icon={<Ruler className="h-4 w-4" />}
            metrics={[
              { label: "Bands configured", value: bandCount.toString(), helper: `${phaseNames.length} phases`, accent: "highlight" },
              { label: "Phases", value: phaseNames.length.toString(), helper: phaseNames.join(", ") || "No phases" },
              { label: "Avg bands / phase", value: averageBands.toString() },
            ]}
          />
        }
      />
      <SettingsNav />
      <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
        <CardHeader>
          <CardTitle>Grading bands</CardTitle>
        </CardHeader>
        <CardContent>
          <GradingForm config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
