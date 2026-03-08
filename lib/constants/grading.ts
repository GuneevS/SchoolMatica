/**
 * CAPS (Curriculum and Assessment Policy Statement) Grading Constants
 * Single source of truth for South African education grading bands and phase mappings.
 */

// Grade R is stored as 0 in the database (ClassGroup.grade is Int)
export const GRADE_R = 0;

export interface GradingBand {
  minPercent: number;
  level: number;
  descriptor: string;
}

export type SchoolPhase = "Foundation" | "Intermediate" | "Senior" | "FET";

/**
 * Official CAPS grading bands by school phase.
 *
 * FET/Senior/Intermediate: 7-point scale (Level 1-7)
 * Foundation: 4-point scale (Level 1-4)
 *
 * CRITICAL: Level 2 starts at 30% (NOT 40%). Level 7 starts at 80% (NOT 90%).
 */
export const DEFAULT_GRADING_BANDS: Record<string, GradingBand[]> = {
  FET: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 30, level: 2, descriptor: "Elementary Achievement" },
    { minPercent: 40, level: 3, descriptor: "Moderate Achievement" },
    { minPercent: 50, level: 4, descriptor: "Adequate Achievement" },
    { minPercent: 60, level: 5, descriptor: "Substantial Achievement" },
    { minPercent: 70, level: 6, descriptor: "Meritorious Achievement" },
    { minPercent: 80, level: 7, descriptor: "Outstanding Achievement" },
  ],
  Senior: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 30, level: 2, descriptor: "Elementary Achievement" },
    { minPercent: 40, level: 3, descriptor: "Moderate Achievement" },
    { minPercent: 50, level: 4, descriptor: "Adequate Achievement" },
    { minPercent: 60, level: 5, descriptor: "Substantial Achievement" },
    { minPercent: 70, level: 6, descriptor: "Meritorious Achievement" },
    { minPercent: 80, level: 7, descriptor: "Outstanding Achievement" },
  ],
  Intermediate: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 30, level: 2, descriptor: "Elementary Achievement" },
    { minPercent: 40, level: 3, descriptor: "Moderate Achievement" },
    { minPercent: 50, level: 4, descriptor: "Adequate Achievement" },
    { minPercent: 60, level: 5, descriptor: "Substantial Achievement" },
    { minPercent: 70, level: 6, descriptor: "Meritorious Achievement" },
    { minPercent: 80, level: 7, descriptor: "Outstanding Achievement" },
  ],
  Foundation: [
    { minPercent: 0, level: 1, descriptor: "Not Yet Achieved" },
    { minPercent: 35, level: 2, descriptor: "Partially Achieved" },
    { minPercent: 50, level: 3, descriptor: "Achieved" },
    { minPercent: 70, level: 4, descriptor: "Outstanding" },
  ],
  default: [
    { minPercent: 0, level: 1, descriptor: "Not Achieved" },
    { minPercent: 30, level: 2, descriptor: "Elementary" },
    { minPercent: 40, level: 3, descriptor: "Moderate" },
    { minPercent: 50, level: 4, descriptor: "Adequate" },
    { minPercent: 60, level: 5, descriptor: "Substantial" },
    { minPercent: 70, level: 6, descriptor: "Meritorious" },
    { minPercent: 80, level: 7, descriptor: "Outstanding" },
  ],
};

/**
 * Map a numeric grade (from ClassGroup.grade) to its SA school phase.
 * Grade R (0) -> Foundation, 1-3 -> Foundation, 4-6 -> Intermediate, 7-9 -> Senior, 10-12 -> FET
 */
export function getPhaseForGradeNum(grade: number): SchoolPhase {
  if (grade <= 3) return "Foundation";  // 0 (Grade R), 1, 2, 3
  if (grade <= 6) return "Intermediate"; // 4, 5, 6
  if (grade <= 9) return "Senior";       // 7, 8, 9
  return "FET";                          // 10, 11, 12
}

/**
 * Get the CAPS grading bands for a specific phase.
 * Falls back to default bands if the phase is not recognized.
 */
export function getBandsForPhase(phase: string): GradingBand[] {
  return DEFAULT_GRADING_BANDS[phase] ?? DEFAULT_GRADING_BANDS.default;
}

/**
 * Get the at-risk threshold percentage for a given phase.
 * This is the minimum percentage for Level 2 (the lowest passing level).
 * Foundation Phase: 35%, Others: 30%
 */
export function getAtRiskThreshold(phase: string, bands?: GradingBand[]): number {
  const phaseBands = bands ?? getBandsForPhase(phase);
  // Level 2 is the first "passing" level - its minPercent is the at-risk boundary
  const level2 = phaseBands.find((b) => b.level === 2);
  return level2?.minPercent ?? 30;
}

/**
 * Get the grading level and descriptor for a given percentage and phase.
 */
export function getLevelForPercent(
  percent: number,
  phase: string,
  bands?: GradingBand[]
): { level: number; descriptor: string } {
  const phaseBands = bands ?? getBandsForPhase(phase);
  // Sort descending by minPercent and find the first band where percent >= minPercent
  const sorted = [...phaseBands].sort((a, b) => b.minPercent - a.minPercent);
  const band = sorted.find((b) => percent >= b.minPercent);
  return band ?? { level: 1, descriptor: "Not Achieved" };
}
