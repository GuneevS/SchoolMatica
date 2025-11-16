import type {
  Assessment,
  GradingConfig,
  Mark,
} from "@prisma/client";

export type LevelBand = {
  minPercent: number;
  level: number;
  descriptor: string;
};

export type TermWeights = Record<string, number>;

/**
 * Normalizes raw weights to percentages that sum to 100%
 * Uses high-precision rounding with remainder distribution to ensure exact 100% total
 */
export function normaliseWeights<T extends { rawWeight: number }>(
  assessments: T[],
  options: { precision?: number } = {},
) {
  const precision = options.precision ?? 2; // Increased default precision to 2 decimal places
  const totalRaw = assessments.reduce((sum, item) => sum + (item.rawWeight || 0), 0);
  
  // Handle edge case: no weights
  if (totalRaw === 0 || assessments.length === 0) {
    return assessments.map((assessment) => ({ ...assessment, weightPercent: 0 }));
  }
  
  // Calculate initial weights with high precision
  const withWeights = assessments.map((assessment) => {
    const weight = (assessment.rawWeight / totalRaw) * 100;
    const rounded = Number(weight.toFixed(precision));
    return {
      ...assessment,
      weightPercent: rounded,
      _exactWeight: weight, // Store exact value for remainder calculation
    };
  });
  
  // Calculate rounding error and distribute it
  const sum = withWeights.reduce((acc, item) => acc + item.weightPercent, 0);
  const diff = Number((100 - sum).toFixed(precision));
  
  // If there's a rounding difference, add it to the largest weight
  if (Math.abs(diff) > 0) {
    const largest = withWeights.reduce((max, item, idx) => 
      item.weightPercent > withWeights[max].weightPercent ? idx : max, 0
    );
    withWeights[largest].weightPercent = Number(
      (withWeights[largest].weightPercent + diff).toFixed(precision)
    );
  }
  
  // Remove temporary exact weight property
  return withWeights.map(({ _exactWeight, ...rest }) => rest);
}

export function getBandsForPhase(config: GradingConfig | null, phase: string) {
  if (!config) return [] as LevelBand[];
  const phases = config.phasesJson as Record<string, LevelBand[]>;
  const bands = phases?.[phase] ?? phases?.default ?? [];
  return [...bands].sort((a, b) => a.minPercent - b.minPercent);
}

export function mapPercentToLevel(percent: number, bands: LevelBand[]) {
  if (!bands.length) {
    return { level: 0, descriptor: "" };
  }
  let result = bands[0];
  for (const band of bands) {
    if (percent >= band.minPercent) {
      result = band;
    }
  }
  return result;
}

/**
 * Calculates a student's School-Based Assessment (SBA) percentage
 * 
 * Key features:
 * - Handles absent marks (excluded from calculation)
 * - Renormalizes weights when assessments are missing
 * - Separates PAT (Practical Assessment Task) from school-based components
 * - Uses high-precision arithmetic with proper rounding
 * 
 * @param args.assessments - All assessments with their marks
 * @param args.studentId - The student to calculate for
 * @param args.termWeights - Optional term-specific weight overrides
 * @returns SBA percentage and component breakdown
 */
