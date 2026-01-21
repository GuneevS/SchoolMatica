/**
 * Demo Data Generator
 *
 * Generates realistic, CAPS-compliant demo data for landing page
 * interactive showcases. All data is sanitized and safe for public display.
 *
 * Features:
 * - Authentic South African student names
 * - CAPS-aligned assessment structures
 * - Varied performance distributions
 * - Realistic moderation workflows
 * - Multi-term data structures
 */

// ============================================
// Type Definitions
// ============================================

export interface DemoStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: "Male" | "Female";
}

export interface DemoAssessment {
  id: string;
  taskName: string;
  term: string;
  termNumber: number;
  totalMark: number;
  weightPercent: number;
  type: "Test" | "Assignment" | "Exam" | "Project" | "PAT";
  dueDate: Date;
  status: "Draft" | "Active" | "Locked";
  category?: string;
  sequence?: number;
}

export interface DemoMark {
  id: string;
  assessmentId: string;
  studentId: string;
  rawMark: number | null;
  percentage: number | null;
  isAbsent: boolean;
  absenceCode?: string;
  status: "Draft" | "Submitted" | "Approved";
}

export interface DemoTermWeights {
  term1: number;
  term2: number;
  term3: number;
  term4: number;
}

export interface DemoAssessmentPlan {
  id: string;
  name: string;
  year: number;
  termCount: number;
  status: "Draft" | "PendingApproval" | "Approved" | "Locked";
  termWeights: DemoTermWeights;
  assessments: DemoAssessment[];
  marks: DemoMark[];
}

export interface DemoModerationComment {
  id: string;
  authorRole: "Teacher" | "HOD" | "SMT" | "Principal";
  authorName: string;
  message: string;
  createdAt: Date;
}

