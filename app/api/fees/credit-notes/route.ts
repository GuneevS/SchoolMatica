import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { generateCreditNoteNumber } from "@/lib/utils/reference-generator";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  invoiceId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(3, "Reason is required"),
});

// GET - List credit notes
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get("schoolId");
    const schoolId = auth.isSuperAdmin
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const creditNotes = await prisma.creditNote.findMany({
      where: {
        schoolId,
        ...(studentId && { studentId }),
        ...(status && { status }),
      },
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(creditNotes);
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    return NextResponse.json({ error: "Failed to fetch credit notes" }, { status: 500 });
  }
}

// POST - Issue a credit note
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

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify student belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        classGroup: { schoolId },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found in this school" }, { status: 404 });
    }

    // If linked to an invoice, verify the invoice
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, schoolId, studentId: data.studentId },
      });
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      if (data.amount > invoice.balanceDue) {
        return NextResponse.json(
          { error: `Credit note amount exceeds invoice balance due (R${invoice.balanceDue.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const creditNoteNumber = await generateCreditNoteNumber(tx, schoolId, currentYear);

      // Create the credit note
      const creditNote = await tx.creditNote.create({
        data: {
          creditNoteNumber,
          schoolId,
          studentId: data.studentId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          reason: data.reason,
          issuedBy: auth.user.id,
          status: "Issued",
        },
      });

      // If linked to an invoice, reduce its balance
      if (data.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: data.invoiceId },
        });

        const newPaidAmount = invoice.paidAmount + data.amount;
        const newBalanceDue = invoice.totalAmount - newPaidAmount;
        const newStatus = newBalanceDue <= 0 ? "Paid" : "Partially Paid";

        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            status: newStatus,
          },
        });
      }

      // Calculate cumulative running balance
      const agg = await tx.accountLedger.aggregate({
        where: { studentId: data.studentId },
        _sum: { debit: true, credit: true },
      });
      const prevBalance = (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);

      // Create ledger credit entry
      await tx.accountLedger.create({
        data: {
          schoolId,
          studentId: data.studentId,
          type: "Credit",
          description: `Credit Note ${creditNoteNumber} - ${data.reason}`,
          debit: 0,
          credit: data.amount,
          balance: prevBalance - data.amount,
          reference: creditNote.id,
          createdBy: auth.user.id,
        },
      });

      return creditNote;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error issuing credit note:", error);
    return NextResponse.json({ error: "Failed to issue credit note" }, { status: 500 });
  }
}
