import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";
import { Building2, Users, GraduationCap, BookOpen, Activity, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date-utils";

async function getDashboardStats() {
  const [
    schoolCount,
    userCount,
    teacherCount,
    studentCount,
    classCount,
    recentSchools,
    recentUsers,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.appUser.count(),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.classGroup.count(),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { users: true, teachers: true, classes: true } },
      },
    }),
    prisma.appUser.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        school: { select: { name: true } },
        roleAssignments: {
          include: { role: { select: { name: true, key: true } } },
        },
      },
    }),
  ]);

  return {
    schoolCount,
    userCount,
    teacherCount,
    studentCount,
    classCount,
    recentSchools,
    recentUsers,
  };
}

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Manage schools, users, and platform-wide settings
          </p>
        </div>
        <Link href="/super-admin/schools/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add School
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Schools"
          value={stats.schoolCount}
          icon={Building2}
          color="violet"
        />
        <StatCard
          label="Users"
          value={stats.userCount}
          icon={Users}
          color="cobalt"
        />
        <StatCard
          label="Teachers"
          value={stats.teacherCount}
          icon={GraduationCap}
          color="emerald"
        />
        <StatCard
          label="Students"
          value={stats.studentCount}
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          label="Classes"
          value={stats.classCount}
          icon={Activity}
          color="flamingo"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Schools */}
        <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
              Recent Schools
            </CardTitle>
            <Link href="/super-admin/schools">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {stats.recentSchools.map((school) => (
              <Link
                key={school.id}
                href={`/super-admin/schools/${school.id}`}
                className="flex items-center justify-between py-4 first:pt-6 last:pb-2 hover:opacity-80 transition-opacity"
              >
                <div>
                  <p className="font-medium text-foreground">{school.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {school.shortCode ? `${school.shortCode} · ` : ""}
                    {school._count.users} users · {school._count.teachers} teachers
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(school.createdAt)}
                </span>
              </Link>
            ))}
            {stats.recentSchools.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                No schools created yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--border))/0.6] pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
              Recent Users
            </CardTitle>
            <Link href="/super-admin/users">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-[hsl(var(--border))/0.5]">
            {stats.recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/super-admin/users/${user.id}`}
                className="flex items-center justify-between py-3 first:pt-6 last:pb-2 hover:opacity-80 transition-opacity"
              >
                <div>
                  <p className="font-medium text-foreground">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                    {user.school && ` · ${user.school.name}`}
                  </p>
                </div>
                <div className="text-right">
                  {user.roleAssignments[0] && (
                    <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {user.roleAssignments[0].role.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                No users created yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
        <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/super-admin/schools/new">
            <QuickActionCard
              title="Create School"
              description="Add a new school to the platform"
              icon={Building2}
            />
          </Link>
          <Link href="/super-admin/users">
            <QuickActionCard
              title="Manage Users"
              description="View and edit platform users"
              icon={Users}
            />
          </Link>
          <Link href="/super-admin/schools">
            <QuickActionCard
              title="View Schools"
              description="Browse all registered schools"
              icon={Building2}
            />
          </Link>
          <Link href="/dashboard">
            <QuickActionCard
              title="School Dashboard"
              description="Switch to school-level view"
              icon={Activity}
            />
          </Link>
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
  color: "violet" | "cobalt" | "emerald" | "amber" | "flamingo";
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
    emerald: {
      bg: "bg-[hsl(var(--accent-mint))/0.12]",
      text: "text-[hsl(var(--accent-mint))]",
    },
    amber: {
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

function QuickActionCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group cursor-pointer rounded-2xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-ambient-sm">
      <Icon className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
      <h3 className="mt-3 font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
