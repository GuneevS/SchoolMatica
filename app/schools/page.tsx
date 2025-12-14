import { prisma } from "@/lib/prisma";
import { AuroraHero } from "@/components/layout/aurora-hero";
import { SchoolManager } from "@/components/schools/school-manager";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";

export default async function SchoolsPage() {
  const [auth, activeSchool] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access schools.</p>
      </div>
    );
  }

  if (!auth.permissions.has("school:read")) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Access denied.</p>
      </div>
    );
  }

  const schools = await prisma.school.findMany({
    where: auth.isAdmin ? {} : { id: { in: auth.schoolIds } },
    include: {
      gradeLevels: { orderBy: { order: "asc" } },
      _count: { select: { classes: true, subjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Organisations"
        title={
          <>
            School <span className="gradient-text">tenancy</span>
          </>
        }
        description="Create new schools, manage grade bands, and isolate data per organisation. The active school in the header controls which data you see across the workspace."
        badges={[
          { label: `${schools.length} schools`, color: "hsl(var(--accent-iris))" },
          { label: activeSchool ? `Active: ${activeSchool.name}` : "No active school", color: "hsl(var(--accent-mint))" },
        ]}
      />

      <SchoolManager
        schools={schools.map((school) => ({
          id: school.id,
          name: school.name,
          shortCode: school.shortCode,
          createdAt: school.createdAt.toISOString(),
          gradeLevels: school.gradeLevels,
          _count: school._count,
        }))}
      />
    </div>
  );
}

