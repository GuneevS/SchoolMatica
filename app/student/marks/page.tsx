import Link from "next/link";
import { Award, ChevronRight, ClipboardList, TrendingUp } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentMarksPage() {
  const { student } = await getStudentContext();

  const marks = await prisma.mark.findMany({
    where: { studentId: student.id },
    include: {
      assessment: {
        select: {
          taskName: true,
          totalMark: true,
          term: true,
          dueDate: true,
          assessmentPlan: {
            select: {
              classGroup: {
                select: {
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const validMarks = marks.filter((mark) => mark.rawMark !== null && !mark.isAbsent);
  const overallAverage =
    validMarks.length > 0
      ? Math.round(
          validMarks.reduce((sum, mark) => {
            const percent = ((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100;
            return sum + percent;
          }, 0) / validMarks.length,
        )
      : null;

  const highestScore =
    validMarks.length > 0
      ? Math.max(
          ...validMarks.map((mark) =>
            Math.round(((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100),
          ),
        )
      : null;

  const lowestScore =
    validMarks.length > 0
      ? Math.min(
          ...validMarks.map((mark) =>
            Math.round(((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100),
          ),
        )
      : null;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Marks"
        title={
          <>
            Performance Dashboard
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Track every assessment and your progress over time.
            </span>
          </>
        }
        description="Your results are captured here as teachers submit assessments."
        actions={
          <Button asChild>
            <Link href="/student/reports">
              View report cards
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        }
        aside={
          <HeroMetricPanel
            title="Key Insights"
            icon={<TrendingUp className="h-4 w-4" />}
            metrics={[
              {
                label: "Overall Average",
                value: overallAverage !== null ? `${overallAverage}%` : "--",
                helper: validMarks.length ? `${validMarks.length} results` : "No marks yet",
                accent: "highlight",
              },
              {
                label: "Best Score",
                value: highestScore !== null ? `${highestScore}%` : "--",
                helper: lowestScore !== null ? `Lowest ${lowestScore}%` : undefined,
              },
              {
                label: "Assessments",
                value: marks.length.toString(),
                helper: marks.length ? "Captured to date" : "No assessments captured",
              },
            ]}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Assessment Results
            </CardTitle>
            <CardDescription>Latest marks sorted by most recent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {marks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 mb-2 opacity-60" />
                <p className="font-medium">No marks yet</p>
                <p className="text-sm">Results will appear once assessments are marked.</p>
              </div>
            ) : (
              marks.map((mark) => {
                const percent = mark.rawMark !== null
                  ? Math.round(((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100)
                  : null;
                const subjectName = mark.assessment.assessmentPlan?.classGroup.subject?.name ?? "Subject";

                return (
                  <div
                    key={mark.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{mark.assessment.taskName}</p>
                      <p className="text-xs text-muted-foreground">
                        {subjectName} • Term {mark.assessment.term}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mark.isAbsent && (
                        <Badge className="bg-amber-500/15 text-amber-600">Absent</Badge>
                      )}
                      {percent !== null && (
                        <Badge
                          className={cn(
                            "bg-[hsl(var(--accent-iris))]/15 text-[hsl(var(--accent-iris))]",
                            percent >= 70 && "bg-emerald-500/15 text-emerald-600",
                            percent < 50 && "bg-red-500/15 text-red-600",
                          )}
                        >
                          {percent}%
                        </Badge>
                      )}
                      {percent === null && !mark.isAbsent && (
                        <Badge className="bg-muted text-muted-foreground">Pending</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Snapshot
            </CardTitle>
            <CardDescription>Your current average with quick insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <ProgressRing progress={overallAverage ?? 0} />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                {overallAverage === null
                  ? "Once marks are captured, your overall performance will appear here."
                  : overallAverage >= 70
                  ? "Great work! You are performing at a strong level."
                  : overallAverage >= 50
                  ? "You are on track. Focus on upcoming tasks to improve." 
                  : "Let us focus on the next assignments to lift your average."}
              </p>
              <p>
                Reach out to your teacher if you need extra support or feedback.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/student/homework">
                Review upcoming homework
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
