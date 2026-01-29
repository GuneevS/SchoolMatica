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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";

interface Role {
  id: string;
  key: string;
  name: string;
  priority: number;
}

interface School {
  id: string;
  name: string;
  shortCode: string | null;
}

interface CurrentRole {
  id: string;
  roleKey: string;
  roleName: string;
  scopeSchoolId: string | null;
  scopeSchoolName: string | undefined;
}

interface Props {
  userId: string;
  currentRoles: CurrentRole[];
  allRoles: Role[];
  allSchools: School[];
}

export function UserRoleManager({ userId, currentRoles, allRoles, allSchools }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("none");

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/users/${userId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKey: selectedRole,
          scopeSchoolId: selectedSchool === "none" ? null : selectedSchool,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add role");
      }

      setSelectedRole("");
      setSelectedSchool("none");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveRole(assignmentId: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/users/${userId}/roles/${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove role");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Manage Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Add or remove roles for this user. Roles can be scoped to specific schools.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles */}
          <div className="space-y-3">
            <Label>Current Roles</Label>
            {currentRoles.length > 0 ? (
              <div className="space-y-2">
                {currentRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-3 py-2"
                  >
                    <div>
                      <span className="font-medium text-foreground">{role.roleName}</span>
                      {role.scopeSchoolName && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          @ {role.scopeSchoolName}
                        </span>
                      )}
                      {!role.scopeSchoolId && (
                        <span className="ml-2 text-sm text-muted-foreground">(Platform-wide)</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={isSubmitting || role.roleKey === "super_admin"}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No roles assigned</p>
            )}
          </div>

          {/* Add New Role */}
          <form onSubmit={handleAddRole} className="space-y-4 border-t border-[hsl(var(--border))] pt-4">
            <Label>Add New Role</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs text-muted-foreground">
                  Role
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoles
                      .filter((r) => r.key !== "super_admin") // Don't allow adding super_admin through UI
                      .map((role) => (
                        <SelectItem key={role.key} value={role.key}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school" className="text-xs text-muted-foreground">
                  School Scope
                </Label>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Platform-wide</SelectItem>
                    {allSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedRole}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Role
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
