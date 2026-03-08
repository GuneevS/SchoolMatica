import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

const updateFeeStructureSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    grade: z.number().int().min(0).max(12).optional().nullable(),
    term: z.string().optional().nullable(),
    baseAmount: z.number().positive().optional(),
    components: z.array(z.object({
        name: z.string().min(1),
        amount: z.number().min(0),
        optional: z.boolean().default(false),
        description: z.string().optional(),
    })).optional(),
    isActive: z.boolean().optional(),
});

// GET - Get single fee structure
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ structureId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { structureId } = await params;
        const schoolId = auth.user.schoolId;

        const feeStructure = await prisma.feeStructure.findFirst({
            where: {
                id: structureId,
                ...(schoolId && !auth.isSuperAdmin && { schoolId }),
            },
            include: {
                discounts: { where: { isActive: true } },
                invoices: {
                    include: {
                        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
                        payments: { select: { amount: true, status: true, method: true } },
                    },
                },
            },
        });

        if (!feeStructure) {
            return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
        }

        return NextResponse.json(feeStructure);
    } catch (error) {
        console.error("Error fetching fee structure:", error);
        return NextResponse.json({ error: "Failed to fetch fee structure" }, { status: 500 });
    }
}

// PATCH - Update fee structure
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ structureId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { structureId } = await params;
        const schoolId = auth.user.schoolId;

        const existing = await prisma.feeStructure.findFirst({
            where: {
                id: structureId,
                ...(schoolId && !auth.isSuperAdmin && { schoolId }),
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = updateFeeStructureSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.grade !== undefined) updateData.grade = data.grade;
        if (data.term !== undefined) updateData.term = data.term;
        if (data.baseAmount !== undefined) updateData.baseAmount = data.baseAmount;
        if (data.components !== undefined) updateData.components = data.components;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const updated = await prisma.feeStructure.update({
            where: { id: structureId },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating fee structure:", error);
        return NextResponse.json({ error: "Failed to update fee structure" }, { status: 500 });
    }
}

// DELETE - Deactivate fee structure (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ structureId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { structureId } = await params;
        const schoolId = auth.user.schoolId;

        const existing = await prisma.feeStructure.findFirst({
            where: {
                id: structureId,
                ...(schoolId && !auth.isSuperAdmin && { schoolId }),
            },
            include: { invoices: { where: { status: { not: "Cancelled" } } } },
        });

        if (!existing) {
            return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
        }

        // Soft delete - deactivate instead of hard delete
        const updated = await prisma.feeStructure.update({
            where: { id: structureId },
            data: { isActive: false },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error deactivating fee structure:", error);
        return NextResponse.json({ error: "Failed to deactivate fee structure" }, { status: 500 });
    }
}
