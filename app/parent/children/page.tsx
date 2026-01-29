import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Children | SchoolMatica Parent Portal",
  description: "View your children's academic profiles and progress.",
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

// Helper to determine trend based on mark history
function getTrend(marks: Array<{ rawMark: number | null; totalMark: number; createdAt: Date }>): "up" | "down" | "stable" {
  if (marks.length < 2) return "stable";
  
  const sortedMarks = [...marks]
    .filter((m) => m.rawMark !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  if (sortedMarks.length < 2) return "stable";
  
  const recentPercent = (sortedMarks[0].rawMark! / sortedMarks[0].totalMark) * 100;
  const previousPercent = (sortedMarks[1].rawMark! / sortedMarks[1].totalMark) * 100;
  
  const diff = recentPercent - previousPercent;
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "stable";
}

export default async function ChildrenPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Get parent user with all children data including subjects and marks
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
              marks: {
                include: {
                  assessment: {
                    include: {
                      assessmentPlan: {
                        include: {
                          classGroup: {
                            include: {
                              subject: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
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

  // Process children data for display
  const children = parentUser.contacts.map((contact) => {
    const student = contact.student;
    const marks = student.marks || [];

    // Group marks by subject and calculate averages
    const subjectMarks: Record<string, Array<{ rawMark: number | null; totalMark: number; createdAt: Date }>> = {};
    
    marks.forEach((mark) => {
      const subjectName = mark.assessment.assessmentPlan?.classGroup?.subject?.name || "Unknown Subject";
      if (!subjectMarks[subjectName]) {
        subjectMarks[subjectName] = [];
      }
      subjectMarks[subjectName].push({
        rawMark: mark.rawMark,
        totalMark: mark.assessment.totalMark,
        createdAt: mark.createdAt,
      });
    });

    // Calculate subject averages and trends
    const subjects = Object.entries(subjectMarks).map(([name, subjectMarkList]) => {
      const validMarks = subjectMarkList.filter((m) => m.rawMark !== null);
      let average = 0;
      if (validMarks.length > 0) {
        const totalPercent = validMarks.reduce((sum, m) => {
          return sum + ((m.rawMark || 0) / m.totalMark) * 100;
        }, 0);
        average = Math.round(totalPercent / validMarks.length);
      }
      
      return {
        name,
        average,
        trend: getTrend(subjectMarkList),
      };
    });

    // Calculate overall average
    let overallAverage = 0;
    if (subjects.length > 0) {
      const totalAvg = subjects.reduce((sum, s) => sum + s.average, 0);
      overallAverage = Math.round(totalAvg / subjects.length);
    }

    // Calculate attendance (placeholder - would need attendance tracking feature)
    const attendance = 95; // Placeholder until attendance tracking is implemented

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.classGroup.gradeLevel?.name || `Grade ${student.classGroup.grade}`,
      class: student.classGroup.name,
      school: student.classGroup.school.name,
      overallAverage,
      merits: student.behaviorBalance?.meritTotal || 0,
      demerits: student.behaviorBalance?.demeritTotal || 0,
      subjects: subjects.slice(0, 6), // Show top 6 subjects
      attendance,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground mt-1">
          View your children&apos;s academic profiles and track their progress.
        </p>
      </div>

      {children.length === 0 ? (
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
      ) : (
        <div className="space-y-6">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-iris))]/10 to-[hsl(var(--accent-violet))]/5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-bold text-xl">
                      {child.firstName[0]}{child.lastName[0]}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {child.firstName} {child.lastName}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {child.grade} • Class {child.class}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {child.school}
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/parent/children/${child.id}`}>
                      Full Profile
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[hsl(var(--accent-iris))]/10 text-center">
                    <GraduationCap className="h-5 w-5 mx-auto mb-2 text-[hsl(var(--accent-iris))]" />
                    <p className="text-2xl font-bold">{child.overallAverage}%</p>
                    <p className="text-xs text-muted-foreground">Overall Average</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
                    <Award className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{child.merits}</p>
                    <p className="text-xs text-muted-foreground">Merit Points</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{child.demerits}</p>
                    <p className="text-xs text-muted-foreground">Demerit Points</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{child.attendance}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                </div>

                {/* Subjects */}
                {child.subjects.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subject Performance
                    </h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {child.subjects.map((subject) => (
                        <div
                          key={subject.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div>
                            <p className="text-sm font-medium">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {subject.average}% average
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                subject.average >= 80
                                  ? "text-emerald-500"
                                  : subject.average >= 60
                                  ? "text-blue-500"
                                  : subject.average >= 50
                                  ? "text-amber-500"
                                  : "text-red-500"
                              }`}
                            >
                              {getAchievementLevel(subject.average)}
                            </span>
                            {subject.trend === "up" && (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            )}
                            {subject.trend === "down" && (
                              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No subject marks recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
