import Link from "next/link";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brush, Ruler } from "lucide-react";
import { getAuthorizedActiveSchool } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const school = await getAuthorizedActiveSchool();

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Control"
        title={
          <>
            <span className="gradient-text">Settings</span> studio
          </>
        }
        description="Shape the identity and academic standards for your school. Each module is designed to be quick, clear, and fully auditable."
        badges={[
          { label: "School-wide impact", color: "hsl(var(--accent-iris))" },
          { label: "Role protected", color: "hsl(var(--accent-gold))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Active context"
            icon={<Brush className="h-4 w-4" />}
            metrics={[
              { label: "School", value: school?.name ?? "Select a school", accent: "highlight" },
              { label: "Last update", value: "Live", helper: "Changes apply immediately" },
              { label: "Mode", value: "Light" },
            ]}
          />
        }
      />

      <SettingsNav />

      <div className="grid gap-4 md:grid-cols-2 stagger-grid">
        <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brush className="h-5 w-5 text-[hsl(var(--accent-iris))]" />
              Branding &amp; identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your logo, customize colors, and deliver a white-labeled experience for staff.
            </p>
            <Link href="/settings/branding" className="text-sm font-semibold text-[hsl(var(--accent-iris))] hover:underline">
              Open branding settings
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-[hsl(var(--accent-gold))]" />
              Grading standards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Keep performance bands consistent across subjects with phase-level grading configuration.
            </p>
            <Link href="/settings/grading" className="text-sm font-semibold text-[hsl(var(--accent-iris))] hover:underline">
              Open grading settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
