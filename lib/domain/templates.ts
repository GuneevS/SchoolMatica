import { prisma } from "@/lib/prisma";
import { normaliseWeights } from "@/lib/calculations";

export async function listCurriculumTemplates(schoolId?: string) {
  return prisma.curriculumTemplate.findMany({
    where: schoolId ? { schoolId } : undefined,
    include: {
      assessmentTemplates: {
        orderBy: { sequence: "asc" },
      },
    },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });
}

export type CurriculumTemplateInput = {
  schoolId?: string;
  name: string;
  subjectName: string;
  subjectCode: string;
  phase: string;
  grade: number;
  defaultTermCount: number;
  createdByRole: string;
  assessments: {
    taskName: string;
    term: string;
    totalMark: number;
    rawWeight: number;
    type?: string;
    isPatComponent?: boolean;
  }[];
};

export async function createCurriculumTemplate(input: CurriculumTemplateInput) {
  const normalised = normaliseWeights(input.assessments);
  return prisma.curriculumTemplate.create({
    data: {
      schoolId: input.schoolId,
      name: input.name,
      subjectName: input.subjectName,
      subjectCode: input.subjectCode,
      phase: input.phase,
      grade: input.grade,
      defaultTermCount: input.defaultTermCount,
      createdByRole: input.createdByRole,
      assessmentTemplates: {
        create: normalised.map((assessment, index) => ({
          taskName: assessment.taskName,
          term: assessment.term,
          totalMark: assessment.totalMark,
          rawWeight: assessment.rawWeight,
          sequence: index + 1,
          type: assessment.type,
          isPatComponent: assessment.isPatComponent ?? false,
        })),
      },
    },
    include: { assessmentTemplates: true },
  });
}

