import { prisma } from "@/lib/prisma";
import { normaliseWeights, normaliseWeightsPerTerm } from "@/lib/calculations";

/**
 * Recalculates weight percentages for all assessments in a plan
 * 
 * @param planId - The assessment plan ID
 * @param options.perTerm - If true (default), normalizes weights per-term so each term sums to 100%
 *                          If false, normalizes globally across all assessments
 */
export async function recalculateWeightsForPlan(
  planId: string, 
  options: { perTerm?: boolean } = {}
) {
  const { perTerm = true } = options; // Default to per-term normalization (CAPS compliant)
  
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: { assessments: true },
  });

  if (!plan || plan.assessments.length === 0) return;

  // Use per-term normalization by default for CAPS compliance
  // Each term's assessments will sum to 100% independently
  const normalised = perTerm 
    ? normaliseWeightsPerTerm(plan.assessments)
    : normaliseWeights(plan.assessments);
    
  await Promise.all(
    normalised.map((assessment) =>
      prisma.assessment.update({
        where: { id: assessment.id },
        data: { weightPercent: assessment.weightPercent },
      }),
    ),
  );
}

export async function reorderAssessments(planId: string, orderedIds: string[]) {
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: { assessments: true },
  });
  if (!plan) {
    throw new Error("Assessment plan not found");
  }
  if (["Locked"].includes(plan.status)) {
    throw new Error("Locked plans cannot be reordered");
  }

  const orderMap = new Map<string, number>();
  orderedIds.forEach((id, index) => orderMap.set(id, index));

  const nextAssessments = [...plan.assessments].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : a.sequence;
    const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : b.sequence;
    return orderA - orderB;
  });

  await prisma.$transaction(
    nextAssessments.map((assessment, index) =>
      prisma.assessment.update({
        where: { id: assessment.id },
        data: { sequence: index + 1 },
      }),
    ),
  );

  await recalculateWeightsForPlan(planId);
}

export async function cloneTemplateToPlan(args: {
  templateId: string;
  classGroupId: string;
  year: number;
  name?: string;
}) {
  const { templateId, classGroupId, year, name } = args;
  const template = await prisma.curriculumTemplate.findUnique({
    where: { id: templateId },
    include: { assessmentTemplates: { orderBy: { sequence: "asc" } } },
  });
  if (!template) {
    throw new Error("Template not found");
  }

  const plan = await prisma.assessmentPlan.create({
    data: {
      name: name ?? `${year} ${template.name}`,
      year,
      termCount: template.defaultTermCount,
      status: "Draft",
      classGroupId,
      templateId,
      assessments: {
        create: template.assessmentTemplates.map((assessment) => ({
          taskName: assessment.taskName,
          term: assessment.term,
          totalMark: assessment.totalMark,
          rawWeight: assessment.rawWeight,
          weightPercent: 0,
          sequence: assessment.sequence,
          type: assessment.type,
          status: "Draft",
          isPatComponent: assessment.isPatComponent,
        })),
      },
    },
    include: { assessments: true },
  });

  await recalculateWeightsForPlan(plan.id);
  return plan;
}
