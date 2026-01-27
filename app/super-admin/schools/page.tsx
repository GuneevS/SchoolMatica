import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";
import { Building2, Users, GraduationCap, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date-utils";

async function getSchools() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          teachers: true,
          classes: true,
          subjects: true,
          gradeLevels: true,
        },
      },
    },
  });

  // Get student counts for each school
  const schoolsWithStudents = await Promise.all(
    schools.map(async (school) => {
      const studentCount = await prisma.student.count({
        where: { classGroup: { schoolId: school.id } },
      });

      const adminCount = await prisma.userRoleAssignment.count({
        where: {
          scopeSchoolId: school.id,
          role: { key: { in: ["admin", "smt"] } },
        },
      });

      return {
        ...school,
        studentCount,
        adminCount,
      };
    })
  );

  return schoolsWithStudents;
}

export default async function SuperAdminSchoolsPage() {
  await requireSuperAdmin();
  const schools = await getSchools();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schools</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all schools on the platform
          </p>
        </div>
        <Link href="/super-admin/schools/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add School
          </Button>
        </Link>
      </div>

      {/* Schools Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {schools.map((school) => (
          <Link key={school.id} href={`/super-admin/schools/${school.id}`}>
            <Card className="h-full cursor-pointer rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-ambient">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent-violet))/0.12]">
                    <Building2 className="h-6 w-6 text-[hsl(var(--accent-violet))]" />
                  </div>
                  {school.shortCode && (
                    <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {school.shortCode}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-3 text-xl">{school.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <StatItem icon={Users} label="Users" value={school._count.users} />
                  <StatItem icon={GraduationCap} label="Teachers" value={school._count.teachers} />
                  <StatItem icon={BookOpen} label="Students" value={school.studentCount} />
                  <StatItem icon={Building2} label="Classes" value={school._count.classes} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))/0.5] pt-4">
                  <span className="text-xs text-muted-foreground">
                    Created {formatDateTime(school.createdAt)}
                  </span>
                  {school.adminCount > 0 ? (
                    <span className="rounded-full bg-[hsl(var(--success))/0.15] px-2 py-0.5 text-xs font-medium text-[hsl(var(--success))]">
                      {school.adminCount} admin{school.adminCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[hsl(var(--warning))/0.15] px-2 py-0.5 text-xs font-medium text-[hsl(var(--warning))]">
                      No admins
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {schools.length === 0 && (
        <Card className="rounded-[24px] border border-dashed border-[hsl(var(--border))]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No schools yet</h3>
            <p className="mt-1 text-muted-foreground">
              Create your first school to get started
            </p>
            <Link href="/super-admin/schools/new" className="mt-6">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create School
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{value} {label}</span>
    </div>
  );
}
