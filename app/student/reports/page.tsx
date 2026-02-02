import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const { student } = await getStudentContext();

  const reportCards = await prisma.reportCard.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
  });

  const publishedCount = reportCards.filter((r) => r.status === "Published" || r.status === "Finalized").length;
  const draftCount = reportCards.filter((r) => r.status === "Draft").length;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Reports"
        title={
          <>
            Report Cards
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Review academic progress and teacher feedback.
            </span>
          </>
        }
        description="Published reports appear here once your school releases them."
        actions={
          <Button asChild>
            <Link href="/student/marks">
              View marks
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        }
        aside={
          <HeroMetricPanel
            title="Report Overview"
            icon={<FileText className="h-4 w-4" />}
            metrics={[
              { label: "Published", value: publishedCount.toString(), accent: "highlight" },
              { label: "Draft", value: draftCount.toString() },
              { label: "Total", value: reportCards.length.toString() },
            ]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Timeline
          </CardTitle>
          <CardDescription>Latest reports for the academic year.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No reports yet</p>
              <p className="text-sm">Reports will appear once published by your school.</p>
            </div>
          ) : (
            reportCards.map((report) => (
              <div
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">Term {report.term} • {report.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.overallGrade ? `Overall ${report.overallGrade}` : "Results pending"}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
