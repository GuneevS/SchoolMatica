import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

// Schema for creating invoices
const createInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  feeStructureId: z.string().optional(),
  parentContactId: z.string().optional(),
  term: z.string().min(1, "Term is required"),
  year: z.number().int().min(2020).max(2100),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  lineItems: z.array(z.object({
    description: z.string(),
    amount: z.number().positive(),
    quantity: z.number().int().positive().default(1),
  })),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Generate invoice number: INV-YYYY-XXXXX
async function generateInvoiceNumber(schoolId: string, year: number): Promise<string> {
  const count = await prisma.invoice.count({
    where: { schoolId, year },
  });
  const paddedNumber = String(count + 1).padStart(5, "0");
  return `INV-${year}-${paddedNumber}`;
}

// GET - List invoices for the school
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = auth.user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term");
    const year = searchParams.get("year");

    const invoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        ...(status && { status }),
        ...(studentId && { studentId }),
        ...(term && { term }),
        ...(year && { year: parseInt(year) }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            classGroup: {
              select: { name: true, grade: true },
            },
          },
        },
        parentContact: {
          select: { fullName: true, email: true, phone: true },
        },
        feeStructure: {
          select: { name: true, baseAmount: true },
        },
        payments: {
          select: {
            id: true,
            paymentRef: true,
            amount: true,
            method: true,
            status: true,
            processedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = auth.user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Calculate totals
    const subtotal = data.lineItems.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0
    );
    const taxAmount = 0; // VAT can be added if needed: subtotal * 0.15
    const totalAmount = subtotal - data.discountAmount + taxAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(schoolId, data.year);

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        schoolId,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId || null,
        parentContactId: data.parentContactId || null,
        term: data.term,
        year: data.year,
        dueDate: new Date(data.dueDate),
        subtotal,
        discountAmount: data.discountAmount,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        lineItems: data.lineItems,
        notes: data.notes,
        status: "Draft",
      },
      include: {
        student: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create ledger entry for the invoice
    await prisma.accountLedger.create({
      data: {
        schoolId,
        studentId: data.studentId,
        type: "Invoice",
        description: `Invoice ${invoiceNumber} - ${invoice.student.firstName} ${invoice.student.lastName}`,
        debit: totalAmount,
        credit: 0,
        balance: totalAmount, // This should be running balance - simplified here
        reference: invoice.id,
        createdBy: auth.user.id,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
