import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  ArrowLeft,
  UserPlus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-utils";
import { ProvisionAdminDialog } from "@/components/super-admin/provision-admin-dialog";
import { SchoolSwitchButton } from "@/components/super-admin/school-switch-button";

interface PageProps {
  params: Promise<{ schoolId: string }>;
}

async function getSchool(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      gradingConfig: true,
      gradeLevels: { orderBy: { order: "asc" } },
      subjects: { orderBy: { name: "asc" } },
      _count: {
        select: {
          classes: true,
          teachers: true,
          users: true,
          timetables: true,
        },
      },
    },
  });

  if (!school) return null;

  // Get student count
  const studentCount = await prisma.student.count({
    where: { classGroup: { schoolId } },
  });

  // Get admin users for this school
  const adminUsers = await prisma.appUser.findMany({
    where: {
      roleAssignments: {
        some: {
          scopeSchoolId: schoolId,
          role: { key: { in: ["admin", "smt", "hod"] } },
        },
      },
    },
    include: {
      roleAssignments: {
        where: { scopeSchoolId: schoolId },
        include: { role: { select: { key: true, name: true, priority: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get recent audit logs
  const recentLogs = await prisma.auditLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    ...school,
    studentCount,
    adminUsers,
    recentLogs,
  };
}

export default async function SchoolDetailPage({ params }: PageProps) {
  await requireSuperAdmin();
  const { schoolId } = await params;
  const school = await getSchool(schoolId);

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/super-admin/schools"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schools
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent-violet))/0.12]">
                <Building2 className="h-6 w-6 text-[hsl(var(--accent-violet))]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{school.name}</h1>
                {school.shortCode && (
                  <p className="text-muted-foreground">Code: {school.shortCode}</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Created {formatDateTime(school.createdAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <SchoolSwitchButton schoolId={school.id} schoolName={school.name} />
            <ProvisionAdminDialog schoolId={school.id} schoolName={school.name} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={school._count.users} icon={Users} />
        <StatCard label="Teachers" value={school._count.teachers} icon={GraduationCap} />
        <StatCard label="Students" value={school.studentCount} icon={BookOpen} />
        <StatCard label="Classes" value={school._count.classes} icon={Building2} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Administrators */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
              Administrators
            </CardTitle>
            <ProvisionAdminDialog schoolId={school.id} schoolName={school.name} variant="outline" />
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {school.adminUsers.length > 0 ? (
              school.adminUsers.map((user) => (
                <div key={user.id} className="py-4 first:pt-6 last:pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {user.roleAssignments.map((ra) => (
                        <span
                          key={ra.id}
                          className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {ra.role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No administrators assigned yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Provision an admin to allow school management
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Configuration */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Settings className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Grading Configuration</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {school.gradingConfig?.name ?? "No grading config"}
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Grade Levels</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {school.gradeLevels.length > 0
                  ? school.gradeLevels.map((g) => g.name).join(", ")
                  : "No grade levels configured"}
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Subjects</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {school.subjects.length > 0
                  ? `${school.subjects.length} subjects configured`
                  : "No subjects configured"}
              </p>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
              <h4 className="text-sm font-medium text-foreground">Timetables</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {school._count.timetables} timetable{school._count.timetables !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] lg:col-span-2">
          <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {school.recentLogs.length > 0 ? (
              school.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 first:pt-6 last:pb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.entityType} · {log.actorRole}
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
                No activity recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[20px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent-violet))/0.12]">
          <Icon className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
