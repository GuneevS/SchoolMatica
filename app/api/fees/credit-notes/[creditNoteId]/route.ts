import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

interface Params {
  params: Promise<{ creditNoteId: string }>;
}

const voidSchema = z.object({
  voidReason: z.string().min(3, "Void reason is required"),
});

// GET - Get a specific credit note
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creditNoteId } = await params;

    const creditNote = await prisma.creditNote.findUnique({
      where: { id: creditNoteId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            balanceDue: true,
          },
        },
        school: {
          select: { name: true },
        },
      },
    });

    if (!creditNote) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 });
    }

    // Verify school access
    if (!auth.isSuperAdmin && auth.user.schoolId !== creditNote.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(creditNote);
  } catch (error) {
    console.error("Error fetching credit note:", error);
    return NextResponse.json({ error: "Failed to fetch credit note" }, { status: 500 });
  }
}

// PATCH - Void a credit note (with reversal ledger entry)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creditNoteId } = await params;

    const body = await request.json();
    const parsed = voidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const creditNote = await prisma.creditNote.findUnique({
      where: { id: creditNoteId },
    });

    if (!creditNote) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 });
    }

    if (!auth.isSuperAdmin && auth.user.schoolId !== creditNote.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (creditNote.status === "Voided") {
      return NextResponse.json({ error: "Credit note is already voided" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Void the credit note
      const voided = await tx.creditNote.update({
        where: { id: creditNoteId },
        data: {
          status: "Voided",
          voidedAt: new Date(),
          voidedBy: auth.user.id,
          voidReason: parsed.data.voidReason,
        },
      });

      // If linked to an invoice, reverse the balance reduction
      if (creditNote.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: creditNote.invoiceId },
        });

        const newPaidAmount = Math.max(0, invoice.paidAmount - creditNote.amount);
        const newBalanceDue = invoice.totalAmount - newPaidAmount;
        const newStatus = newBalanceDue >= invoice.totalAmount ? "Issued"
          : newBalanceDue > 0 ? "Partially Paid"
          : "Paid";

        await tx.invoice.update({
          where: { id: creditNote.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            status: newStatus,
          },
        });
      }

      // Calculate cumulative running balance
      const agg = await tx.accountLedger.aggregate({
        where: { studentId: creditNote.studentId },
        _sum: { debit: true, credit: true },
      });
      const prevBalance = (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);

      // Create reversal ledger entry (debit to reverse the credit)
      await tx.accountLedger.create({
        data: {
          schoolId: creditNote.schoolId,
          studentId: creditNote.studentId,
          type: "Adjustment",
          description: `Void Credit Note ${creditNote.creditNoteNumber} - ${parsed.data.voidReason}`,
          debit: creditNote.amount,
          credit: 0,
          balance: prevBalance + creditNote.amount,
          reference: creditNote.id,
          createdBy: auth.user.id,
        },
      });

      return voided;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error voiding credit note:", error);
    return NextResponse.json({ error: "Failed to void credit note" }, { status: 500 });
  }
}
