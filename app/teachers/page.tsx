import { prisma } from "@/lib/prisma";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { GraduationCap } from "lucide-react";
import { TeacherManager } from "@/components/teachers/teacher-manager";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";

export default async function TeachersPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access teachers.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Create one from the Schools workspace to get started.</p>
      </div>
    );
  }

  const [teachers, classes, subjects] = await Promise.all([
    prisma.teacher.findMany({
      where: { schoolId: school.id },
      include: {
        classAssignments: {
          include: { classGroup: true },
        },
        subjectAssignments: {
          include: { subject: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.classGroup.findMany({
      where: { schoolId: school.id },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({ where: { schoolId: school.id }, orderBy: { name: "asc" } }),
  ]);

  const leadCount = teachers.filter((teacher) =>
    teacher.classAssignments.some((assignment) => assignment.role === "Lead"),
  ).length;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Faculty"
        title={
          <>
            Teacher <span className="gradient-text">directory</span>
          </>
        }
        description={`Onboard teachers, track their class assignments, and link them to ${school.name}'s grade and subject structure.`}
        badges={[
          { label: `${teachers.length} teachers`, color: "hsl(var(--accent-iris))" },
          { label: `${leadCount} lead teachers`, color: "hsl(var(--accent-mint))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Faculty coverage"
            icon={<GraduationCap className="h-4 w-4" />}
            metrics={[
              { label: "Classes covered", value: classes.length.toString(), accent: "highlight" },
              { label: "Subjects", value: subjects.length.toString() },
              { label: "Lead teachers", value: leadCount.toString() },
            ]}
          />
        }
      />

      <TeacherManager
        teachers={teachers}
        classes={classes.map((item) => ({ id: item.id, name: item.name }))}
        subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
        schoolId={school.id}
      />
    </div>
  );
}

