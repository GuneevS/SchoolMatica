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

export function normaliseWeights<T extends { rawWeight: number }>(
  assessments: T[],
  options: { precision?: number } = {},
) {
  const precision = options.precision ?? 1;
  const totalRaw = assessments.reduce((sum, item) => sum + (item.rawWeight || 0), 0);
  if (totalRaw === 0) {
    return assessments.map((assessment) => ({ ...assessment, weightPercent: 0 }));
  }
  return assessments.map((assessment) => {
    const weight = (assessment.rawWeight / totalRaw) * 100;
    const rounded = Number(weight.toFixed(precision));
    return {
      ...assessment,
      weightPercent: rounded,
    };
  });
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

export function calculateStudentSba(args: {
  assessments: (Assessment & { marks: Mark[] })[];
  studentId: string;
  termWeights?: TermWeights | null;
}) {
  const { assessments, studentId } = args;
  const usable = assessments
    .map((assessment) => {
      const mark = assessment.marks.find((m) => m.studentId === studentId);
      if (!mark || mark.isAbsent || mark.rawMark == null) {
        return null;
      }
      const percent = (mark.rawMark / assessment.totalMark) * 100;
      const weight = assessment.termWeightOverride ?? assessment.weightPercent;
      return {
        assessment,
        percent,
        weightPercent: weight,
      };
    })
    .filter(Boolean) as {
      assessment: Assessment;
      percent: number;
      weightPercent: number;
    }[];

  const totalWeight = usable.reduce((sum, item) => sum + item.weightPercent, 0);
  if (totalWeight === 0) {
    return { sbaPercent: 0, componentBreakdown: { patPercent: 0, schoolBasedPercent: 0 } };
  }

  const sbaPercent = usable.reduce((sum, item) => {
    const adjustedWeight = (item.weightPercent / totalWeight) * 100;
    return sum + (item.percent * adjustedWeight) / 100;
  }, 0);

  const patWeights = usable.filter((item) => item.assessment.isPatComponent);
  const patWeightTotal = patWeights.reduce((sum, item) => sum + item.weightPercent, 0);
  const patPercent =
    patWeightTotal === 0
      ? 0
      : patWeights.reduce((sum, item) => {
          const adjustedWeight = (item.weightPercent / patWeightTotal) * 100;
          return sum + (item.percent * adjustedWeight) / 100;
        }, 0);

  const schoolBasedWeight = totalWeight - patWeightTotal;
  const schoolBasedPercent =
    schoolBasedWeight === 0
      ? sbaPercent
      : usable
          .filter((item) => !item.assessment.isPatComponent)
          .reduce((sum, item) => {
            const adjustedWeight = (item.weightPercent / schoolBasedWeight) * 100;
            return sum + (item.percent * adjustedWeight) / 100;
          }, 0);

  return {
    sbaPercent,
    componentBreakdown: {
      patPercent,
      schoolBasedPercent,
    },
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
