import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { generatePaymentRef } from "@/lib/utils/reference-generator";
import { z } from "zod";

/**
 * Parse a date string supporting SA DD/MM/YYYY and standard YYYY-MM-DD formats
 */
function parseBankDate(dateStr: string): Date {
    // Try DD/MM/YYYY (SA standard)
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(parsed.getTime())) return parsed;
    }
    // Try YYYY-MM-DD (ISO)
    const iso = new Date(dateStr);
    if (!isNaN(iso.getTime())) return iso;
    // Fallback to current date
    return new Date();
}

// Schema for bank statement entries
const bankEntrySchema = z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    reference: z.string().optional(),
    balance: z.number().optional(),
});

const reconcileSchema = z.object({
    entries: z.array(bankEntrySchema),
    matchTolerance: z.number().min(0).max(100).default(5), // days tolerance for date matching
});

const approveMatchSchema = z.object({
    matches: z.array(z.object({
        bankEntry: bankEntrySchema,
        invoiceId: z.string(),
        paymentMethod: z.string().default("EFT"),
    })),
});

// POST - Parse and match bank statement entries against invoices
export async function POST(request: NextRequest) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const schoolId = auth.user.schoolId;
        if (!schoolId && !auth.isSuperAdmin) {
            return NextResponse.json({ error: "No school context" }, { status: 400 });
        }

        const body = await request.json();

        // Check if this is a match approval request
        if (body.matches) {
            return handleApproveMatches(body, schoolId!, auth.user.id);
        }

        const parsed = reconcileSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { entries } = parsed.data;

        // Get all unpaid/partially paid invoices for the school
        const openInvoices = await prisma.invoice.findMany({
            where: {
                ...(schoolId && { schoolId }),
                status: { in: ["Sent", "Partially Paid", "Overdue"] },
                balanceDue: { gt: 0 },
            },
            include: {
                student: {
                    select: { firstName: true, lastName: true, admissionNumber: true },
                },
                payments: {
                    select: { amount: true, gatewayRef: true, processedAt: true },
                },
            },
        });

        // Get all existing payments to avoid duplicates
        const existingPayments = await prisma.payment.findMany({
            where: {
                invoice: {
                    ...(schoolId && { schoolId }),
                },
                status: "Completed",
            },
            select: { amount: true, gatewayRef: true, processedAt: true },
        });

        // Match bank entries to invoices
        const matched: Array<{
            bankEntry: (typeof entries)[0];
            invoice: (typeof openInvoices)[0];
            confidence: number;
            matchType: string;
        }> = [];

        const unmatched: Array<(typeof entries)[0]> = [];
        const alreadyReconciled: Array<(typeof entries)[0]> = [];

        for (const entry of entries) {
            // Skip negative amounts (bank charges, etc.) - only look at credits/deposits
            if (entry.amount <= 0) {
                unmatched.push(entry);
                continue;
            }

            // Check if already reconciled (matching existing payment)
            const isExisting = existingPayments.some((p) => {
                const amountMatch = Math.abs(p.amount - entry.amount) < 0.01;
                const refMatch = p.gatewayRef && entry.reference && p.gatewayRef === entry.reference;
                return amountMatch && refMatch;
            });

            if (isExisting) {
                alreadyReconciled.push(entry);
                continue;
            }

            // Try to match by invoice number in reference
            let bestMatch: (typeof matched)[0] | null = null;

            for (const invoice of openInvoices) {
                let confidence = 0;
                const matchReasons: string[] = [];

                // Check invoice number in description or reference
                const searchText = `${entry.description} ${entry.reference || ""}`.toUpperCase();
                if (searchText.includes(invoice.invoiceNumber.toUpperCase())) {
                    confidence += 50;
                    matchReasons.push("Invoice number match");
                }

                // Check student name in description
                const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`.toUpperCase();
                if (searchText.includes(studentName)) {
                    confidence += 20;
                    matchReasons.push("Student name match");
                }

                // Check admission number
                if (searchText.includes(invoice.student.admissionNumber.toUpperCase())) {
                    confidence += 25;
                    matchReasons.push("Admission number match");
                }

                // Check amount match
                const amountDiff = Math.abs(entry.amount - invoice.balanceDue);
                if (amountDiff < 0.01) {
                    confidence += 30;
                    matchReasons.push("Exact amount match");
                } else if (entry.amount <= invoice.balanceDue) {
                    confidence += 10;
                    matchReasons.push("Partial amount match");
                }

                if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
                    bestMatch = {
                        bankEntry: entry,
                        invoice,
                        confidence,
                        matchType: matchReasons.join(", "),
                    };
                }
            }

            if (bestMatch && bestMatch.confidence >= 40) {
                matched.push(bestMatch);
            } else {
                unmatched.push(entry);
            }
        }

        return NextResponse.json({
            summary: {
                totalEntries: entries.length,
                matched: matched.length,
                unmatched: unmatched.length,
                alreadyReconciled: alreadyReconciled.length,
                totalMatchedAmount: matched.reduce((sum, m) => sum + m.bankEntry.amount, 0),
            },
            matched: matched.map((m) => ({
                bankEntry: m.bankEntry,
                invoice: {
                    id: m.invoice.id,
                    invoiceNumber: m.invoice.invoiceNumber,
                    student: `${m.invoice.student.firstName} ${m.invoice.student.lastName}`,
                    admissionNumber: m.invoice.student.admissionNumber,
                    totalAmount: m.invoice.totalAmount,
                    balanceDue: m.invoice.balanceDue,
                    status: m.invoice.status,
                },
                confidence: m.confidence,
                matchType: m.matchType,
            })),
            unmatched,
            alreadyReconciled,
        });
    } catch (error) {
        console.error("Error reconciling bank statement:", error);
        return NextResponse.json({ error: "Failed to reconcile" }, { status: 500 });
    }
}

// Handle approving matched entries and creating payments
async function handleApproveMatches(
    body: unknown,
    schoolId: string,
    userId: string
) {
    const parsed = approveMatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { matches } = parsed.data;
    const results: Array<{ invoiceId: string; paymentRef: string; amount: number; status: string }> = [];

    for (const match of matches) {
        // Get the invoice
        const invoice = await prisma.invoice.findFirst({
            where: { id: match.invoiceId, schoolId },
            include: { student: true },
        });

        if (!invoice || invoice.status === "Paid" || invoice.status === "Cancelled") {
            results.push({
                invoiceId: match.invoiceId,
                paymentRef: "",
                amount: match.bankEntry.amount,
                status: "Skipped - Invoice not payable",
            });
            continue;
        }

        const paymentAmount = Math.min(match.bankEntry.amount, invoice.balanceDue);

        // Create payment and update invoice in transaction with atomic ref generation
        const paymentRef = await prisma.$transaction(async (tx) => {
            const ref = await generatePaymentRef(tx, new Date().getFullYear());

            await tx.payment.create({
                data: {
                    paymentRef: ref,
                    invoiceId: match.invoiceId,
                    amount: paymentAmount,
                    method: match.paymentMethod || "EFT",
                    gateway: "Bank Reconciliation",
                    gatewayRef: match.bankEntry.reference || `BANK-${match.bankEntry.date}`,
                    paidBy: match.bankEntry.description,
                    status: "Completed",
                    processedAt: parseBankDate(match.bankEntry.date),
                    metadata: { source: "bank_reconciliation", bankDescription: match.bankEntry.description },
                },
            });

            const newPaidAmount = invoice.paidAmount + paymentAmount;
            const newBalanceDue = invoice.totalAmount - newPaidAmount;
            const newStatus = newBalanceDue <= 0 ? "Paid" : "Partially Paid";

            await tx.invoice.update({
                where: { id: match.invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceDue: newBalanceDue,
                    status: newStatus,
                },
            });

            // Calculate cumulative running balance
            const agg = await tx.accountLedger.aggregate({
                where: { studentId: invoice.studentId },
                _sum: { debit: true, credit: true },
            });
            const prevBalance = (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);

            await tx.accountLedger.create({
                data: {
                    schoolId,
                    studentId: invoice.studentId,
                    type: "Payment",
                    description: `Bank Recon: ${ref} - ${match.paymentMethod || "EFT"}`,
                    debit: 0,
                    credit: paymentAmount,
                    balance: prevBalance - paymentAmount,
                    reference: ref,
                    createdBy: userId,
                },
            });

            return ref;
        });

        results.push({
            invoiceId: match.invoiceId,
            paymentRef,
            amount: paymentAmount,
            status: "Completed",
        });
    }

    return NextResponse.json({
        processed: results.length,
        results,
    }, { status: 201 });
}
