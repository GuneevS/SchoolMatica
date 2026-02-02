import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BrandingForm } from "@/components/settings/branding-form";
import { Palette } from "lucide-react";
import { getAuthorizedActiveSchool } from "@/lib/auth-server";
import { type SchoolBranding } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage() {
  const school = await getAuthorizedActiveSchool();

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No accessible school found. Select a school to configure branding.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Identity"
        title={
          <>
            <span className="gradient-text">Branding</span> &amp; tone
          </>
        }
        description="Create a bespoke experience for your school by aligning the platform with your logo, colors, and visual rhythm."
        badges={[
          { label: "Whitelabel ready", color: "hsl(var(--accent-iris))" },
          { label: "Instant preview", color: "hsl(var(--accent-gold))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Brand pulse"
            icon={<Palette className="h-4 w-4" />}
            metrics={[
              { label: "Current school", value: school.name, accent: "highlight" },
              { label: "Theme mode", value: "Light" },
              { label: "Logo support", value: "PNG, JPG, SVG" },
            ]}
          />
        }
      />

      <SettingsNav />

      <BrandingForm
        schoolId={school.id}
        schoolName={school.name}
        initialBranding={school.branding as SchoolBranding | null}
      />
    </div>
  );
}
