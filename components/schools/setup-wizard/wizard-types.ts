import { z } from "zod";

// South African school phases with their grade levels
export const SCHOOL_PHASES = {
    Foundation: { grades: ["R", "1", "2", "3"], description: "Grade R - Grade 3" },
    Intermediate: { grades: ["4", "5", "6"], description: "Grade 4 - Grade 6" },
    Senior: { grades: ["7", "8", "9"], description: "Grade 7 - Grade 9" },
    FET: { grades: ["10", "11", "12"], description: "Grade 10 - Grade 12" },
} as const;

// Default grading bands for South African schools
export const DEFAULT_GRADING_BANDS = {
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

// Class naming patterns
export type NamingPattern = "ALPHA" | "NUMERIC" | "CUSTOM";

export const NAMING_PATTERNS: Record<NamingPattern, { label: string; example: string }> = {
    ALPHA: { label: "Alphabetical", example: "10A, 10B, 10C" },
    NUMERIC: { label: "Numeric", example: "10-1, 10-2, 10-3" },
    CUSTOM: { label: "Custom Names", example: "Enter your own" },
};

// Staff role options
export const STAFF_ROLES = [
    { value: "teacher", label: "Teacher" },
    { value: "hod", label: "Head of Department" },
    { value: "smt", label: "SMT Member" },
    { value: "admin", label: "Administrator" },
] as const;

// Class config schema for a single grade
const classConfigSchema = z.object({
    count: z.number().min(1).max(20),
    namingPattern: z.enum(["ALPHA", "NUMERIC", "CUSTOM"]),
    customNames: z.array(z.string()).optional(),
});

// Staff invite schema
const staffInviteSchema = z.object({
    email: z.string().email("Invalid email"),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().min(1, "Last name required"),
    role: z.enum(["teacher", "hod", "smt", "admin"]),
});

// Validation schema
export const wizardSchema = z.object({
    // Step 1: Identity
    name: z.string().min(3, "School name must be at least 3 characters"),
    shortCode: z.string().max(10, "Short code max 10 characters").optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),

    // Step 2: Grade Selection
    selectedGrades: z.array(z.string()).min(1, "Select at least one grade"),
    schoolType: z.enum(["primary", "high", "combined"]),

    // Step 3: Class Config (Map<GradeId, Config>)
    classesPerGrade: z.record(z.string(), classConfigSchema).optional(),

    // Step 4: Staff Invitations
    staffInvites: z.array(staffInviteSchema).optional(),
});

export type WizardValues = z.infer<typeof wizardSchema>;

// Default values for the form
export const defaultWizardValues: WizardValues = {
    name: "",
    shortCode: "",
    address: "",
    phone: "",
    email: "",
    selectedGrades: [],
    schoolType: "combined",
    classesPerGrade: {},
    staffInvites: [],
};

// Grade definitions with phase information
export const DEFAULT_GRADES = [
    { id: "R", label: "Grade R", phase: "Foundation", order: 0 },
    { id: "1", label: "Grade 1", phase: "Foundation", order: 1 },
    { id: "2", label: "Grade 2", phase: "Foundation", order: 2 },
    { id: "3", label: "Grade 3", phase: "Foundation", order: 3 },
    { id: "4", label: "Grade 4", phase: "Intermediate", order: 4 },
    { id: "5", label: "Grade 5", phase: "Intermediate", order: 5 },
    { id: "6", label: "Grade 6", phase: "Intermediate", order: 6 },
    { id: "7", label: "Grade 7", phase: "Senior", order: 7 },
    { id: "8", label: "Grade 8", phase: "Senior", order: 8 },
    { id: "9", label: "Grade 9", phase: "Senior", order: 9 },
    { id: "10", label: "Grade 10", phase: "FET", order: 10 },
    { id: "11", label: "Grade 11", phase: "FET", order: 11 },
    { id: "12", label: "Grade 12", phase: "FET", order: 12 },
] as const;

// Helper to get phase for a grade
export function getPhaseForGrade(gradeId: string): string {
    const grade = DEFAULT_GRADES.find(g => g.id === gradeId);
    return grade?.phase ?? "FET";
}

// Generate class names based on pattern
export function generateClassNames(grade: string, count: number, pattern: NamingPattern): string[] {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
        switch (pattern) {
            case "ALPHA":
                names.push(`${grade}${String.fromCharCode(65 + i)}`); // 10A, 10B, 10C
                break;
            case "NUMERIC":
                names.push(`${grade}-${i + 1}`); // 10-1, 10-2, 10-3
                break;
            case "CUSTOM":
                names.push(`${grade} Class ${i + 1}`);
                break;
        }
    }
    return names;
}
