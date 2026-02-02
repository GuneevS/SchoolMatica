import Link from "next/link";
import {
  Activity,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function StudentPortalOverview() {
  const { student, school } = await getStudentContext();

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    allMarks,
    homeworkItems,
    homeworkDueSoonCount,
    homeworkOverdueCount,
    reportCount,
    reportCards,
    upcomingEvents,
    invoiceTotals,
    nextInvoice,
    recentIncidents,
  ] = await Promise.all([
    prisma.mark.findMany({
      where: { studentId: student.id },
      include: {
        assessment: {
          select: {
            taskName: true,
            totalMark: true,
            term: true,
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
    }),
    prisma.homework.findMany({
      where: {
        classGroupId: student.classGroupId,
        status: "Active",
      },
      include: {
        submissions: {
          where: { studentId: student.id },
        },
        teacher: true,
      },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.homework.count({
      where: {
        classGroupId: student.classGroupId,
        status: "Active",
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        submissions: {
          none: {
            studentId: student.id,
            status: { in: ["Submitted", "Late", "Excused"] },
          },
        },
      },
    }),
    prisma.homework.count({
      where: {
        classGroupId: student.classGroupId,
        status: "Active",
        dueDate: { lt: now },
        submissions: {
          none: {
            studentId: student.id,
            status: { in: ["Submitted", "Late", "Excused"] },
          },
        },
      },
    }),
    prisma.reportCard.count({
      where: {
        studentId: student.id,
        status: { in: ["Published", "Finalized"] },
      },
    }),
    prisma.reportCard.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.schoolEvent.findMany({
      where: {
        schoolId: school.id,
        startDate: { gte: now },
        status: "Active",
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.invoice.aggregate({
      where: {
        studentId: student.id,
        status: { in: ["Sent", "Partially Paid", "Overdue"] },
      },
      _sum: {
        balanceDue: true,
      },
    }),
    prisma.invoice.findFirst({
      where: {
        studentId: student.id,
        balanceDue: { gt: 0 },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.behaviorIncident.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" },
      take: 4,
    }),
  ]);

  const validMarks = allMarks.filter((mark) => mark.rawMark !== null && !mark.isAbsent);
  const overallAverage =
    validMarks.length > 0
      ? Math.round(
          validMarks.reduce((sum, mark) => {
            const percent = ((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100;
            return sum + percent;
          }, 0) / validMarks.length,
        )
      : null;

  const recentMarks = validMarks.slice(0, 4);
  const recentAverage =
    recentMarks.length > 0
      ? Math.round(
          recentMarks.reduce((sum, mark) => {
            const percent = ((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100;
            return sum + percent;
          }, 0) / recentMarks.length,
        )
      : null;

  const trendDelta =
    overallAverage !== null && recentAverage !== null
      ? Math.round(recentAverage - overallAverage)
      : null;

  const behaviorBalance = student.behaviorBalance;
  const meritTotal = behaviorBalance?.meritTotal ?? 0;
  const demeritTotal = behaviorBalance?.demeritTotal ?? 0;
  const netBalance = behaviorBalance?.netBalance ?? meritTotal - demeritTotal;

  const homeworkCards = homeworkItems.map((hw) => {
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
      teacherName: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
      status,
      isOverdue,
    };
  });

  const feeOutstanding = invoiceTotals._sum.balanceDue ?? 0;

  const gradeLabel = student.classGroup.gradeLevel?.name ?? `Grade ${student.classGroup.grade}`;
  const className = student.classGroup.name;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Student Snapshot"
        title={
          <>
            {getGreeting()}, {student.firstName}.
            <span className="block text-muted-foreground text-2xl md:text-3xl font-semibold mt-3">
              Here is your learning pulse for the week.
            </span>
          </>
        }
        description={
          "Track homework, performance, wellbeing, and school updates from one personalised student space."
        }
        badges={[
          { label: gradeLabel },
          { label: className },
          { label: school.name },
        ]}
        actions={
          <>
            <Button asChild>
              <Link href="/student/homework">
                <BookOpen className="h-4 w-4 mr-2" />
                Open Homework
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/marks">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Marks
              </Link>
            </Button>
          </>
        }
        aside={
          <HeroMetricPanel
            title="Weekly Focus"
            icon={<Sparkles className="h-4 w-4" />}
            metrics={[
              {
                label: "Overall Average",
                value: overallAverage !== null ? `${overallAverage}%` : "--",
                helper:
                  trendDelta !== null
                    ? `${trendDelta > 0 ? "+" : ""}${trendDelta}% vs recent`
                    : "No marks yet",
                accent: "highlight",
              },
              {
                label: "Homework Due",
                value: `${homeworkDueSoonCount + homeworkOverdueCount}`,
                helper:
                  homeworkOverdueCount > 0
                    ? `${homeworkOverdueCount} overdue`
                    : "No overdue tasks",
              },
              {
                label: "Merit Balance",
                value: `${netBalance >= 0 ? "+" : ""}${netBalance}`,
                helper: `${meritTotal} merits / ${demeritTotal} demerits`,
              },
              {
                label: "Fees Outstanding",
                value: currencyFormatter.format(feeOutstanding),
                helper: nextInvoice?.dueDate
                  ? `Next due ${formatDate(nextInvoice.dueDate)}`
                  : "No unpaid invoices",
              },
            ]}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Homework Focus
                </CardTitle>
                <CardDescription>
                  Plan your week with upcoming deadlines.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/homework">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            {homeworkOverdueCount > 0 && (
              <Badge className="w-fit bg-red-500 text-white">
                {homeworkOverdueCount} overdue task{homeworkOverdueCount > 1 ? "s" : ""}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {homeworkCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mb-2 opacity-60" />
                <p className="font-medium">All clear for now</p>
                <p className="text-sm">No homework due in the next week.</p>
              </div>
            ) : (
              homeworkCards.map((hw) => (
                <div
                  key={hw.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                    hw.status === "overdue"
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))]",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {hw.subject} • Due {hw.dueDate} • {hw.teacherName}
                    </p>
                  </div>
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
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Snapshot
            </CardTitle>
            <CardDescription>Latest assessment results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <ProgressRing progress={overallAverage ?? 0} />
            </div>
            <div className="space-y-3">
              {recentMarks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Marks will appear once assessments are captured.
                </p>
              ) : (
                recentMarks.map((mark) => {
                  const percent = Math.round(((mark.rawMark ?? 0) / mark.assessment.totalMark) * 100);
                  return (
                    <div key={mark.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-foreground">{mark.assessment.taskName}</p>
                        <p className="text-xs text-muted-foreground">
                          {mark.assessment.term} • {mark.assessment.assessmentPlan?.classGroup.subject?.name ?? "Subject"}
                        </p>
                      </div>
                      <Badge className={cn(
                        "bg-[hsl(var(--accent-iris))]/15 text-[hsl(var(--accent-iris))]",
                        percent >= 70 && "bg-emerald-500/15 text-emerald-600",
                        percent < 50 && "bg-red-500/15 text-red-600",
                      )}>
                        {percent}%
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/student/marks">
                View all marks
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Key dates from your school calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startDate)} • {event.eventType}
                  </p>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/events">
                Open calendar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Report Cards
            </CardTitle>
            <CardDescription>Published and upcoming reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No report cards yet.</p>
            ) : (
              reportCards.map((report) => (
                <div key={report.id} className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Term {report.term} • {report.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.overallGrade ? `Overall ${report.overallGrade}` : "Pending results"}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              ))
            )}
            <div className="rounded-2xl border border-dashed p-3 text-xs text-muted-foreground">
              {reportCount} report{reportCount === 1 ? "" : "s"} ready for review.
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/reports">
                View reports
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Wellbeing & Conduct
            </CardTitle>
            <CardDescription>Track your behaviour balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[hsl(var(--surface-soft))] px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Net Balance</p>
                <p className="text-2xl font-semibold text-foreground">
                  {netBalance >= 0 ? "+" : ""}{netBalance}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{meritTotal} merits</p>
                <p>{demeritTotal} demerits</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentIncidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent incidents logged.</p>
              ) : (
                recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">{incident.category}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(incident.date)}</p>
                    </div>
                    <Badge className={cn(
                      incident.type === "Merit"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-red-500/15 text-red-600",
                    )}>
                      {incident.type} {incident.type === "Merit" ? `+${Math.abs(incident.points)}` : `-${Math.abs(incident.points)}`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/behavior">
                Review behaviour
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/student/marks", label: "Marks", icon: ClipboardList },
          { href: "/student/timetable", label: "Timetable", icon: Calendar },
          { href: "/student/messages", label: "Messages", icon: MessageSquare },
          { href: "/student/fees", label: "Fees", icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="group h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent-iris))]/10 text-[hsl(var(--accent-iris))] group-hover:bg-[hsl(var(--accent-iris))]/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">Open section</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Need help</p>
            <p className="text-lg font-semibold text-foreground">Talk to your teacher or send a message.</p>
          </div>
          <Button asChild>
            <Link href="/student/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send a message
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