export interface DemoModerationThread {
  id: string;
  title: string;
  kind: "plan" | "assessment" | "moderation";
  status: "Open" | "PendingReview" | "ChangesRequested" | "Approved" | "Rejected";
  createdByRole: string;
  comments: DemoModerationComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoClassPerformance {
  className: string;
  averagePercentage: number;
  studentCount: number;
  passingCount: number;
  excellentCount: number; // >80%
  moderateCount: number; // 50-80%
  atRiskCount: number; // <50%
}

export interface DemoMarkbookData {
  students: DemoStudent[];
  assessments: DemoAssessment[];
  marks: DemoMark[];
  termWeights: DemoTermWeights;
}

// ============================================
// Realistic South African Names
// ============================================

const SOUTH_AFRICAN_FIRST_NAMES = {
  male: [
    "Thabo", "Sipho", "Bongani", "Mandla", "Themba",
    "Lebogang", "Tshepo", "Katlego", "Mpho", "Kagiso",
    "Lerato", "Neo", "Rethabile", "Keitumetse", "Mothusi",
  ],
  female: [
    "Nomsa", "Thandi", "Zanele", "Precious", "Ntombi",
    "Lebohang", "Refilwe", "Dikeledi", "Boitumelo", "Keabetswe",
    "Naledi", "Karabo", "Kgomotso", "Tshegofatso", "Amogelang",
  ],
};

const SOUTH_AFRICAN_LAST_NAMES = [
  "Nkosi", "Dlamini", "Mokoena", "Mthembu", "Mahlangu",
  "Zulu", "Ngcobo", "Khumalo", "Sithole", "Naidoo",
  "Molefe", "Radebe", "Hlophe", "Zwane", "Maseko",
];

// ============================================
// CAPS-Compliant Assessment Structures
// ============================================

/**
 * CAPS-compliant assessment structure for High School Mathematics
 * Based on South African CAPS requirements
 */
const CAPS_MATH_ASSESSMENTS = {
  term1: [
    { name: "Test 1: Algebra & Equations", weight: 15, type: "Test" as const, totalMark: 50 },
    { name: "Assignment 1: Problem Solving", weight: 10, type: "Assignment" as const, totalMark: 30 },
    { name: "Examination: Term 1", weight: 25, type: "Exam" as const, totalMark: 100 },
  ],
  term2: [
    { name: "Test 2: Functions & Graphs", weight: 15, type: "Test" as const, totalMark: 50 },
    { name: "Project: Real-World Math", weight: 10, type: "Project" as const, totalMark: 40 },
    { name: "Examination: Mid-Year", weight: 25, type: "Exam" as const, totalMark: 100 },
  ],
  term3: [
    { name: "Test 3: Trigonometry", weight: 15, type: "Test" as const, totalMark: 50 },
    { name: "Assignment 2: Data Handling", weight: 10, type: "Assignment" as const, totalMark: 30 },
    { name: "PAT: Practical Assessment Task", weight: 10, type: "PAT" as const, totalMark: 50 },
  ],
  term4: [
    { name: "Test 4: Revision", weight: 10, type: "Test" as const, totalMark: 50 },
    { name: "Trial Examination", weight: 15, type: "Exam" as const, totalMark: 100 },
    { name: "Final Examination", weight: 30, type: "Exam" as const, totalMark: 150 },
  ],
};

// ============================================
// Data Generators
// ============================================

/**
 * Generates a random ID (mimics cuid format)
 */
function generateId(prefix: string = ""): string {
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}${random}${Date.now().toString(36)}`;
}

/**
 * Generates realistic South African student data
 *
 * @param count - Number of students to generate (default: 12)
 * @returns Array of demo students with varied demographics
 */
export function generateDemoStudents(count: number = 12): DemoStudent[] {
  const students: DemoStudent[] = [];
  const genders: Array<"Male" | "Female"> = ["Male", "Female"];

  for (let i = 0; i < count; i++) {
    const gender = genders[i % 2]; // Alternate for variety
    const firstNames = gender === "Male"
      ? SOUTH_AFRICAN_FIRST_NAMES.male
      : SOUTH_AFRICAN_FIRST_NAMES.female;

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = SOUTH_AFRICAN_LAST_NAMES[Math.floor(Math.random() * SOUTH_AFRICAN_LAST_NAMES.length)];

    students.push({
      id: generateId("student_"),
      firstName,
      lastName,
      admissionNumber: `2024${String(1000 + i).padStart(4, "0")}`,
      gender,
    });
  }

  return students;
}

/**
 * Generates CAPS-compliant assessments for all terms
 *
 * @returns Array of assessments across all 4 terms
 */
export function generateDemoAssessments(): DemoAssessment[] {
  const assessments: DemoAssessment[] = [];
  const currentYear = new Date().getFullYear();
  let sequence = 1;

  // Term 1 (Jan-Mar)
  CAPS_MATH_ASSESSMENTS.term1.forEach((template, index) => {
    assessments.push({
      id: generateId("assessment_"),
      taskName: template.name,
      term: "T1",
      termNumber: 1,
      totalMark: template.totalMark,
      weightPercent: template.weight,
      type: template.type,
      dueDate: new Date(currentYear, 1, 15 + index * 14), // Feb onwards
      status: "Locked",
      category: "Term 1",
      sequence: sequence++,
    });
  });

  // Term 2 (Apr-Jun)
  CAPS_MATH_ASSESSMENTS.term2.forEach((template, index) => {
    assessments.push({
      id: generateId("assessment_"),
      taskName: template.name,
      term: "T2",
      termNumber: 2,
      totalMark: template.totalMark,
      weightPercent: template.weight,
      type: template.type,
      dueDate: new Date(currentYear, 4, 10 + index * 14), // May onwards
      status: "Locked",
      category: "Term 2",
      sequence: sequence++,
    });
  });

  // Term 3 (Jul-Sep)
  CAPS_MATH_ASSESSMENTS.term3.forEach((template, index) => {
    assessments.push({
      id: generateId("assessment_"),
      taskName: template.name,
      term: "T3",
      termNumber: 3,
      totalMark: template.totalMark,
      weightPercent: template.weight,
      type: template.type,
      dueDate: new Date(currentYear, 7, 15 + index * 14), // Aug onwards
      status: "Active",
      category: "Term 3",
      sequence: sequence++,
    });
  });

  // Term 4 (Oct-Dec)
  CAPS_MATH_ASSESSMENTS.term4.forEach((template, index) => {
    assessments.push({
      id: generateId("assessment_"),
      taskName: template.name,
      term: "T4",
      termNumber: 4,
      totalMark: template.totalMark,
      weightPercent: template.weight,
      type: template.type,
      dueDate: new Date(currentYear, 10, 5 + index * 14), // Nov onwards
      status: "Draft",
      category: "Term 4",
      sequence: sequence++,
    });
  });

  return assessments;
}

/**
 * Generates realistic mark distribution
 * Creates varied performance levels: excellent, moderate, struggling
 *
 * @param students - Array of students
 * @param assessments - Array of assessments
 * @returns Array of marks with realistic distribution
 */
export function generateDemoMarks(
  students: DemoStudent[],
  assessments: DemoAssessment[]
): DemoMark[] {
  const marks: DemoMark[] = [];

  students.forEach((student, studentIndex) => {
    // Assign performance profile to each student
    // 30% excellent (75-95%), 50% moderate (50-75%), 20% struggling (30-55%)
    const performanceProfile = studentIndex < students.length * 0.3
      ? "excellent"
      : studentIndex < students.length * 0.8
      ? "moderate"
      : "struggling";

    assessments.forEach((assessment) => {
      // Only generate marks for locked and active assessments (not draft)
      if (assessment.status === "Draft") {
        marks.push({
          id: generateId("mark_"),
          assessmentId: assessment.id,
          studentId: student.id,
          rawMark: null,
          percentage: null,
          isAbsent: false,
          status: "Draft",
        });
        return;
      }

      // 5% chance of absence
      const isAbsent = Math.random() < 0.05;

      if (isAbsent) {
        marks.push({
          id: generateId("mark_"),
          assessmentId: assessment.id,
          studentId: student.id,
          rawMark: null,
          percentage: null,
          isAbsent: true,
          absenceCode: "ABS",
          status: "Submitted",
        });
        return;
      }

      // Generate mark based on performance profile
      let basePercentage: number;
      let variation: number;

      switch (performanceProfile) {
        case "excellent":
          basePercentage = 85;
          variation = 10;
          break;
        case "moderate":
          basePercentage = 62;
          variation = 12;
          break;
        case "struggling":
          basePercentage = 42;
          variation = 12;
          break;
      }

      // Add randomness within range
      const percentage = Math.max(
        25,
        Math.min(
          95,
          basePercentage + (Math.random() * variation * 2 - variation)
        )
      );

      const rawMark = Math.round((percentage / 100) * assessment.totalMark);

      marks.push({
        id: generateId("mark_"),
        assessmentId: assessment.id,
        studentId: student.id,
        rawMark,
        percentage: Math.round(percentage),
        isAbsent: false,
        status: assessment.status === "Locked" ? "Approved" : "Submitted",
      });
    });
  });

  return marks;
}

/**
 * Generates complete markbook demo data
 * Includes students, assessments, marks, and term weights
 *
 * @param studentCount - Number of students (default: 12)
 * @returns Complete markbook data structure
 */
export function generateDemoMarkbookData(studentCount: number = 12): DemoMarkbookData {
  const students = generateDemoStudents(studentCount);
  const assessments = generateDemoAssessments();
  const marks = generateDemoMarks(students, assessments);

  return {
    students,
    assessments,
    marks,
    termWeights: {
      term1: 25,
      term2: 25,
      term3: 25,
      term4: 25,
    },
  };
}

/**
 * Generates assessment plan demo data with term weights
 *
 * @returns Assessment plan with configurable weights
 */
export function generateDemoAssessmentPlanData(): DemoAssessmentPlan {
  const students = generateDemoStudents(12);
  const assessments = generateDemoAssessments();
  const marks = generateDemoMarks(students, assessments);

  return {
    id: generateId("plan_"),
    name: "Grade 10 Mathematics - 2024",
    year: new Date().getFullYear(),
    termCount: 4,
    status: "Approved",
    termWeights: {
      term1: 20,
      term2: 25,
      term3: 25,
      term4: 30,
    },
    assessments,
    marks,
  };
}

/**
 * Generates moderation thread with realistic comments
 *
 * @returns Moderation thread with multi-role conversation
 */
export function generateDemoModerationData(): DemoModerationThread {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return {
    id: generateId("thread_"),
    title: "Assessment Plan Review - Grade 10 Mathematics Term 3",
    kind: "plan",
    status: "ChangesRequested",
    createdByRole: "Teacher",
    comments: [
      {
        id: generateId("comment_"),
        authorRole: "Teacher",
        authorName: "Ms. Mokoena",
        message: "Submitted assessment plan for Term 3. Includes Test 3 (15%), Assignment 2 (10%), and PAT (10%). Total weighting: 35% as per CAPS requirements.",
        createdAt: threeDaysAgo,
      },
      {
        id: generateId("comment_"),
        authorRole: "HOD",
        authorName: "Mr. Nkosi",
        message: "Plan structure looks good, but could you please clarify the PAT assessment criteria? Also, ensure the Test 3 date doesn't clash with the Grade 11 exam schedule.",
        createdAt: twoDaysAgo,
      },
      {
        id: generateId("comment_"),
        authorRole: "Teacher",
        authorName: "Ms. Mokoena",
        message: "Thank you for the feedback. I've checked the exam timetable - no clashes. The PAT will assess practical problem-solving skills using real-world scenarios (budgeting, measurements). Rubric attached with breakdown of criteria.",
        createdAt: yesterday,
      },
      {
        id: generateId("comment_"),
        authorRole: "HOD",
        authorName: "Mr. Nkosi",
        message: "Perfect! Plan approved. Please ensure moderation samples are ready by end of term.",
        createdAt: now,
      },
    ],
    createdAt: threeDaysAgo,
    updatedAt: now,
  };
}

/**
 * Generates dashboard analytics data
 * Shows class performance distribution
 *
 * @returns Array of class performance metrics
 */
export function generateDemoDashboardData(): DemoClassPerformance[] {
  const classes = [
    { name: "Grade 10A Math", students: 28 },
    { name: "Grade 10B Math", students: 30 },
    { name: "Grade 10C Math", students: 26 },
    { name: "Grade 11A Math", students: 25 },
    { name: "Grade 11B Math", students: 27 },
  ];

  return classes.map((classInfo) => {
    // Generate realistic distribution
    const averagePercentage = 55 + Math.random() * 25; // 55-80%
    const excellentCount = Math.floor(classInfo.students * (0.2 + Math.random() * 0.15)); // 20-35%
    const atRiskCount = Math.floor(classInfo.students * (0.1 + Math.random() * 0.1)); // 10-20%
    const moderateCount = classInfo.students - excellentCount - atRiskCount;
    const passingCount = excellentCount + moderateCount;

    return {
      className: classInfo.name,
      averagePercentage: Math.round(averagePercentage),
      studentCount: classInfo.students,
      passingCount,
      excellentCount,
      moderateCount,
      atRiskCount,
    };
  });
}

/**
 * Calculates student's term average from marks
 *
 * @param marks - Array of marks for a student in a specific term
 * @param assessments - Array of assessments for context
 * @returns Weighted average percentage
 */
export function calculateTermAverage(
  marks: DemoMark[],
  assessments: DemoAssessment[]
): number | null {
  const validMarks = marks.filter((m) => !m.isAbsent && m.percentage !== null);

  if (validMarks.length === 0) return null;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  validMarks.forEach((mark) => {
    const assessment = assessments.find((a) => a.id === mark.assessmentId);
    if (assessment && mark.percentage !== null) {
      totalWeightedScore += mark.percentage * (assessment.weightPercent / 100);
      totalWeight += assessment.weightPercent;
    }
  });

  return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : null;
}

/**
 * Gets assessment status badge color
 *
 * @param status - Assessment status
 * @returns Tailwind color class
 */
export function getAssessmentStatusColor(
  status: "Draft" | "Active" | "Locked"
): string {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "Active":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "Locked":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  }
}

/**
 * Gets moderation status badge color
 *
 * @param status - Moderation status
 * @returns Tailwind color class
 */
export function getModerationStatusColor(
  status: "Open" | "PendingReview" | "ChangesRequested" | "Approved" | "Rejected"
): string {
  switch (status) {
    case "Open":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "PendingReview":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "ChangesRequested":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "Approved":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  }
}
