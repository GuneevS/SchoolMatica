import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

// South African grading bands
const DEFAULT_GRADING_BANDS = {
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

// Grade phase mapping
const GRADE_PHASES: Record<string, string> = {
    "R": "Foundation",
    "1": "Foundation",
    "2": "Foundation",
    "3": "Foundation",
    "4": "Intermediate",
    "5": "Intermediate",
    "6": "Intermediate",
    "7": "Senior",
    "8": "Senior",
    "9": "Senior",
    "10": "FET",
    "11": "FET",
    "12": "FET",
};

const setupSchema = z.object({
    // Grade levels to create
    gradeLevels: z.array(z.object({
        name: z.string(),
        gradeId: z.string(), // e.g., "R", "1", "10"
        order: z.number(),
    })),
    
    // Homeroom classes to create (optional subjects later)
    classes: z.array(z.object({
        name: z.string(),
        gradeId: z.string(),
    })).optional(),
    
    // Subjects to create (optional)
    subjects: z.array(z.object({
        code: z.string(),
        name: z.string(),
        phase: z.string(),
    })).optional(),
    
    // Teachers to create (optional)
    teachers: z.array(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        role: z.string().default("Teacher"),
    })).optional(),
    
    // Update grading config
    updateGradingConfig: z.boolean().default(true),
});

interface Params {
    params: Promise<{ schoolId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
    const { schoolId } = await params;
    
    // Authorize the request
    const authResult = await authorizeWithSchool(request, "school:update");
    if ("error" in authResult) {
        return authResult.error;
    }
    const { auth } = authResult;
    
    // Verify school access
    if (!hasSchoolAccess(auth, schoolId) && !isSystemAdmin(auth)) {
        return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
    
    try {
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: { gradingConfig: true },
        });
        
        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }
        
