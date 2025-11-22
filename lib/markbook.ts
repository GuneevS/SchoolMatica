import { prisma } from "@/lib/prisma";
import {
  calculateAssessmentWeightInsights,
  calculateFinalYearMark,
  calculateStudentSba,
  calculateTermPercentages,
  getBandsForPhase,
  mapPercentToLevel,
  type TermWeights,
} from "@/lib/calculations";

export type MarkbookStats = {
  capturedMarks: number;
  totalMarks: number;
  atRiskLearners: number;
  averageSba: number;
  averagePat: number;
  averageFinal: number;
  hasTermWeights: boolean;
};

export async function getClassMarkbookPayload(classId: string, assessmentPlanId?: string) {
  if (!classId) {
    return null;
  }

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    include: {
      subject: true,
      school: { include: { gradingConfig: true } },
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  if (!classGroup) {
    return null;
  }

  const availablePlans = await prisma.assessmentPlan.findMany({
    where: { classGroupId: classId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      year: true,
      termCount: true,
    },
  });

  const selectedPlan = assessmentPlanId
    ? await prisma.assessmentPlan.findFirst({
        where: { id: assessmentPlanId, classGroupId: classId },
        include: {
          assessments: {
            orderBy: { sequence: "asc" },
            include: { marks: true },
          },
          documents: true,
          snapshots: true,
        },
      })
    : await prisma.assessmentPlan.findFirst({
        where: { classGroupId: classId },
        orderBy: { createdAt: "desc" },
        include: {
          assessments: {
            orderBy: { sequence: "asc" },
            include: { marks: true },
          },
          documents: true,
          snapshots: true,
        },
      });

  const assessments = selectedPlan?.assessments ?? [];
  const termWeights = (selectedPlan?.termWeights as TermWeights | null) ?? null;
  const weightInsights = assessments.length
    ? calculateAssessmentWeightInsights({ assessments, termWeights })
    : null;
  const gradingConfig = classGroup.school?.gradingConfig ?? null;
  const subjectPhase = classGroup.subject?.phase ?? "default";
  const bands = getBandsForPhase(gradingConfig, subjectPhase);

  const rows = classGroup.students.map((student) => {
    const sba = calculateStudentSba({ assessments, studentId: student.id });
    const terms = calculateTermPercentages({ assessments, studentId: student.id });
    const finalYear = assessments.length
      ? calculateFinalYearMark({ assessments, studentId: student.id, termWeights })
      : null;
    const band = mapPercentToLevel(sba.sbaPercent, bands);
    const assessmentMarks = assessments.map((assessment) => {
      const mark = assessment.marks.find((m) => m.studentId === student.id);
      return {
        assessmentId: assessment.id,
        rawMark: mark?.rawMark ?? null,
        isAbsent: mark?.isAbsent ?? false,
        absenceCode: mark?.absenceCode ?? null,
        totalMark: assessment.totalMark,
      };
    });

    return {
      student,
      marks: assessmentMarks,
      sbaPercent: Number(sba.sbaPercent.toFixed(2)) || 0,
      componentBreakdown: sba.componentBreakdown,
      level: band.level,
      descriptor: band.descriptor,
      termPercents: {
        T1: Number((terms.T1 ?? 0).toFixed(2)),
        T2: Number((terms.T2 ?? 0).toFixed(2)),
        T3: Number((terms.T3 ?? 0).toFixed(2)),
        T4: Number((terms.T4 ?? 0).toFixed(2)),
      },
      finalYearPercent: Number(finalYear?.finalMark?.toFixed(2) ?? 0),
      termResults: finalYear?.termResults ?? {},
      appliedTermWeights: finalYear?.appliedWeights ?? termWeights ?? {},
    };
  });

  const totalMarks = classGroup.students.length * assessments.length;
  const capturedMarks = rows.reduce((sum, row) => {
    const captured = row.marks.filter((mark) => mark.rawMark !== null || mark.isAbsent).length;
    return sum + captured;
  }, 0);
  const atRiskLearners = rows.filter((row) => row.sbaPercent > 0 && row.sbaPercent < 40).length;
  const averageSba = rows.length
    ? rows.reduce((sum, row) => sum + row.sbaPercent, 0) / rows.length
    : 0;
  const averagePat = rows.length
    ? rows.reduce((sum, row) => sum + row.componentBreakdown.patPercent, 0) / rows.length
    : 0;
  const averageFinal = rows.length
    ? rows.reduce((sum, row) => sum + row.finalYearPercent, 0) / rows.length
    : 0;
  const hasTermWeights = Boolean(termWeights && Object.values(termWeights).some((value) => value > 0));

  return {
    classGroup,
    assessmentPlan: selectedPlan ?? null,
    assessments,
    rows,
    availablePlans,
    stats: {
      capturedMarks,
      totalMarks,
      atRiskLearners,
      averageSba,
      averagePat,
      averageFinal,
      hasTermWeights,
    },
    documents: selectedPlan?.documents ?? [],
    snapshots: selectedPlan?.snapshots ?? [],
    weightInsights,
    termWeights,
  };
}

export type MarkbookPayload = NonNullable<Awaited<ReturnType<typeof getClassMarkbookPayload>>>;
