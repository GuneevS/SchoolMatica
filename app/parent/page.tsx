import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  FileText,
  Award,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Bell,
  TrendingUp,
  Clock,
  Loader2,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getServerAuthContext } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { calculateStudentSba } from "@/lib/calculations";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Parent Dashboard | SchoolMatica",
  description: "View your children's academic progress and school updates.",
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
        <p className="text-muted-foreground mb-4">
          Your account is not linked to any students yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Please contact your school administrator to link your children to your account.
        </p>
      </CardContent>
    </Card>
  );
}

// Helper to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// Helper to get greeting based on time of day in SAST (UTC+2)
function getGreeting(): string {
  const now = new Date();
  // Convert to South Africa Standard Time (UTC+2) regardless of server timezone
  const hour = new Date(now.getTime() + (2 * 60 + now.getTimezoneOffset()) * 60000).getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  return "Good evening!";
}

export default async function ParentDashboard() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");

  // Get parent user with all children data
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
                  school: true,
                },
              },
              behaviorBalance: true,
              reportCards: {
                where: {
                  status: { in: ["Published", "Finalized"] },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
              },
              marks: {
                include: {
                  assessment: {
                    include: {
                      assessmentPlan: true,
                    },
                  },
                },
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

  // Get notifications for this user
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get upcoming events from schools of children
  const schoolIds = [...new Set(parentUser.contacts.map(c => c.student.classGroup.schoolId))];
  const upcomingEvents = await prisma.schoolEvent.findMany({
    where: {
      schoolId: { in: schoolIds },
      startDate: { gte: new Date() },
      status: "Active",
    },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  // Get homework for parent's children
  const childrenIds = parentUser.contacts.map((c) => c.student.id);
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Upcoming homework (due in next 7 days)
  const upcomingHomework = await prisma.homework.findMany({
    where: {
      classGroup: {
        students: { some: { id: { in: childrenIds } } },
      },
      status: "Active",
      dueDate: {
        gte: now,
        lte: sevenDaysFromNow,
      },
    },
    include: {
      classGroup: true,
      submissions: {
        where: { studentId: { in: childrenIds } },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  // Overdue homework
  const overdueHomework = await prisma.homework.findMany({
    where: {
      classGroup: {
        students: { some: { id: { in: childrenIds } } },
      },
      status: "Active",
      dueDate: { lt: now },
      submissions: {
        none: {
          studentId: { in: childrenIds },
          status: { in: ["Submitted", "Late", "Excused"] },
        },
      },
    },
    include: {
      classGroup: true,
      submissions: {
        where: { studentId: { in: childrenIds } },
      },
    },
    orderBy: { dueDate: "desc" },
    take: 5,
  });

  // Process children data for display
  const children = parentUser.contacts.map((contact) => {
    const student = contact.student;
    const marks = student.marks || [];
    
    // Calculate overall average using CAPS-weighted SBA calculation
    let overallAverage = 0;
    if (marks.length > 0) {
      // Group marks by assessment for calculateStudentSba
      const assessmentMap = new Map<string, typeof marks[0]["assessment"] & { marks: typeof marks }>();
      for (const mark of marks) {
        const id = mark.assessment.id;
        if (!assessmentMap.has(id)) {
          assessmentMap.set(id, { ...mark.assessment, marks: [] });
        }
        assessmentMap.get(id)!.marks.push(mark);
      }
      const sba = calculateStudentSba({
        assessments: Array.from(assessmentMap.values()),
        studentId: student.id,
      });
      overallAverage = Math.round(sba.sbaPercent);
    }

    // Count pending reports (published but potentially unread)
    const pendingReports = student.reportCards.filter(
      (r) => r.status === "Published" && r.publishedAt && 
             new Date(r.publishedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    ).length;

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.classGroup.gradeLevel?.name || `Grade ${student.classGroup.grade}`,
      class: student.classGroup.name,
      overallAverage,
      merits: student.behaviorBalance?.meritTotal || 0,
      demerits: student.behaviorBalance?.demeritTotal || 0,
      pendingReports,
    };
  });

  // Process notifications for display
  const processedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type as "grade" | "message" | "behavior",
    title: n.title,
    body: n.body,
    time: getTimeAgo(n.createdAt),
    unread: !n.read,
  }));

  // Process upcoming events
  const processedEvents = upcomingEvents.map((e) => ({
    title: e.title,
    date: e.startDate.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    type: e.eventType.toLowerCase(),
  }));

  // Helper to get submission status for a homework item
  const getHomeworkStatus = (hw: typeof upcomingHomework[0]) => {
    const submission = hw.submissions[0];
    if (!submission) return "pending";
    if (submission.status === "Submitted") return "submitted";
    if (submission.status === "Late") return "late";
    if (submission.status === "Excused") return "excused";
    return "pending";
  };

  // Process homework for display
  const processedUpcomingHomework = upcomingHomework.map((hw) => ({
    id: hw.id,
    title: hw.title,
    subject: hw.subject,
    className: hw.classGroup.name,
    dueDate: hw.dueDate.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    }),
    dueDateTime: hw.dueDate,
    status: getHomeworkStatus(hw),
  }));

  const processedOverdueHomework = overdueHomework.map((hw) => ({
    id: hw.id,
    title: hw.title,
    subject: hw.subject,
    className: hw.classGroup.name,
    dueDate: hw.dueDate.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    }),
    dueDateTime: hw.dueDate,
    status: "overdue" as const,
  }));

  const totalHomeworkCount = processedUpcomingHomework.length + processedOverdueHomework.length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your children today.
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact School
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingState />}>
        {children.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Children Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child) => (
                <Card key={child.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-2 bg-gradient-to-b from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))]" />
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {child.firstName} {child.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {child.grade} • Class {child.class}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/parent/children/${child.id}`}>
                              View Profile
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-[hsl(var(--accent-iris))]">
                              {child.overallAverage}%
                            </p>
                            <p className="text-xs text-muted-foreground">Average</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {child.merits}
                            </p>
                            <p className="text-xs text-muted-foreground">Merits</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-amber-500/10">
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                              {child.demerits}
                            </p>
                            <p className="text-xs text-muted-foreground">Demerits</p>
                          </div>
                        </div>

                        {child.pendingReports > 0 && (
                          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                {child.pendingReports} new report{child.pendingReports > 1 ? "s" : ""} available
                              </span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-blue-500" asChild>
                              <Link href="/parent/reports">View</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Homework Section */}
            {(processedUpcomingHomework.length > 0 || processedOverdueHomework.length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Homework
                        {processedOverdueHomework.length > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {processedOverdueHomework.length} overdue
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Upcoming and pending assignments
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/parent/homework">
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Overdue homework - show first with warning */}
                    {processedOverdueHomework.map((hw) => (
                      <div
                        key={hw.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-500/20">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{hw.title}</p>
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                              Overdue
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {hw.subject} • {hw.className} • Was due {hw.dueDate}
                          </p>
                        </div>
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      </div>
                    ))}

                    {/* Upcoming homework */}
                    {processedUpcomingHomework.map((hw) => {
                      const isDueSoon = hw.dueDateTime <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                      const isSubmitted = hw.status === "submitted" || hw.status === "late";
                      
                      return (
                        <div
                          key={hw.id}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            isSubmitted
                              ? "bg-emerald-500/10"
                              : isDueSoon
                              ? "bg-amber-500/10"
                              : "bg-muted/30"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              isSubmitted
                                ? "bg-emerald-500/20"
                                : isDueSoon
                                ? "bg-amber-500/20"
                                : "bg-[hsl(var(--accent-iris))]/10"
                            }`}
                          >
                            {isSubmitted ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <BookOpen
                                className={`h-5 w-5 ${
                                  isDueSoon ? "text-amber-500" : "text-[hsl(var(--accent-iris))]"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{hw.title}</p>
                              {isSubmitted && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                  {hw.status === "late" ? "Submitted Late" : "Submitted"}
                                </Badge>
                              )}
                              {!isSubmitted && isDueSoon && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                                  Due Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {hw.subject} • {hw.className} • Due {hw.dueDate}
                            </p>
                          </div>
                          {isSubmitted ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Clock
                              className={`h-5 w-5 flex-shrink-0 ${
                                isDueSoon ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}

                    {processedUpcomingHomework.length === 0 && processedOverdueHomework.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No upcoming homework</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Notifications */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Recent Updates
                      </CardTitle>
                      <CardDescription>Latest notifications from school</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {processedNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processedNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            notification.unread ? "bg-[hsl(var(--accent-iris))]/5" : "bg-muted/30"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              notification.type === "grade"
                                ? "bg-blue-500/20"
                                : notification.type === "message"
                                ? "bg-[hsl(var(--accent-violet))/0.2]"
                                : "bg-emerald-500/20"
                            }`}
                          >
                            {notification.type === "grade" ? (
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                            ) : notification.type === "message" ? (
                              <MessageSquare className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                            ) : (
                              <Award className="h-5 w-5 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{notification.title}</p>
                              {notification.unread && (
                                <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {notification.body}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming
                  </CardTitle>
                  <CardDescription>Important dates</CardDescription>
                </CardHeader>
                <CardContent>
                  {processedEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processedEvents.map((event, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--accent-iris))]/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-[hsl(var(--accent-iris))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link href="/parent/children">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--accent-iris))]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[hsl(var(--accent-iris))]" />
                </div>
                <div>
                  <p className="font-medium">My Children</p>
                  <p className="text-sm text-muted-foreground">View profiles</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/homework">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer relative">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Homework</p>
                  <p className="text-sm text-muted-foreground">View assignments</p>
                </div>
              </CardContent>
              {processedOverdueHomework.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                  {processedOverdueHomework.length}
                </Badge>
              )}
            </Card>
          </Link>

          <Link href="/parent/reports">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Report Cards</p>
                  <p className="text-sm text-muted-foreground">View reports</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/behavior">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">Behaviour</p>
                  <p className="text-sm text-muted-foreground">Merits & demerits</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/messages">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--accent-violet))/0.1] flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-[hsl(var(--accent-violet))]" />
                </div>
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">Contact teachers</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </Suspense>
    </div>
  );
}
