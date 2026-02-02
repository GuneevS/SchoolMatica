import { Calendar, Clock } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function StudentTimetablePage() {
  const { student, school } = await getStudentContext();

  const timetable = await prisma.timetable.findFirst({
    where: {
      schoolId: school.id,
      status: "Active",
    },
    orderBy: { startDate: "desc" },
    include: {
      periods: {
        include: {
          slots: {
            where: { classGroupId: student.classGroupId },
            include: {
              classGroup: { include: { subject: true } },
              teacher: true,
              period: true,
              assessmentPlan: true,
            },
          },
        },
      },
      slots: {
        where: { classGroupId: student.classGroupId },
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
          assessmentPlan: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Timetable"
        title={
          <>
            Your learning schedule
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              See every period, subject, and teacher in one view.
            </span>
          </>
        }
        description="Timetables are updated by your school once they are published."
        aside={
          <HeroMetricPanel
            title="Current Term"
            icon={<Clock className="h-4 w-4" />}
            metrics={[
              {
                label: "Status",
                value: timetable ? timetable.status : "Not published",
                accent: "highlight",
              },
              {
                label: "Term",
                value: timetable ? timetable.term : "--",
                helper: timetable ? `${timetable.year}` : undefined,
              },
              {
                label: "Starts",
                value: timetable ? formatDate(timetable.startDate) : "--",
                helper: timetable ? `Ends ${formatDate(timetable.endDate)}` : undefined,
              },
            ]}
          />
        }
      />

      {timetable ? (
        <TimetableGrid timetable={timetable} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timetable not published
            </CardTitle>
            <CardDescription>
              Your school has not released a timetable yet. Please check back soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once your timetable is published, this page will display every period, subject, and teacher.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
