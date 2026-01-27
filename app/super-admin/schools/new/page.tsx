"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewSchoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      shortCode: formData.get("shortCode") as string || undefined,
    };

    try {
      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create school");
      }

      const school = await response.json();
      router.push(`/super-admin/schools/${school.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/super-admin/schools"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schools
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Create New School</h1>
        <p className="mt-1 text-muted-foreground">
          Add a new school to the platform
        </p>
      </div>

      {/* Form */}
      <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
        <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
            School Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Westville Secondary School"
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                The full name of the school
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortCode">Short Code</Label>
              <Input
                id="shortCode"
                name="shortCode"
                placeholder="e.g., WSS"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                A unique short identifier (2-10 characters). Optional.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create School
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="rounded-[24px] border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))]">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground">What happens next?</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                1
              </span>
              <span>School will be created with default grading configuration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                2
              </span>
              <span>You can then provision an administrator account for the school</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                3
              </span>
              <span>The administrator can start setting up classes, teachers, and students</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
