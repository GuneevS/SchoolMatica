"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";

interface Props {
  schoolId: string;
  schoolName: string;
  variant?: "default" | "outline";
}

interface CredentialsResponse {
  success: boolean;
  user: {
    id: string;
    email: string | null;
    displayName: string;
    schoolId: string;
    role: string;
  };
  credentials?: {
    email: string | null;
    temporaryPassword: string;
  };
}

export function ProvisionAdminDialog({ schoolId, schoolName, variant = "default" }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsResponse["credentials"] | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCredentials(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      displayName: formData.get("displayName") as string,
      roleKey: formData.get("roleKey") as string,
      // Don't send password to generate a random one
    };

    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/provision-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          Array.isArray(errorData.error)
            ? errorData.error[0].message
            : errorData.error || "Failed to provision admin"
        );
      }

      const result: CredentialsResponse = await response.json();

      if (result.credentials) {
        setCredentials(result.credentials);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCredentials() {
    if (!credentials) return;

    const text = `Email: ${credentials.email}\nTemporary Password: ${credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setIsOpen(false);
    setCredentials(null);
    setError(null);
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Provision Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provision Administrator</DialogTitle>
          <DialogDescription>
            Create an administrator account for {schoolName}
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[hsl(var(--success))/0.5] bg-[hsl(var(--success))/0.1] p-4">
              <p className="font-medium text-[hsl(var(--success))]">
                Administrator created successfully!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share these credentials securely with the new administrator.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-sm">{credentials.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                <p className="font-mono text-sm">{credentials.temporaryPassword}</p>
              </div>
            </div>

            <div className="flex gap-3">
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
              <Button type="button" className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This password will not be shown again. Make sure to copy it now.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@school.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name *</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="John Smith"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleKey">Role *</Label>
              <Select name="roleKey" defaultValue="admin">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">School Administrator</SelectItem>
                  <SelectItem value="smt">SMT (Senior Management)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The role determines the administrator&apos;s permissions
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Administrator
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
