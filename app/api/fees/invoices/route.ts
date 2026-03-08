import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { generateInvoiceNumber } from "@/lib/utils/reference-generator";
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

// GET - List invoices for the school
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term");
    const year = searchParams.get("year");
    
    // Super admins can specify schoolId via query param
    const requestedSchoolId = searchParams.get("schoolId");
    const schoolId = auth.isSuperAdmin 
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;
      
    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(schoolId && { schoolId }),
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

    const body = await request.json();
    
    // Super admins can specify schoolId in body
    const schoolId = auth.isSuperAdmin 
      ? (body.schoolId || auth.user.schoolId)
      : auth.user.schoolId;
      
    if (!schoolId) {
      return NextResponse.json({ error: "No school context. Super admins must specify schoolId." }, { status: 400 });
    }

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

    // Create invoice + ledger entry atomically with unique invoice number
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx, schoolId, data.year);

      const inv = await tx.invoice.create({
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

      // Calculate cumulative running balance
      const agg = await tx.accountLedger.aggregate({
        where: { studentId: data.studentId },
        _sum: { debit: true, credit: true },
      });
      const prevBalance = (agg._sum.debit ?? 0) - (agg._sum.credit ?? 0);

      await tx.accountLedger.create({
        data: {
          schoolId,
          studentId: data.studentId,
          type: "Invoice",
          description: `Invoice ${invoiceNumber} - ${inv.student.firstName} ${inv.student.lastName}`,
          debit: totalAmount,
          credit: 0,
          balance: prevBalance + totalAmount,
          reference: inv.id,
          createdBy: auth.user.id,
        },
      });

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
