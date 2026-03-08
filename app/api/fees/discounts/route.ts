import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

const createDiscountSchema = z.object({
    feeStructureId: z.string().min(1, "Fee structure is required"),
    name: z.string().min(1, "Discount name is required"),
    type: z.enum(["Percentage", "FixedAmount"]),
    value: z.number().positive("Value must be positive"),
    criteria: z.record(z.string(), z.unknown()).optional(),
    maxUsage: z.number().int().positive().optional().nullable(),
    validFrom: z.string().optional().nullable(),
    validUntil: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

// GET - List discounts for the school's fee structures
export async function GET(request: NextRequest) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const feeStructureId = searchParams.get("feeStructureId");
        const requestedSchoolId = searchParams.get("schoolId");

        const schoolId = auth.isSuperAdmin
            ? (requestedSchoolId || auth.user.schoolId)
            : auth.user.schoolId;

        if (!schoolId && !auth.isSuperAdmin) {
            return NextResponse.json({ error: "No school context" }, { status: 400 });
        }

        const discounts = await prisma.feeDiscount.findMany({
            where: {
                ...(feeStructureId && { feeStructureId }),
                feeStructure: {
                    ...(schoolId && { schoolId }),
                },
            },
            include: {
                feeStructure: {
                    select: { id: true, name: true, grade: true, year: true },
                },
                applications: {
                    include: {
                        student: {
                            select: { id: true, firstName: true, lastName: true, admissionNumber: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(discounts);
    } catch (error) {
        console.error("Error fetching discounts:", error);
        return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
    }
}

// POST - Create a new discount
export async function POST(request: NextRequest) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = createDiscountSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;

        // Verify fee structure exists and belongs to school
        const schoolId = auth.user.schoolId;
        const feeStructure = await prisma.feeStructure.findFirst({
            where: {
                id: data.feeStructureId,
                ...(schoolId && !auth.isSuperAdmin && { schoolId }),
            },
        });

        if (!feeStructure) {
            return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
        }

        // Validate percentage is <= 100
        if (data.type === "Percentage" && data.value > 100) {
            return NextResponse.json(
                { error: "Percentage discount cannot exceed 100%" },
                { status: 400 }
            );
        }

        const discount = await prisma.feeDiscount.create({
            data: {
                feeStructureId: data.feeStructureId,
                name: data.name,
                type: data.type,
                value: data.value,
                criteria: data.criteria as object | undefined,
                maxUsage: data.maxUsage,
                validFrom: data.validFrom ? new Date(data.validFrom) : null,
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                isActive: data.isActive,
            },
            include: {
                feeStructure: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json(discount, { status: 201 });
    } catch (error) {
        console.error("Error creating discount:", error);
        return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
    }
}
