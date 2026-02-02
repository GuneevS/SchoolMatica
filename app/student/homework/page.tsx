import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });

export default async function StudentHomeworkPage() {
  const { student } = await getStudentContext();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const homework = await prisma.homework.findMany({
    where: {
      classGroupId: student.classGroupId,
      status: "Active",
    },
    include: {
      teacher: true,
      submissions: {
        where: { studentId: student.id },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const processedHomework = homework.map((hw) => {
    const submission = hw.submissions[0];
    const isOverdue = hw.dueDate < now;

    let status: "pending" | "submitted" | "late" | "excused" | "overdue" = "pending";
    if (submission?.status === "Submitted") status = "submitted";
    if (submission?.status === "Late") status = "late";
    if (submission?.status === "Excused") status = "excused";
    if (!submission && isOverdue) status = "overdue";

    return {
      id: hw.id,
      title: hw.title,
      subject: hw.subject,
      dueDate: formatDate(hw.dueDate),
      dueDateTime: hw.dueDate,
      teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
      status,
      isOverdue,
    };
  });

  const totalCount = processedHomework.length;
  const overdueCount = processedHomework.filter((hw) => hw.status === "overdue").length;
  const submittedCount = processedHomework.filter((hw) => hw.status === "submitted" || hw.status === "late").length;
  const excusedCount = processedHomework.filter((hw) => hw.status === "excused").length;
  const pendingCount = processedHomework.filter((hw) => hw.status === "pending").length;
  const dueSoonCount = processedHomework.filter(
    (hw) =>
      hw.status === "pending" &&
      hw.dueDateTime >= now &&
      hw.dueDateTime <= sevenDaysFromNow,
  ).length;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Homework"
        title={
          <>
            Stay ahead of your assignments.
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Track deadlines, submissions, and feedback.
            </span>
          </>
        }
        description="Your personal homework tracker keeps every subject on schedule."
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
            title="Homework Metrics"
            icon={<BookOpen className="h-4 w-4" />}
            metrics={[
              { label: "Total Tasks", value: totalCount.toString(), accent: "highlight" },
              { label: "Due This Week", value: dueSoonCount.toString(), helper: overdueCount ? `${overdueCount} overdue` : "On track" },
              { label: "Submitted", value: submittedCount.toString(), helper: excusedCount ? `${excusedCount} excused` : undefined },
              { label: "Pending", value: pendingCount.toString() },
            ]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Homework Timeline
          </CardTitle>
          <CardDescription>Every active assignment sorted by due date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processedHomework.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No homework yet</p>
              <p className="text-sm">Check back later for new assignments.</p>
            </div>
          ) : (
            processedHomework.map((hw) => (
              <div
                key={hw.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3",
                  hw.status === "overdue"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))]",
                )}
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{hw.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {hw.subject} • Due {hw.dueDate} • {hw.teacherName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hw.status === "overdue" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {hw.status === "submitted" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {hw.status === "late" && <Clock className="h-4 w-4 text-amber-500" />}
                  <Badge
                    className={cn(
                      "capitalize",
                      hw.status === "submitted" && "bg-emerald-500/15 text-emerald-600",
                      hw.status === "late" && "bg-amber-500/15 text-amber-600",
                      hw.status === "excused" && "bg-blue-500/15 text-blue-600",
                      hw.status === "overdue" && "bg-red-500/15 text-red-600",
                      hw.status === "pending" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {hw.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