export function calculateStudentSba(args: {
  assessments: (Assessment & { marks: Mark[] })[];
  studentId: string;
  termWeights?: TermWeights | null;
}) {
  const { assessments, studentId } = args;
  
  // Filter to only assessments where student has a valid mark
  const usable = assessments
    .map((assessment) => {
      const mark = assessment.marks.find((m) => m.studentId === studentId);
      
      // Skip if no mark, absent, or null raw mark
      if (!mark || mark.isAbsent || mark.rawMark == null) {
        return null;
      }
      
      // Validate mark is within bounds
      if (mark.rawMark < 0 || mark.rawMark > assessment.totalMark) {
        console.warn(`Invalid mark for student ${studentId}, assessment ${assessment.id}: ${mark.rawMark}/${assessment.totalMark}`);
        return null;
      }
      
      // Calculate percentage with high precision
      const percent = (mark.rawMark / assessment.totalMark) * 100;
      const weight = assessment.termWeightOverride ?? assessment.weightPercent;
      
      return {
        assessment,
        percent: Number(percent.toFixed(4)), // High precision for intermediate calculations
        weightPercent: weight,
      };
    })
    .filter(Boolean) as {
      assessment: Assessment;
      percent: number;
      weightPercent: number;
    }[];

  // Handle edge case: no valid marks
  const totalWeight = usable.reduce((sum, item) => sum + item.weightPercent, 0);
  if (totalWeight === 0 || usable.length === 0) {
    return { 
      sbaPercent: 0, 
      componentBreakdown: { patPercent: 0, schoolBasedPercent: 0 },
      assessmentCount: 0,
      totalPossibleWeight: assessments.reduce((sum, a) => sum + a.weightPercent, 0),
    };
  }

  // Calculate overall SBA with weight renormalization
  const sbaPercent = usable.reduce((sum, item) => {
    const adjustedWeight = (item.weightPercent / totalWeight) * 100;
    return sum + (item.percent * adjustedWeight) / 100;
  }, 0);

  // Calculate PAT component separately
  const patWeights = usable.filter((item) => item.assessment.isPatComponent);
  const patWeightTotal = patWeights.reduce((sum, item) => sum + item.weightPercent, 0);
  const patPercent =
    patWeightTotal === 0
      ? 0
      : patWeights.reduce((sum, item) => {
          const adjustedWeight = (item.weightPercent / patWeightTotal) * 100;
          return sum + (item.percent * adjustedWeight) / 100;
        }, 0);

  // Calculate school-based component (non-PAT)
  const schoolBasedWeights = usable.filter((item) => !item.assessment.isPatComponent);
  const schoolBasedWeight = schoolBasedWeights.reduce((sum, item) => sum + item.weightPercent, 0);
  const schoolBasedPercent =
    schoolBasedWeight === 0
      ? 0
      : schoolBasedWeights.reduce((sum, item) => {
          const adjustedWeight = (item.weightPercent / schoolBasedWeight) * 100;
          return sum + (item.percent * adjustedWeight) / 100;
        }, 0);

  return {
    sbaPercent: Number(sbaPercent.toFixed(2)),
    componentBreakdown: {
      patPercent: Number(patPercent.toFixed(2)),
      schoolBasedPercent: Number(schoolBasedPercent.toFixed(2)),
    },
    assessmentCount: usable.length,
    totalPossibleWeight: assessments.reduce((sum, a) => sum + a.weightPercent, 0),
  };
}

export function calculateTermPercentages(args: {
  assessments: (Assessment & { marks: Mark[] })[];
  studentId: string;
}) {
  const { assessments, studentId } = args;
  const terms = new Map<string, { total: number; weighted: number }>();

  for (const assessment of assessments) {
    const mark = assessment.marks.find((m) => m.studentId === studentId);
    if (!mark || mark.isAbsent || mark.rawMark == null) continue;
    const percent = (mark.rawMark / assessment.totalMark) * 100;
    const weight = assessment.termWeightOverride ?? assessment.weightPercent;
    const bucket = terms.get(assessment.term) || { total: 0, weighted: 0 };
    bucket.total += weight;
    bucket.weighted += percent * weight;
    terms.set(assessment.term, bucket);
  }

  const result: Record<string, number> = {};
  for (const [term, { total, weighted }] of terms.entries()) {
    result[term] = total === 0 ? 0 : weighted / total;
  }
  return result;
}

export function buildMarkSnapshot(args: {
  assessmentPlanId: string;
  studentId: string;
  term: string;
  assessments: (Assessment & { marks: Mark[] })[];
  gradingConfig: GradingConfig | null;
  phase: string;
}) {
  const { assessmentPlanId, studentId, term, assessments, gradingConfig, phase } = args;
  const bands = getBandsForPhase(gradingConfig, phase);
  const filtered = assessments.filter((assessment) => assessment.term === term);
  const sba = calculateStudentSba({ assessments: filtered, studentId });
  const terms = calculateTermPercentages({ assessments: filtered, studentId });
  const level = mapPercentToLevel(sba.sbaPercent, bands);

  return {
    assessmentPlanId,
    studentId,
    term,
    sbaPercent: Number(sba.sbaPercent.toFixed(2)),
    termPercent: Number((terms[term] ?? 0).toFixed(2)),
    level: level.level,
  };
}
