import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

const updateDiscountSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["Percentage", "FixedAmount"]).optional(),
    value: z.number().positive().optional(),
    criteria: z.record(z.string(), z.unknown()).optional().nullable(),
    maxUsage: z.number().int().positive().optional().nullable(),
    validFrom: z.string().optional().nullable(),
    validUntil: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

// GET - Get single discount with applications
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ discountId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discountId } = await params;

        const discount = await prisma.feeDiscount.findUnique({
            where: { id: discountId },
            include: {
                feeStructure: {
                    select: { id: true, name: true, grade: true, year: true, schoolId: true },
                },
                applications: {
                    include: {
                        student: {
                            select: { id: true, firstName: true, lastName: true, admissionNumber: true },
                        },
                    },
                },
            },
        });

        if (!discount) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        return NextResponse.json(discount);
    } catch (error) {
        console.error("Error fetching discount:", error);
        return NextResponse.json({ error: "Failed to fetch discount" }, { status: 500 });
    }
}

// PATCH - Update discount
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ discountId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discountId } = await params;

        const existing = await prisma.feeDiscount.findUnique({
            where: { id: discountId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = updateDiscountSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.criteria !== undefined) updateData.criteria = data.criteria;
        if (data.maxUsage !== undefined) updateData.maxUsage = data.maxUsage;
        if (data.validFrom !== undefined) updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
        if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const updated = await prisma.feeDiscount.update({
            where: { id: discountId },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating discount:", error);
        return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
    }
}

// DELETE - Deactivate discount
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ discountId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { discountId } = await params;

        const existing = await prisma.feeDiscount.findUnique({
            where: { id: discountId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Discount not found" }, { status: 404 });
        }

        const updated = await prisma.feeDiscount.update({
            where: { id: discountId },
            data: { isActive: false },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error deactivating discount:", error);
        return NextResponse.json({ error: "Failed to deactivate discount" }, { status: 500 });
    }
}
