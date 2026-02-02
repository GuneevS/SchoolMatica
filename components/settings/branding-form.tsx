"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchoolMark } from "@/components/brand/school-mark";
import { useBranding } from "@/components/brand/branding-provider";
import { DEFAULT_BRANDING, type SchoolBranding } from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandingFormProps = {
  schoolId: string;
  schoolName: string;
  initialBranding?: SchoolBranding | null;
};

const colorFields: Array<{
  key: keyof Pick<SchoolBranding, "primary" | "secondary" | "accent">;
  label: string;
  hint: string;
}> = [
  { key: "primary", label: "Primary", hint: "Buttons, highlights, key accents" },
  { key: "secondary", label: "Secondary", hint: "Secondary gradients and UI accents" },
  { key: "accent", label: "Accent", hint: "Notifications, highlights, chart focus" },
];

export function BrandingForm({ schoolId, schoolName, initialBranding }: BrandingFormProps) {
  const { setBranding } = useBranding();
  const [formState, setFormState] = useState<SchoolBranding>({
    ...DEFAULT_BRANDING,
    ...(initialBranding ?? {}),
  });
  const [isSaving, setIsSaving] = useState(false);

  const previewPalette = useMemo(
    () => ({
      primary: formState.primary ?? DEFAULT_BRANDING.primary,
      secondary: formState.secondary ?? DEFAULT_BRANDING.secondary,
      accent: formState.accent ?? DEFAULT_BRANDING.accent,
    }),
    [formState],
  );

  function updateState(next: Partial<SchoolBranding>) {
    const updated = { ...formState, ...next };
    setFormState(updated);
    setBranding(updated);
  }

  function handleLogoUpload(file: File | null) {
    if (!file) return;
    if (file.size > 700_000) {
      toast.error("Please use a logo under 700 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        updateState({ logoUrl: result });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: formState.logoUrl ?? null,
          primary: formState.primary ?? null,
          secondary: formState.secondary ?? null,
          accent: formState.accent ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save branding");
      }

      toast.success("Branding updated");
    } catch (error) {
      toast.error("Unable to save branding changes.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    updateState({
      logoUrl: null,
      primary: DEFAULT_BRANDING.primary,
      secondary: DEFAULT_BRANDING.secondary,
      accent: DEFAULT_BRANDING.accent,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
        <CardHeader>
          <CardTitle>School identity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set your logo and palette to reflect your school brand. Changes apply immediately across the platform.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[auto,1fr]">
            <div className="flex flex-col items-center gap-3">
              <SchoolMark name={schoolName} logoUrl={formState.logoUrl} size="lg" />
              <Badge variant="outline" className="text-xs">
                Preview
              </Badge>
            </div>
            <div className="space-y-3">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                placeholder="https://..."
                value={formState.logoUrl ?? ""}
                onChange={(event) => updateState({ logoUrl: event.target.value })}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)}
                  className="h-9 w-[220px]"
                />
                <span>PNG, JPG, or SVG (max 700 KB)</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {colorFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    id={field.key}
                    type="color"
                    value={(formState[field.key] as string) ?? DEFAULT_BRANDING[field.key]}
                    onChange={(event) => updateState({ [field.key]: event.target.value })}
                    className="h-10 w-12 rounded-lg border border-[hsl(var(--border))/0.6] bg-transparent"
                  />
                  <Input
                    value={(formState[field.key] as string) ?? ""}
                    onChange={(event) => updateState({ [field.key]: event.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save branding"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset to default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            This is how your palette feels in context for educators.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            className="rounded-3xl border border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-soft))] p-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.7), transparent 55%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Weekly pulse</p>
                <p className="text-2xl font-semibold text-foreground">Moderation readiness</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: previewPalette.primary }}
              >
                On track
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { label: "Average SBA", value: "64.3%" },
                { label: "At-risk learners", value: "14" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/80 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-semibold text-foreground">{item.value}</p>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: "68%", backgroundColor: previewPalette.secondary }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))/0.4] p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Learners ready for capture</p>
                <p className="text-xs text-muted-foreground">2 classes need final marks</p>
              </div>
              <div
                className={cn("h-10 w-10 rounded-2xl text-white flex items-center justify-center")}
                style={{ backgroundColor: previewPalette.accent }}
              >
                2
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))/0.4] p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Upcoming moderation</p>
                <p className="text-xs text-muted-foreground">English HL · Term 3</p>
              </div>
              <Button size="sm" style={{ background: previewPalette.primary, color: "#fff" }}>
                Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