        const json = await request.json();
        const parsed = setupSchema.safeParse(json);
        
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
        }
        
        const { gradeLevels, classes, subjects, teachers, updateGradingConfig } = parsed.data;
        
        const results = {
            gradeLevels: [] as any[],
            classes: [] as any[],
            subjects: [] as any[],
            teachers: [] as any[],
            gradeSubjectConfigs: [] as any[],
            gradingConfigUpdated: false,
        };
        
        if (gradeLevels.length > 0) {
            await prisma.gradeLevel.createMany({
                data: gradeLevels.map(grade => ({ schoolId, name: grade.name, order: grade.order })),
                skipDuplicates: true,
            });
            results.gradeLevels = await prisma.gradeLevel.findMany({ where: { schoolId }, orderBy: { order: "asc" } });
        }
        
        if (updateGradingConfig && school.gradingConfigId) {
            await prisma.gradingConfig.update({ where: { id: school.gradingConfigId }, data: { phasesJson: DEFAULT_GRADING_BANDS } });
            results.gradingConfigUpdated = true;
        }
        
        if (classes && classes.length > 0) {
            const gradeLevelMap = new Map(results.gradeLevels.map((gl: any) => [gl.name, gl.id]));
            const classData = classes.map(cls => {
                const gradeNum = cls.gradeId === "R" ? 0 : parseInt(cls.gradeId);
                const gradeLevelName = `Grade ${cls.gradeId}`;
                const gradeLevelId = gradeLevelMap.get(gradeLevelName);
                return { schoolId, name: cls.name, grade: gradeNum, year: new Date().getFullYear(), classType: "Homeroom" as const, gradeLevelId: gradeLevelId || undefined };
            });
            await prisma.classGroup.createMany({ data: classData, skipDuplicates: true });
            results.classes = await prisma.classGroup.findMany({ where: { schoolId }, orderBy: [{ grade: "asc" }, { name: "asc" }] });
        }
        
        if (subjects && subjects.length > 0) {
            const existingSubjects = await prisma.subject.findMany({ where: { schoolId, code: { in: subjects.map((s: { code: string }) => s.code) } }, select: { code: true } });
            const existingCodeSet = new Set(existingSubjects.map((s: { code: string }) => s.code));
            const subjectData = subjects.filter(s => !existingCodeSet.has(s.code)).map(subject => ({ schoolId, code: subject.code, name: subject.name, phase: subject.phase }));
            if (subjectData.length > 0) {
                await prisma.subject.createMany({ data: subjectData, skipDuplicates: true });
            }
            results.subjects = await prisma.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
            
            if (results.gradeLevels.length > 0 && results.subjects.length > 0) {
                const gradeSubjectConfigData: { schoolId: string; gradeLevelId: string; subjectId: string; isCompulsory: boolean }[] = [];
                const gradeLevelPhaseMap = new Map<string, string>();
                for (const gl of results.gradeLevels) {
                    const gradeMatch = gl.name.match(/Grade\s+(\w+)/i);
                    const gradeId = gradeMatch ? gradeMatch[1] : gl.name;
                    gradeLevelPhaseMap.set(gl.id, GRADE_PHASES[gradeId] || "FET");
                }
                for (const subject of results.subjects) {
                    for (const gradeLevel of results.gradeLevels) {
                        if (gradeLevelPhaseMap.get(gradeLevel.id) === subject.phase) {
                            gradeSubjectConfigData.push({ schoolId, gradeLevelId: gradeLevel.id, subjectId: subject.id, isCompulsory: true });
                        }
                    }
                }
                if (gradeSubjectConfigData.length > 0) {
                    await prisma.gradeSubjectConfig.createMany({ data: gradeSubjectConfigData, skipDuplicates: true });
                    results.gradeSubjectConfigs = await prisma.gradeSubjectConfig.findMany({ where: { schoolId }, include: { subject: true, gradeLevel: true } });
                }
            }
        }
        
        if (teachers && teachers.length > 0) {
            const existingEmails = await prisma.teacher.findMany({ where: { email: { in: teachers.map(t => t.email) } }, select: { email: true } });
            const existingEmailSet = new Set(existingEmails.map((e: { email: string }) => e.email));
            const teacherData = teachers.filter(t => !existingEmailSet.has(t.email)).map(teacher => ({ schoolId, firstName: teacher.firstName, lastName: teacher.lastName, email: teacher.email, role: teacher.role }));
            if (teacherData.length > 0) {
                await prisma.teacher.createMany({ data: teacherData, skipDuplicates: true });
            }
            results.teachers = await prisma.teacher.findMany({ where: { schoolId }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
        }
        
        return NextResponse.json({ success: true, ...results });
    } catch (error) {
        return handleApiError("POST schools/[schoolId]/setup", error);
    }
}

// GET endpoint to retrieve current setup status
export async function GET(request: NextRequest, { params }: Params) {
    const { schoolId } = await params;
    
    // Authorize the request
    const authResult = await authorizeWithSchool(request, "school:read");
    if ("error" in authResult) {
        return authResult.error;
    }
    const { auth } = authResult;
    
    // Verify school access
    if (!hasSchoolAccess(auth, schoolId) && !isSystemAdmin(auth)) {
        return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
    
    try {
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                gradingConfig: true,
                gradeLevels: { orderBy: { order: "asc" } },
                classes: { orderBy: [{ grade: "asc" }, { name: "asc" }], select: { id: true, name: true, grade: true, year: true } },
                teachers: { orderBy: [{ lastName: "asc" }], select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                subjects: { orderBy: { name: "asc" }, select: { id: true, name: true, code: true, phase: true } },
            },
        });
        
        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }
        
        return NextResponse.json({
            school: { id: school.id, name: school.name, shortCode: school.shortCode },
            gradingConfig: school.gradingConfig,
            gradeLevels: school.gradeLevels,
            classes: school.classes,
            teachers: school.teachers,
            subjects: school.subjects,
            stats: { gradeLevels: school.gradeLevels.length, classes: school.classes.length, teachers: school.teachers.length, subjects: school.subjects.length },
        });
    } catch (error) {
        return handleApiError("GET schools/[schoolId]/setup", error);
    }
}
