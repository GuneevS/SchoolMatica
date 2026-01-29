import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

// GET - Get account ledger for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;
    const schoolId = auth.user.schoolId;

    // Verify student exists and belongs to school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classGroup: {
          ...(schoolId && !auth.isSuperAdmin && { schoolId }),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        classGroup: {
          select: { name: true, schoolId: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get ledger entries
    const ledgerEntries = await prisma.accountLedger.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate current balance
    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const currentBalance = totalDebit - totalCredit;

    // Get summary of invoices and payments
    const invoiceSummary = await prisma.invoice.aggregate({
      where: { studentId },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balanceDue: true,
      },
      _count: true,
    });

    const paymentSummary = await prisma.payment.aggregate({
      where: {
        invoice: { studentId },
        status: "Completed",
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      student,
      currentBalance,
      summary: {
        totalInvoiced: invoiceSummary._sum.totalAmount || 0,
        totalPaid: invoiceSummary._sum.paidAmount || 0,
        totalOutstanding: invoiceSummary._sum.balanceDue || 0,
        invoiceCount: invoiceSummary._count,
        paymentCount: paymentSummary._count,
      },
      entries: ledgerEntries,
    });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}

// POST - Create adjustment entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;
    const schoolId = auth.user.schoolId;

    // Verify student exists
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        classGroup: {
          ...(schoolId && !auth.isSuperAdmin && { schoolId }),
        },
      },
      include: {
        classGroup: { select: { schoolId: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, description, amount } = body;

    if (!type || !description || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, description, amount" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["Credit", "Adjustment", "WriteOff"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Calculate running balance
    const lastEntry = await prisma.accountLedger.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    const previousBalance = lastEntry?.balance || 0;
    const isCredit = type === "Credit" || (type === "Adjustment" && amount < 0);
    const debit = isCredit ? 0 : Math.abs(amount);
    const credit = isCredit ? Math.abs(amount) : 0;
    const newBalance = previousBalance + debit - credit;

    const entry = await prisma.accountLedger.create({
      data: {
        schoolId: student.classGroup.schoolId,
        studentId,
        type,
        description,
        debit,
        credit,
        balance: newBalance,
        createdBy: auth.user.id,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating ledger entry:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
