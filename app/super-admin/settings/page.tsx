import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

import {
  Settings,
  Shield,
  Database,
  Users,
  Building2,
  Key,
  Activity,
} from "lucide-react";

async function getPlatformStats() {
  const [
    schoolCount,
    userCount,
    teacherCount,
    studentCount,
    roleCount,
    permissionCount,
    recentActivity,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.appUser.count(),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.roleDefinition.count(),
    prisma.permissionDefinition.count(),
    prisma.auditLog.count(),
  ]);

  // Get all role definitions
  const roles = await prisma.roleDefinition.findMany({
    include: {
      _count: {
        select: { assignments: true, permissions: true },
      },
    },
    orderBy: { priority: "desc" },
  });

  // Get super admin count
  const superAdminCount = await prisma.userRoleAssignment.count({
    where: { role: { key: "super_admin" } },
  });

  return {
    schoolCount,
    userCount,
    teacherCount,
    studentCount,
    roleCount,
    permissionCount,
    recentActivity,
    roles,
    superAdminCount,
  };
}

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();
  const stats = await getPlatformStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="mt-1 text-muted-foreground">
          View platform configuration and statistics
        </p>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Schools"
          value={stats.schoolCount}
          icon={Building2}
          color="violet"
        />
        <StatCard
          label="Total Users"
          value={stats.userCount}
          icon={Users}
          color="cobalt"
        />
        <StatCard
          label="Super Admins"
          value={stats.superAdminCount}
          icon={Shield}
          color="flamingo"
        />
        <StatCard
          label="Audit Events"
          value={stats.recentActivity}
          icon={Activity}
          color="mint"
        />
      </div>

      {/* System Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Definitions */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
              Role Definitions
            </CardTitle>
            <CardDescription>
              {stats.roleCount} roles configured with {stats.permissionCount} permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {stats.roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between py-4 first:pt-6 last:pb-2">
                <div>
                  <p className="font-medium text-foreground">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Key: {role.key} · Priority: {role.priority}
                  </p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-sm font-medium text-foreground">{role._count.assignments}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{role._count.permissions}</p>
                    <p className="text-xs text-muted-foreground">perms</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Database Statistics */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Database className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
              Database Statistics
            </CardTitle>
            <CardDescription>
              Current data counts across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <StatRow label="Schools" value={stats.schoolCount} />
            <StatRow label="Users" value={stats.userCount} />
            <StatRow label="Teachers" value={stats.teacherCount} />
            <StatRow label="Students" value={stats.studentCount} />
            <StatRow label="Role Definitions" value={stats.roleCount} />
            <StatRow label="Permission Definitions" value={stats.permissionCount} />
            <StatRow label="Audit Log Entries" value={stats.recentActivity} />
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Key className="h-5 w-5 text-[hsl(var(--accent-mint))]" />
              Security Configuration
            </CardTitle>
            <CardDescription>
              Platform security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Password Requirements</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Minimum 8 characters</li>
                <li>Account lockout after 5 failed attempts</li>
                <li>Session expiry: 30 days</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Authentication Providers</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Email/Password authentication</li>
                <li>Google OAuth (if configured)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Settings className="h-5 w-5 text-[hsl(var(--accent-gold))]" />
              System Information
            </CardTitle>
            <CardDescription>
              Platform version and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Application</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Platform: SchoolMatica</li>
                <li>Version: 1.0.0</li>
                <li>Environment: {process.env.NODE_ENV}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Database</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Provider: SQLite (Development)</li>
                <li>ORM: Prisma</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Links */}
      <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
        <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
          <CardTitle className="text-lg font-semibold">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <QuickRefCard
            title="Super Admin Guide"
            description="Learn about platform management"
          />
          <QuickRefCard
            title="School Onboarding"
            description="Steps to onboard new schools"
          />
          <QuickRefCard
            title="Role Management"
            description="Understanding roles and permissions"
          />
          <QuickRefCard
            title="Audit Logs"
            description="Tracking platform activity"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "violet" | "cobalt" | "mint" | "gold" | "flamingo";
}) {
  const colorClasses = {
    violet: {
      bg: "bg-[hsl(var(--accent-violet))/0.12]",
      text: "text-[hsl(var(--accent-violet))]",
    },
    cobalt: {
      bg: "bg-[hsl(var(--accent-cobalt))/0.12]",
      text: "text-[hsl(var(--accent-cobalt))]",
    },
    mint: {
      bg: "bg-[hsl(var(--accent-mint))/0.12]",
      text: "text-[hsl(var(--accent-mint))]",
    },
    gold: {
      bg: "bg-[hsl(var(--accent-gold))/0.12]",
      text: "text-[hsl(var(--accent-gold))]",
    },
    flamingo: {
      bg: "bg-[hsl(var(--accent-flamingo))/0.12]",
      text: "text-[hsl(var(--accent-flamingo))]",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className="rounded-[20px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${classes.bg}`}>
          <Icon className={`h-6 w-6 ${classes.text}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

function QuickRefCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
