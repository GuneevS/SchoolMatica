import { prisma } from "@/lib/prisma";
import { ReportGeneratorForm } from "@/components/reports/report-generator-form";
import { AuroraHero } from "@/components/layout/aurora-hero";

export default async function GenerateReportsPage() {
  const schools = await prisma.school.findMany();
  const school = schools[0];

  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId: school?.id },
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
