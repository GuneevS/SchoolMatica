import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { notifyParentPaymentReminder } from "@/lib/notifications";

// POST - Send payment reminder for an invoice
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    try {
        const auth = await getServerAuthContext();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { invoiceId } = await params;
        const schoolId = auth.user.schoolId;

        // Get invoice with student and parent details
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                ...(schoolId && !auth.isSuperAdmin && { schoolId }),
            },
            include: {
                student: {
                    include: {
                        parents: {
                            where: { parentUserId: { not: null } },
                            include: {
                                parentUser: {
                                    include: { user: { select: { id: true } } },
                                },
                            },
                        },
                        classGroup: { select: { schoolId: true } },
                    },
                },
                school: { select: { name: true } },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === "Paid") {
            return NextResponse.json(
                { error: "Invoice is already paid" },
                { status: 400 }
            );
        }

        if (invoice.status === "Cancelled") {
            return NextResponse.json(
                { error: "Invoice is cancelled" },
                { status: 400 }
            );
        }

        // Send notification to all linked parents
        const parentCount = await notifyParentPaymentReminder(
            invoice.studentId,
            invoice.invoiceNumber,
            invoice.balanceDue,
            invoice.dueDate,
            invoice.school.name
        );

        return NextResponse.json({
            success: true,
            message: `Reminder sent to ${parentCount} parent(s)`,
            invoiceNumber: invoice.invoiceNumber,
            balanceDue: invoice.balanceDue,
        });
    } catch (error) {
        console.error("Error sending reminder:", error);
        return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
    }
}
