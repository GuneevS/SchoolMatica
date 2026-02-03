import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

const createSchema = z.object({
    schoolId: z.string(),
    gradeLevelId: z.string(),
    subjectId: z.string(),
    isCompulsory: z.boolean().default(false),
});

const updateSchema = z.object({
    gradeLevelId: z.string(),
    subjectId: z.string(),
    isCompulsory: z.boolean(),
});

export async function GET(request: NextRequest) {
    const authResult = await authorizeWithSchool(request, "subject:read");
    if ("error" in authResult) {
        return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const gradeLevelId = searchParams.get("gradeLevelId");

    if (!schoolId) {
        return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
    }

    if (!hasSchoolAccess(authResult.auth, schoolId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const configs = await prisma.gradeSubjectConfig.findMany({
        where: {
            schoolId,
            ...(gradeLevelId ? { gradeLevelId } : {}),
        },
        include: {
            subject: true,
            gradeLevel: true,
        },
        orderBy: [
            { gradeLevel: { order: "asc" } },
            { subject: { name: "asc" } },
        ],
    });

    return NextResponse.json(configs);
}

export async function POST(request: NextRequest) {
    const authResult = await authorizeWithSchool(request, "subject:create");
    if ("error" in authResult) {
        return authResult.error;
    }

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { schoolId, gradeLevelId, subjectId, isCompulsory } = parsed.data;

    if (!hasSchoolAccess(authResult.auth, schoolId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify grade level and subject belong to the school
    const [gradeLevel, subject] = await Promise.all([
        prisma.gradeLevel.findFirst({ where: { id: gradeLevelId, schoolId } }),
        prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
    ]);

    if (!gradeLevel) {
        return NextResponse.json({ error: "Grade level not found" }, { status: 404 });
    }
    if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if config already exists
    const existing = await prisma.gradeSubjectConfig.findUnique({
        where: { gradeLevelId_subjectId: { gradeLevelId, subjectId } },
    });

    if (existing) {
        return NextResponse.json({ error: "Configuration already exists" }, { status: 409 });
    }

    const config = await prisma.gradeSubjectConfig.create({
        data: {
            schoolId,
            gradeLevelId,
            subjectId,
            isCompulsory,
        },
        include: { subject: true, gradeLevel: true },
    });

    return NextResponse.json(config, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const authResult = await authorizeWithSchool(request, "subject:update");
    if ("error" in authResult) {
        return authResult.error;
    }

    const json = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { gradeLevelId, subjectId, isCompulsory } = parsed.data;

    // Get the config to verify school access
    const config = await prisma.gradeSubjectConfig.findUnique({
        where: { gradeLevelId_subjectId: { gradeLevelId, subjectId } },
    });

    if (!config) {
        return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    if (!hasSchoolAccess(authResult.auth, config.schoolId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await prisma.gradeSubjectConfig.update({
        where: { gradeLevelId_subjectId: { gradeLevelId, subjectId } },
        data: { isCompulsory },
        include: { subject: true, gradeLevel: true },
    });

    return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
    const authResult = await authorizeWithSchool(request, "subject:delete");
    if ("error" in authResult) {
        return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const gradeLevelId = searchParams.get("gradeLevelId");
    const subjectId = searchParams.get("subjectId");

    if (!gradeLevelId || !subjectId) {
        return NextResponse.json({ error: "gradeLevelId and subjectId are required" }, { status: 400 });
    }

    // Get the config to verify school access
    const config = await prisma.gradeSubjectConfig.findUnique({
        where: { gradeLevelId_subjectId: { gradeLevelId, subjectId } },
    });

    if (!config) {
        return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    if (!hasSchoolAccess(authResult.auth, config.schoolId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.gradeSubjectConfig.delete({
        where: { gradeLevelId_subjectId: { gradeLevelId, subjectId } },
    });

    return NextResponse.json({ success: true });
}
