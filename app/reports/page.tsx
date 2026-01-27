import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";

// Force dynamic rendering - requires database
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const schools = await prisma.school.findMany();
  const school = schools[0];

  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId: school?.id },
    include: {
      students: true,
      assessmentPlans: true,
    },
  });

  const stats = {
    totalStudents: classGroups.reduce((sum, cg) => sum + cg.students.length, 0),
    totalClasses: classGroups.length,
    withAssessments: classGroups.filter((cg) => cg.assessmentPlans.length > 0).length,
  };

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Academic Reports"
        title={
          <>
            <span className="gradient-text">Reports & Comments</span>
          </>
        }
        description="Generate report cards, manage learner comments, and view comprehensive analytics"
        badges={[
          { label: `${stats.totalStudents} Students`, color: "hsl(var(--accent-blue))" },
          { label: `${stats.totalClasses} Classes`, color: "hsl(var(--accent-mint))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Report Overview"
            icon={<FileText className="h-4 w-4" />}
            metrics={[
              { label: "Total Students", value: stats.totalStudents.toString(), accent: "highlight" },
              { label: "Classes", value: stats.totalClasses.toString() },
              { label: "With Assessments", value: stats.withAssessments.toString() },
            ]}
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Generate Report Cards */}
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generate Report Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create comprehensive report cards for students with grades, comments, and conduct ratings
            </p>
            <Button className="w-full" asChild>
              <Link href="/reports/generate">
                <Plus className="h-4 w-4 mr-2" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Learner Comments */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Learner Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add teacher comments, HOD feedback, and narrative assessments for learners
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/reports/comments">
                <Eye className="h-4 w-4 mr-2" />
                Manage Comments
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Subject Analytics */}
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Subject Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View performance breakdown by subject, class, and grade level
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/reports/analytics">
                <Download className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Class-by-Class Reports */}
        {classGroups.map((classGroup) => (
          <Card key={classGroup.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{classGroup.name}</CardTitle>
                <Badge variant="outline">{classGroup.students.length} students</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/reports/class/${classGroup.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/reports/class/${classGroup.id}/generate`}>
                    <FileText className="h-3 w-3 mr-1" />
                    Generate
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
