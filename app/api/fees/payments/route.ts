import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

// Payment methods supported in South Africa
const PAYMENT_METHODS = [
  "EFT",
  "Card",
  "Cash",
  "ApplePay",
  "GooglePay",
  "PayFast",
  "Snapscan",
  "Ozow",
  "DebitOrder",
] as const;

// Schema for recording payments
const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(PAYMENT_METHODS),
  gateway: z.string().optional(),
  gatewayRef: z.string().optional(),
  paidBy: z.string().optional(),
  paidByContact: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Generate payment reference: PAY-YYYY-XXXXX
async function generatePaymentRef(year: number): Promise<string> {
  const count = await prisma.payment.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  const paddedNumber = String(count + 1).padStart(5, "0");
  return `PAY-${year}-${paddedNumber}`;
}

// GET - List payments
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = auth.user.schoolId;
    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const invoiceId = searchParams.get("invoiceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          ...(schoolId && { schoolId }),
        },
        ...(status && { status }),
        ...(method && { method }),
        ...(invoiceId && { invoiceId }),
        ...(startDate && {
          createdAt: {
            gte: new Date(startDate),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }),
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Record a payment
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
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: data.invoiceId,
        ...(schoolId && { schoolId }),
      },
      include: {
        student: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice is payable
    if (invoice.status === "Cancelled") {
      return NextResponse.json(
        { error: "Cannot pay a cancelled invoice" },
        { status: 400 }
      );
    }

    if (invoice.status === "Paid") {
      return NextResponse.json(
        { error: "Invoice is already fully paid" },
        { status: 400 }
      );
    }

    // Check if payment exceeds balance
    if (data.amount > invoice.balanceDue) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance due (R${invoice.balanceDue.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Generate payment reference
    const paymentRef = await generatePaymentRef(new Date().getFullYear());

    // Create payment and update invoice in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment
      const payment = await tx.payment.create({
        data: {
          paymentRef,
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          gateway: data.gateway,
          gatewayRef: data.gatewayRef,
          paidBy: data.paidBy,
          paidByContact: data.paidByContact,
          metadata: data.metadata,
          status: "Completed",
          processedAt: new Date(),
        },
      });

      // Update invoice amounts
      const newPaidAmount = invoice.paidAmount + data.amount;
      const newBalanceDue = invoice.totalAmount - newPaidAmount;
      const newStatus = newBalanceDue <= 0 ? "Paid" : "Partially Paid";

      const updatedInvoice = await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      });

      // Create ledger entry
      await tx.accountLedger.create({
        data: {
          schoolId: invoice.schoolId,
          studentId: invoice.studentId,
          type: "Payment",
          description: `Payment ${paymentRef} - ${data.method}`,
          debit: 0,
          credit: data.amount,
          balance: newBalanceDue,
          reference: payment.id,
          createdBy: auth.user.id,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
