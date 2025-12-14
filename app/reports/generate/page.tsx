import { prisma } from "@/lib/prisma";
import { ReportGeneratorForm } from "@/components/reports/report-generator-form";
import { AuroraHero } from "@/components/layout/aurora-hero";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";

export default async function GenerateReportsPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to generate reports.</p>
      </div>
    );
  }

  if (!auth.permissions.has("report:generate")) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Access denied.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Create one from the Schools workspace to get started.</p>
      </div>
    );
  }

  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId: school.id },
    include: {
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      subject: true,
    },
  });

  const currentYear = new Date().getFullYear();
  const terms = ["T1", "T2", "T3", "T4"];

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Report Generation"
        title={<span className="gradient-text">Generate Report Cards</span>}
        description="Create comprehensive report cards with grades, comments, and conduct ratings"
      />

      <ReportGeneratorForm
        classGroups={classGroups}
        currentYear={currentYear}
        terms={terms}
      />
    </div>
  );
}
