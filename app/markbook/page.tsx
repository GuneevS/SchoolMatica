import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { BookOpenCheck, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function MarkbookPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access the markbook.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Select or create a school to continue.</p>
      </div>
    );
  }

  // Get classes with assessment plans and mark statistics
  const classes = await prisma.classGroup.findMany({
    where: { schoolId: school.id },
    include: {
      subject: true,
      primaryTeacher: true,
      _count: { select: { students: true } },
      assessmentPlans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          assessments: {
            include: {
              _count: { select: { marks: true } },
            },
          },
        },
      },
    },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  // Calculate statistics
  const totalClasses = classes.length;
  const classesWithPlans = classes.filter((c) => c.assessmentPlans.length > 0).length;
  const totalStudents = classes.reduce((sum: number, c) => sum + c._count.students, 0);
  
  // Calculate mark completion across all classes
  let totalMarksExpected = 0;
  let totalMarksCaptured = 0;
  
  classes.forEach((classGroup) => {
    const plan = classGroup.assessmentPlans[0];
    if (plan) {
      const studentCount = classGroup._count.students;
      plan.assessments.forEach((assessment) => {
        totalMarksExpected += studentCount;
        totalMarksCaptured += assessment._count.marks;
      });
    }
  });
  
  const overallCompletion = totalMarksExpected > 0 
    ? Math.round((totalMarksCaptured / totalMarksExpected) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Assessment Tracking"
        title={
          <>
            <span className="gradient-text">Markbook</span> Overview
          </>
        }
        description="View and manage marks across all your classes. Select a class to enter marks, view student performance, and track assessment completion."
        badges={[
          { label: `${totalClasses} classes`, color: "hsl(var(--accent-iris))" },
          { label: `${totalStudents} learners`, color: "hsl(var(--accent-mint))" },
          { label: `${overallCompletion}% complete`, color: "hsl(var(--accent-gold))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Mark capture status"
            icon={<BookOpenCheck className="h-4 w-4" />}
            metrics={[
              { label: "Classes with plans", value: `${classesWithPlans}/${totalClasses}`, accent: "highlight" },
              { label: "Marks captured", value: totalMarksCaptured.toString() },
              { label: "Expected marks", value: totalMarksExpected.toString() },
              { label: "Completion", value: `${overallCompletion}%` },
            ]}
          />
        }
      />

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpenCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">No classes found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Create classes and assessment plans to start capturing marks.
            </p>
            <Button asChild className="mt-4">
              <Link href="/classes">Go to Classes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classGroup) => {
            const plan = classGroup.assessmentPlans[0];
            const studentCount = classGroup._count.students;
            
            // Calculate completion for this class
            let classMarksExpected = 0;
            let classMarksCaptured = 0;
            
            if (plan) {
              plan.assessments.forEach((assessment) => {
                classMarksExpected += studentCount;
                classMarksCaptured += assessment._count.marks;
              });
            }
            
            const classCompletion = classMarksExpected > 0 
              ? Math.round((classMarksCaptured / classMarksExpected) * 100) 
              : 0;
            
            const hasLowCompletion = classCompletion < 50 && classMarksExpected > 0;

            return (
              <Card 
                key={classGroup.id} 
                className={`rounded-[20px] border transition-all hover:shadow-lg ${
                  hasLowCompletion ? 'border-amber-500/50' : 'border-[hsl(var(--border-strong))/0.6]'
                } bg-[hsl(var(--surface-strong))]`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Grade {classGroup.grade}
                      </p>
                      <CardTitle className="text-lg mt-1">{classGroup.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classGroup.subject?.name ?? "No Subject"}
                      </p>
                    </div>
                    {plan && <StatusBadge status={plan.status} />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                      <p className="text-lg font-semibold mt-1">{studentCount}</p>
                      <p className="text-xs text-muted-foreground">Learners</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground" />
                      <p className="text-lg font-semibold mt-1">{plan?.assessments.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div className={`rounded-lg p-2 ${hasLowCompletion ? 'bg-amber-500/10' : 'bg-muted/50'}`}>
                      {hasLowCompletion ? (
                        <AlertTriangle className="h-4 w-4 mx-auto text-amber-500" />
                      ) : (
                        <BookOpenCheck className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                      <p className={`text-lg font-semibold mt-1 ${hasLowCompletion ? 'text-amber-600' : ''}`}>
                        {classCompletion}%
                      </p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  {plan && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Mark capture progress</span>
                        <span>{classMarksCaptured}/{classMarksExpected}</span>
                      </div>
                      <Progress value={classCompletion} className="h-2" />
                    </div>
                  )}

                  {classGroup.primaryTeacher && (
                    <p className="text-xs text-muted-foreground">
                      Teacher: {classGroup.primaryTeacher.firstName} {classGroup.primaryTeacher.lastName}
                    </p>
                  )}

                  <Button asChild className="w-full" variant={plan ? "default" : "outline"}>
                    <Link href={`/classes/${classGroup.id}`}>
                      {plan ? "Open Markbook" : "View Class"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
