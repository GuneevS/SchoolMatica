import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";
import {
  User,
  Mail,
  Building2,
  Shield,
  ArrowLeft,
  Calendar,
  Key,
  AlertTriangle,
  CheckCircle,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { UserEditDialog } from "@/components/super-admin/user-edit-dialog";
import { UserRoleManager } from "@/components/super-admin/user-role-manager";

interface PageProps {
  params: Promise<{ userId: string }>;
}

async function getUser(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: {
      school: { select: { id: true, name: true, shortCode: true } },
      roleAssignments: {
        include: {
          role: { select: { key: true, name: true, priority: true } },
        },
        orderBy: { role: { priority: "desc" } },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          bio: true,
        },
      },
      accounts: {
        select: { provider: true },
      },
      sessions: {
        select: { id: true, expires: true },
        orderBy: { expires: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  // Get recent audit logs for this user
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: userId, entityType: "AppUser" },
        { metadata: { path: ["userId"], equals: userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get all roles for the role manager
  const allRoles = await prisma.roleDefinition.findMany({
    orderBy: { priority: "desc" },
    select: { id: true, key: true, name: true, priority: true },
  });

  // Get all schools for assignment
  const allSchools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortCode: true },
  });

  // Fetch scope school names for role assignments that have scopeSchoolId
  const scopeSchoolIds = user.roleAssignments
    .map(ra => ra.scopeSchoolId)
    .filter((id): id is string => id !== null);
  
  const scopeSchools = scopeSchoolIds.length > 0
    ? await prisma.school.findMany({
        where: { id: { in: scopeSchoolIds } },
        select: { id: true, name: true, shortCode: true },
      })
    : [];
  
  const scopeSchoolMap = new Map(scopeSchools.map(s => [s.id, s]));

  // Enhance role assignments with scope school data
  const roleAssignmentsWithSchool = user.roleAssignments.map(ra => ({
    ...ra,
    scopeSchool: ra.scopeSchoolId ? scopeSchoolMap.get(ra.scopeSchoolId) || null : null,
  }));

  return {
    ...user,
    roleAssignments: roleAssignmentsWithSchool,
    recentLogs,
    allRoles,
    allSchools,
  };
}

export default async function UserDetailPage({ params }: PageProps) {
  await requireSuperAdmin();
  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    notFound();
  }

  const isSuperAdmin = user.roleAssignments.some((ra) => ra.role.key === "super_admin");
  const isLocked = user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();
  const isVerified = !!user.emailVerified;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/super-admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--accent-cobalt))/0.12] text-2xl font-semibold text-[hsl(var(--accent-cobalt))]">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{user.displayName || "Unnamed User"}</h1>
              <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              {user.school && (
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {user.school.name} {user.school.shortCode && `(${user.school.shortCode})`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {!isSuperAdmin && (
              <UserEditDialog
                user={{
                  id: user.id,
                  email: user.email,
                  displayName: user.displayName,
                  schoolId: user.schoolId,
                }}
                schools={user.allSchools}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        {isSuperAdmin && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--accent-violet))/0.15] px-3 py-1 text-sm font-medium text-[hsl(var(--accent-violet))]">
            <Shield className="h-4 w-4" />
            Super Admin
          </span>
        )}
        {isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success))/0.15] px-3 py-1 text-sm font-medium text-[hsl(var(--success))]">
            <CheckCircle className="h-4 w-4" />
            Email Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning))/0.15] px-3 py-1 text-sm font-medium text-[hsl(var(--warning))]">
            <AlertTriangle className="h-4 w-4" />
            Email Not Verified
          </span>
        )}
        {isLocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--destructive))/0.15] px-3 py-1 text-sm font-medium text-[hsl(var(--destructive))]">
            <AlertTriangle className="h-4 w-4" />
            Account Locked
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Details */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
              User Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <DetailRow label="User ID" value={user.id} mono />
            <DetailRow label="Email" value={user.email || "-"} />
            <DetailRow label="Display Name" value={user.displayName || "-"} />
            <DetailRow
              label="Primary School"
              value={user.school ? `${user.school.name}${user.school.shortCode ? ` (${user.school.shortCode})` : ""}` : "None"}
            />
            <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(user.updatedAt)} />
            {user.emailVerified && (
              <DetailRow label="Email Verified" value={formatDateTime(user.emailVerified)} />
            )}
            {user.failedLoginAttempts > 0 && (
              <DetailRow
                label="Failed Login Attempts"
                value={user.failedLoginAttempts.toString()}
                warning={user.failedLoginAttempts >= 3}
              />
            )}
            {user.accountLockedUntil && (
              <DetailRow
                label="Account Locked Until"
                value={formatDateTime(user.accountLockedUntil)}
                warning
              />
            )}
          </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
              Roles & Permissions
            </CardTitle>
            {!isSuperAdmin && (
              <UserRoleManager
                userId={user.id}
                currentRoles={user.roleAssignments.map((ra) => ({
                  id: ra.id,
                  roleKey: ra.role.key,
                  roleName: ra.role.name,
                  scopeSchoolId: ra.scopeSchoolId,
                  scopeSchoolName: ra.scopeSchool?.name,
                }))}
                allRoles={user.allRoles}
                allSchools={user.allSchools}
              />
            )}
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {user.roleAssignments.length > 0 ? (
              user.roleAssignments.map((ra) => (
                <div key={ra.id} className="py-4 first:pt-6 last:pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{ra.role.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ra.scopeSchool
                          ? `Scoped to: ${ra.scopeSchool.name}`
                          : "Platform-wide"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Priority: {ra.role.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Shield className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No roles assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher Profile (if exists) */}
        {user.teacher && (
          <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
            <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
              <CardTitle className="text-lg font-semibold">Teacher Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <DetailRow label="First Name" value={user.teacher.firstName || "-"} />
              <DetailRow label="Last Name" value={user.teacher.lastName || "-"} />
              <DetailRow label="Teacher Email" value={user.teacher.email || "-"} />
              <DetailRow label="Phone" value={user.teacher.phone || "-"} />
              <DetailRow label="Role" value={user.teacher.role || "-"} />
              {user.teacher.bio && <DetailRow label="Bio" value={user.teacher.bio} />}
            </CardContent>
          </Card>
        )}

        {/* Authentication Methods */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Key className="h-5 w-5 text-[hsl(var(--accent-mint))]" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">OAuth Providers</h4>
              {user.accounts.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {user.accounts.map((acc, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium capitalize">{acc.provider}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No OAuth accounts linked</p>
              )}
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Password Authentication</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.passwordHash ? "Password is set" : "No password configured"}
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Active Sessions</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.sessions.length} session{user.sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] lg:col-span-2">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-[hsl(var(--accent-gold))]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {user.recentLogs.length > 0 ? (
              user.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 first:pt-6 last:pb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.entityType}
                      {log.actorRole && ` · ${log.actorRole}`}
                      {log.actorName && ` (${log.actorName})`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No activity recorded for this user
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  warning = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-right text-sm font-medium ${mono ? "font-mono text-xs" : ""} ${warning ? "text-[hsl(var(--warning))]" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
