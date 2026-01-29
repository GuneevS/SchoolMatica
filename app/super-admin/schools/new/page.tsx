"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ArrowLeft, Loader2, UserPlus, Copy, Check } from "lucide-react";
import Link from "next/link";

interface CreatedSchool {
  id: string;
  name: string;
  shortCode?: string;
}

interface AdminCredentials {
  email: string;
  temporaryPassword: string;
}

export default function NewSchoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAdmin, setCreateAdmin] = useState(true);
  const [createdSchool, setCreatedSchool] = useState<CreatedSchool | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // School data
    const schoolData = {
      name: formData.get("name") as string,
      shortCode: (formData.get("shortCode") as string) || undefined,
    };

    try {
      // Step 1: Create the school
      const schoolResponse = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });

      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json();
        throw new Error(
          Array.isArray(errorData.error)
            ? errorData.error[0].message
            : errorData.error || "Failed to create school"
        );
      }

      const school = await schoolResponse.json();
      setCreatedSchool(school);

      // Step 2: Provision admin if requested
      if (createAdmin) {
        const adminData = {
          email: formData.get("adminEmail") as string,
          displayName: formData.get("adminName") as string,
          roleKey: formData.get("adminRole") as string,
        };

        const adminResponse = await fetch(`/api/super-admin/schools/${school.id}/provision-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminData),
        });

        if (!adminResponse.ok) {
          const errorData = await adminResponse.json();
          // School was created but admin failed - show partial success
          setError(
            `School created successfully, but admin provisioning failed: ${
              Array.isArray(errorData.error)
                ? errorData.error[0].message
                : errorData.error
            }`
          );
          return;
        }

        const adminResult = await adminResponse.json();
        if (adminResult.credentials) {
          setAdminCredentials(adminResult.credentials);
        }
      } else {
        // No admin requested, redirect to school detail
        router.push(`/super-admin/schools/${school.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCredentials() {
    if (!adminCredentials) return;

    const text = `Email: ${adminCredentials.email}\nTemporary Password: ${adminCredentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDone() {
    if (createdSchool) {
      router.push(`/super-admin/schools/${createdSchool.id}`);
    }
  }

  // Show success screen with credentials
  if (createdSchool && adminCredentials) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link
            href="/super-admin/schools"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schools
          </Link>
          <h1 className="text-3xl font-bold text-foreground">School Created Successfully!</h1>
          <p className="mt-1 text-muted-foreground">
            {createdSchool.name} has been created with an administrator account
          </p>
        </div>

        <Card className="rounded-[24px] border border-[hsl(var(--success))/0.5] bg-[hsl(var(--success))/0.05]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--success))]">
              <Check className="h-5 w-5" />
              School & Admin Created
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">School Details</h4>
              <p className="mt-1 text-muted-foreground">{createdSchool.name}</p>
              {createdSchool.shortCode && (
                <p className="text-sm text-muted-foreground">Code: {createdSchool.shortCode}</p>
              )}
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Administrator Credentials</h4>
              <p className="mt-1 text-xs text-muted-foreground mb-3">
                Share these credentials securely with the administrator. The password will not be shown again.
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono text-sm">{adminCredentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                  <p className="font-mono text-sm">{adminCredentials.temporaryPassword}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyCredentials}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Credentials
                  </>
                )}
              </Button>
              <Button type="button" className="flex-1" onClick={handleDone}>
                View School
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))]">
          <CardContent className="pt-6">
            <h3 className="font-medium text-foreground">Next Steps</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                  1
                </span>
                <span>Send the login credentials to the school administrator</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                  2
                </span>
                <span>The administrator should change their password on first login</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                  3
                </span>
                <span>They can then set up grade levels, subjects, and teachers</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
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
          Add a new school to the platform with optional administrator setup
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Details Card */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
              School Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
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
          </CardContent>
        </Card>

        {/* Admin Setup Card */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
                Administrator Setup
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createAdmin"
                  checked={createAdmin}
                  onCheckedChange={(checked) => setCreateAdmin(checked as boolean)}
                />
                <Label
                  htmlFor="createAdmin"
                  className="text-sm font-normal cursor-pointer"
                >
                  Create administrator account
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`pt-6 space-y-4 ${!createAdmin ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@school.edu"
                required={createAdmin}
                disabled={!createAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Full Name *</Label>
              <Input
                id="adminName"
                name="adminName"
                placeholder="John Smith"
                required={createAdmin}
                disabled={!createAdmin}
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminRole">Admin Role *</Label>
              <Select name="adminRole" defaultValue="admin" disabled={!createAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">School Administrator</SelectItem>
                  <SelectItem value="smt">SMT (Senior Management)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A temporary password will be generated automatically
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createAdmin ? "Create School & Admin" : "Create School"}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="rounded-[24px] border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))]">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground">What happens when you create a school?</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                1
              </span>
              <span>School record is created with default FET grading configuration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                2
              </span>
              <span>If enabled, an administrator account is created with a secure temporary password</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                3
              </span>
              <span>The admin role is scoped to this school only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--accent-violet))/0.15] text-xs text-[hsl(var(--accent-violet))]">
                4
              </span>
              <span>The administrator can then configure grade levels, subjects, and teachers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
