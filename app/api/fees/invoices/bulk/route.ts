import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { generateInvoiceNumber } from "@/lib/utils/reference-generator";
import { z } from "zod";

// Schema for bulk invoice generation
const bulkInvoiceSchema = z.object({
    feeStructureId: z.string().min(1, "Fee structure is required"),
    term: z.string().min(1, "Term is required"),
    year: z.number().int().min(2020).max(2100),
    dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
    gradeFilter: z.number().int().optional(),
    classGroupIds: z.array(z.string()).optional(),
    excludeStudentIds: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

// POST - Generate invoices in bulk for students based on fee structure
export async function POST(request: NextRequest) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const schoolId = auth.isSuperAdmin
            ? (body.schoolId || auth.user.schoolId)
            : auth.user.schoolId;

        if (!schoolId) {
            return NextResponse.json({ error: "No school context" }, { status: 400 });
        }

        const parsed = bulkInvoiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;

        // Get the fee structure
        const feeStructure = await prisma.feeStructure.findFirst({
            where: { id: data.feeStructureId, schoolId },
            include: {
                discounts: { where: { isActive: true } },
            },
        });

        if (!feeStructure) {
            return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
        }

        // Get students matching criteria
        const students = await prisma.student.findMany({
            where: {
                classGroup: {
                    schoolId,
                    ...(data.gradeFilter !== undefined && { grade: data.gradeFilter }),
                    ...(data.classGroupIds && data.classGroupIds.length > 0 && {
                        id: { in: data.classGroupIds },
                    }),
                },
                ...(data.excludeStudentIds && data.excludeStudentIds.length > 0 && {
                    id: { notIn: data.excludeStudentIds },
                }),
            },
            include: {
                classGroup: { select: { name: true, grade: true } },
                parents: {
                    where: { primary: true },
                    take: 1,
                    select: { id: true, fullName: true },
                },
                discounts: {
                    where: {
                        status: "Approved",
                        discount: {
                            feeStructureId: data.feeStructureId,
                            isActive: true,
                        },
                    },
                    include: { discount: true },
                },
            },
        });

        // Check for existing invoices to avoid duplicates
        const existingInvoices = await prisma.invoice.findMany({
            where: {
                schoolId,
                feeStructureId: data.feeStructureId,
                term: data.term,
                year: data.year,
                status: { not: "Cancelled" },
            },
            select: { studentId: true },
        });

        const existingStudentIds = new Set(existingInvoices.map((inv) => inv.studentId));

        // Filter out students who already have invoices
        const eligibleStudents = students.filter(
            (s) => !existingStudentIds.has(s.id)
        );

        if (eligibleStudents.length === 0) {
            return NextResponse.json({
                created: 0,
                skipped: students.length,
                message: "All students already have invoices for this fee structure and term",
            });
        }

        const components = feeStructure.components as Array<{
            name: string;
            amount: number;
            optional: boolean;
            description?: string;
        }>;

        // Mandatory line items from fee structure
        const mandatoryLineItems = components
            .filter((c) => !c.optional)
            .map((c) => ({
                description: c.name,
                amount: c.amount,
                quantity: 1,
            }));

        const subtotal = mandatoryLineItems.reduce(
            (sum, item) => sum + item.amount * item.quantity,
            0
        );

        const createdInvoices: Array<{ invoiceNumber: string; student: string; amount: number }> = [];

        // Create invoices with atomic numbering
        for (const student of eligibleStudents) {
            // Calculate student-specific discount
            let discountAmount = 0;
            const appliedDiscounts: Array<{ name: string; type: string; value: number; amount: number }> = [];

            for (const sd of student.discounts) {
                const disc = sd.discount;
                let discAmount = 0;
                if (disc.type === "Percentage") {
                    discAmount = subtotal * (disc.value / 100);
                } else {
                    discAmount = disc.value;
                }
                discountAmount += discAmount;
                appliedDiscounts.push({
                    name: disc.name,
                    type: disc.type,
                    value: disc.value,
                    amount: discAmount,
                });
            }

            const totalAmount = subtotal - discountAmount;
            const primaryParent = student.parents[0];

            const invoiceNumber = await prisma.$transaction(async (tx) => {
                const invNum = await generateInvoiceNumber(tx, schoolId, data.year);

                const invoice = await tx.invoice.create({
                    data: {
                        invoiceNumber: invNum,
                        schoolId,
                        studentId: student.id,
                        feeStructureId: data.feeStructureId,
                        parentContactId: primaryParent?.id || null,
                        term: data.term,
                        year: data.year,
                        dueDate: new Date(data.dueDate),
                        subtotal,
                        discountAmount,
                        taxAmount: 0,
                        totalAmount,
                        paidAmount: 0,
                        balanceDue: totalAmount,
                        lineItems: mandatoryLineItems,
                        appliedDiscounts: appliedDiscounts.length > 0 ? appliedDiscounts : undefined,
                        notes: data.notes,
                        status: "Draft",
                    },
                });

                // Calculate cumulative running balance
                const agg = await tx.accountLedger.aggregate({
                    where: { studentId: student.id },
                    _sum: { debit: true, credit: true },
                });
                const prevBalance = (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);

                // Create ledger entry with correct running balance
                await tx.accountLedger.create({
                    data: {
                        schoolId,
                        studentId: student.id,
                        type: "Invoice",
                        description: `Invoice ${invNum} - ${student.firstName} ${student.lastName}`,
                        debit: totalAmount,
                        credit: 0,
                        balance: prevBalance + totalAmount,
                        reference: invoice.id,
                        createdBy: auth.user.id,
                    },
                });

                return invNum;
            });

            createdInvoices.push({
                invoiceNumber,
                student: `${student.firstName} ${student.lastName}`,
                amount: totalAmount,
            });
        }

        return NextResponse.json({
            created: createdInvoices.length,
            skipped: students.length - eligibleStudents.length,
            totalAmount: createdInvoices.reduce((sum, inv) => sum + inv.amount, 0),
            invoices: createdInvoices,
        }, { status: 201 });
    } catch (error) {
        console.error("Error generating bulk invoices:", error);
        return NextResponse.json({ error: "Failed to generate invoices" }, { status: 500 });
    }
}
