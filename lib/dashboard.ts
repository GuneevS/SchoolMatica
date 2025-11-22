import { prisma } from "@/lib/prisma";
import { calculateStudentSba } from "@/lib/calculations";

interface ClassSummary {
  id: string;
  name: string;
  subject: string;
  totalStudents: number;
  planStatus: string;
  averageSba: number | null;
  atRiskCount: number;
}

type RecentPlanSummary = {
  id: string;
  name: string;
  status: string;
  className: string;
  subjectName: string;
};

type OpenThreadSummary = {
  id: string;
  createdByRole: string;
  status: string;
  label: string;
};

type RegistrationSummary = {
  Draft: number;
  Submitted: number;
  InReview: number;
  Approved: number;
  Rejected: number;
};

export interface DashboardData {
  totals: {
    classes: number;
    students: number;
    averageSba: number;
    openThreads: number;
    pendingPlans: number;
  };
  classSummaries: ClassSummary[];
  recentPlans: RecentPlanSummary[];
  openThreads: OpenThreadSummary[];
  auditLogs: Awaited<ReturnType<typeof prisma.auditLog.findMany>>;
  registrations: RegistrationSummary;
}

export async function getDashboardData(schoolId: string): Promise<DashboardData> {
  const [classes, openThreadsCount, registrationCounts] = await Promise.all([
    prisma.classGroup.findMany({
      where: { schoolId },
      include: {
        subject: true,
        students: true,
        school: { include: { gradingConfig: true } },
        assessmentPlans: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            assessments: {
              include: { marks: true },
              orderBy: { sequence: "asc" },
            },
          },
        },
      },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.moderationThread.count({
      where: {
        status: "Open",
        OR: [
          { assessmentPlan: { classGroup: { schoolId } } },
          { assessment: { assessmentPlan: { classGroup: { schoolId } } } },
        ],
      },
    }),
    prisma.learnerRegistration.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { status: true },
    }),
  ]);

  const registrationSummary: RegistrationSummary = {
    Draft: 0,
    Submitted: 0,
    InReview: 0,
    Approved: 0,
    Rejected: 0,
  };
  for (const group of registrationCounts) {
    const status = group.status as keyof RegistrationSummary;
    if (registrationSummary[status] !== undefined) {
      registrationSummary[status] = group._count.status;
    }
  }

  const aggregatedSba: number[] = [];
  const classSummaries: ClassSummary[] = classes.map((classGroup) => {
    const plan = classGroup.assessmentPlans[0];
    const assessments = plan?.assessments ?? [];

    const studentValues: number[] = [];
    for (const student of classGroup.students) {
      if (!assessments.length) continue;
      const hasMarks = assessments.some((assessment) =>
        assessment.marks.some((mark) => mark.studentId === student.id && mark.rawMark != null && !mark.isAbsent),
      );
      if (!hasMarks) continue;
      const sba = calculateStudentSba({ assessments, studentId: student.id });
      studentValues.push(sba.sbaPercent);
    }

    if (studentValues.length) {
      aggregatedSba.push(...studentValues);
    }

    const averageSba = studentValues.length
      ? studentValues.reduce((sum, value) => sum + value, 0) / studentValues.length
      : null;
    const atRiskCount = studentValues.filter((value) => value < 40).length;

    return {
      id: classGroup.id,
      name: classGroup.name,
      subject: classGroup.subject.name,
      totalStudents: classGroup.students.length,
      planStatus: plan?.status ?? "No plan",
      averageSba,
      atRiskCount,
    };
  });

  const [recentPlansRaw, openThreadsRaw, auditLogs] = await Promise.all([
    prisma.assessmentPlan.findMany({
      where: { classGroup: { schoolId } },
      include: { classGroup: { include: { subject: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.moderationThread.findMany({
      where: {
        status: "Open",
        OR: [
          { assessmentPlan: { classGroup: { schoolId } } },
          { assessment: { assessmentPlan: { classGroup: { schoolId } } } },
        ],
      },
      include: {
        assessment: true,
        assessmentPlan: { include: { classGroup: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const recentPlans: RecentPlanSummary[] = recentPlansRaw.map((plan) => ({
    id: plan.id,
    name: plan.name,
    status: plan.status,
    className: plan.classGroup.name,
    subjectName: plan.classGroup.subject.name,
  }));

  const openThreads = openThreadsRaw.map((thread) => {
    const classGroupName = thread.assessmentPlan?.classGroup.name;
    const label = thread.assessment?.taskName ?? thread.assessmentPlan?.name ?? "Moderation thread";
    return {
      id: thread.id,
      createdByRole: thread.createdByRole,
      status: thread.status,
      label: classGroupName ? `${label} · ${classGroupName}` : label,
    };
  });

  const pendingPlans = classSummaries.filter((summary) => summary.planStatus === "PendingApproval").length;
  const totalStudents = classes.reduce((sum, item) => sum + item.students.length, 0);
  const averageSba = aggregatedSba.length
    ? aggregatedSba.reduce((sum, value) => sum + value, 0) / aggregatedSba.length
    : 0;

  return {
    totals: {
      classes: classes.length,
      students: totalStudents,
      averageSba,
      openThreads: openThreadsCount,
      pendingPlans,
    },
    classSummaries,
    recentPlans,
    openThreads,
    auditLogs,
    registrations: registrationSummary,
  };
}
