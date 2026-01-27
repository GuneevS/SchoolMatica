import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";
import { Users, Search, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-utils";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    schoolId?: string;
    roleKey?: string;
    page?: string;
  }>;
}

async function getUsers(params: {
  search?: string;
  schoolId?: string;
  roleKey?: string;
  page?: string;
}) {
  const page = parseInt(params.page || "1", 10);
  const limit = 20;

  type WhereClause = {
    OR?: Array<{ email?: { contains: string; mode: "insensitive" }; displayName?: { contains: string; mode: "insensitive" } }>;
    schoolId?: string | null;
    roleAssignments?: { some: { role: { key: string } } };
  };

  const where: WhereClause = {};

  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: "insensitive" } },
      { displayName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.schoolId) {
    if (params.schoolId === "null") {
      where.schoolId = null;
    } else {
      where.schoolId = params.schoolId;
    }
  }

  if (params.roleKey) {
    where.roleAssignments = {
      some: { role: { key: params.roleKey } },
    };
  }

  const [users, total, schools, roles] = await Promise.all([
    prisma.appUser.findMany({
      where,
      include: {
        school: { select: { id: true, name: true, shortCode: true } },
        roleAssignments: {
          include: { role: { select: { key: true, name: true, priority: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appUser.count({ where }),
    prisma.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.roleDefinition.findMany({ select: { key: true, name: true }, orderBy: { priority: "desc" } }),
  ]);

  return {
    users,
    total,
    schools,
    roles,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export default async function SuperAdminUsersPage({ searchParams }: PageProps) {
  await requireSuperAdmin();
  const params = await searchParams;
  const data = await getUsers(params);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Manage all users across the platform ({data.total} total)
        </p>
      </div>

      {/* Filters */}
      <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by name or email..."
                  defaultValue={params.search}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-background py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <select
              name="schoolId"
              defaultValue={params.schoolId}
              className="rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All Schools</option>
              <option value="null">No School</option>
              {data.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            <select
              name="roleKey"
              defaultValue={params.roleKey}
              className="rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All Roles</option>
              {data.roles.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))]">
        <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-[hsl(var(--accent-cobalt))]" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[hsl(var(--border))/0.5]">
            {data.users.map((user) => (
              <Link
                key={user.id}
                href={`/super-admin/users/${user.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-[hsl(var(--surface-soft))] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent-cobalt))/0.12] text-sm font-medium text-[hsl(var(--accent-cobalt))]">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user.school && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {user.school.shortCode || user.school.name}
                    </div>
                  )}
                  <div className="flex gap-1">
                    {user.roleAssignments.slice(0, 2).map((ra) => (
                      <span
                        key={ra.id}
                        className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {ra.role.name}
                      </span>
                    ))}
                    {user.roleAssignments.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{user.roleAssignments.length - 2}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {data.users.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/super-admin/users?${new URLSearchParams({
                ...(params.search && { search: params.search }),
                ...(params.schoolId && { schoolId: params.schoolId }),
                ...(params.roleKey && { roleKey: params.roleKey }),
                page: pageNum.toString(),
              }).toString()}`}
              className={`rounded-lg px-3 py-1 text-sm ${
                pageNum === data.page
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-[hsl(var(--surface-soft))]"
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
