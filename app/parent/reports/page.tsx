import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Report Cards | SchoolMatica Parent Portal",
  description: "View and download your children's report cards.",
};

// Helper to calculate achievement level from percentage
function getAchievementLevel(percentage: number): number {
  if (percentage >= 80) return 7;
  if (percentage >= 70) return 6;
  if (percentage >= 60) return 5;
  if (percentage >= 50) return 4;
  if (percentage >= 40) return 3;
  if (percentage >= 30) return 2;
  return 1;
}

export default async function ReportsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Get parent user with all children and their report cards
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  gradeLevel: true,
                },
              },
              reportCards: {
                where: {
                  status: { in: ["Published", "Finalized"] },
                },
                orderBy: [
                  { year: "desc" },
                  { term: "desc" },
                ],
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    redirect("/login");
  }

  // Process all report cards for display
  const allReports = parentUser.contacts.flatMap((contact) => {
    const student = contact.student;
    return student.reportCards.map((report) => {
      // Determine if the report is "new" (published in last 30 days)
      const isNew = report.publishedAt && 
                    new Date(report.publishedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;

      // Calculate achievement level from overall percentage
      const overallAverage = report.overallPercentage || 0;
      const achievementLevel = report.achievementLevel || getAchievementLevel(overallAverage);

      return {
        id: report.id,
        child: `${student.firstName} ${student.lastName}`,
        grade: student.classGroup.gradeLevel?.name || `Grade ${student.classGroup.grade}`,
        term: report.term,
        year: report.year,
        status: report.status,
        overallAverage: Math.round(overallAverage),
        achievementLevel,
        publishedDate: report.publishedAt?.toISOString().split("T")[0] || 
                       report.createdAt.toISOString().split("T")[0],
        isNew,
      };
    });
  });

  // Sort reports by date (most recent first)
  allReports.sort((a, b) => {
    // First by year
    if (b.year !== a.year) return b.year - a.year;
    // Then by term (Term 4 > Term 1)
    const termA = parseInt(a.term.replace(/\D/g, "")) || 0;
    const termB = parseInt(b.term.replace(/\D/g, "")) || 0;
    return termB - termA;
  });

  const newReports = allReports.filter((r) => r.isNew);
  const pastReports = allReports.filter((r) => !r.isNew);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground mt-1">
          View and download your children&apos;s academic report cards.
        </p>
      </div>

      {allReports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Report Cards Available</h3>
            <p className="text-muted-foreground">
              Report cards will appear here once they are published by the school.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* New Reports */}
          {newReports.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge className="bg-[hsl(var(--accent-iris))]">New</Badge>
                Latest Reports
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {newReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden border-[hsl(var(--accent-iris))]/30">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className="w-2 bg-gradient-to-b from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))]" />
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{report.child}</h3>
                              <p className="text-sm text-muted-foreground">
                                {report.grade} • {report.term} {report.year}
                              </p>
                            </div>
                            <Badge className="bg-emerald-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {report.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold text-[hsl(var(--accent-iris))]">
                                {report.overallAverage}%
                              </p>
                              <p className="text-xs text-muted-foreground">Overall Average</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-2xl font-bold">
                                Level {report.achievementLevel}
                              </p>
                              <p className="text-xs text-muted-foreground">Achievement</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button className="flex-1" variant="outline" asChild>
                              <Link href={`/parent/reports/${report.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                            <Button className="flex-1 bg-[hsl(var(--accent-iris))] hover:bg-[hsl(var(--accent-iris))]/90">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Reports */}
          {pastReports.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Past Reports
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pastReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{report.child}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.grade} • {report.term} {report.year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="font-semibold">{report.overallAverage}%</p>
                            <p className="text-xs text-muted-foreground">
                              Level {report.achievementLevel}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/parent/reports/${report.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
