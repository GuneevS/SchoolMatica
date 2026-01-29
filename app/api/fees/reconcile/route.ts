import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

// POST - Reconcile invoices (check for overdue, update statuses)
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

    const now = new Date();

    // Find and mark overdue invoices
    const overdueResult = await prisma.invoice.updateMany({
      where: {
        ...(schoolId && { schoolId }),
        status: { in: ["Sent", "Partially Paid"] },
        dueDate: { lt: now },
      },
      data: { status: "Overdue" },
    });

    // Get reconciliation summary
    const summary = await prisma.invoice.groupBy({
      by: ["status"],
      where: { ...(schoolId && { schoolId }) },
      _count: true,
      _sum: { totalAmount: true, paidAmount: true, balanceDue: true },
    });

    // Get total outstanding
    const outstanding = await prisma.invoice.aggregate({
      where: {
        ...(schoolId && { schoolId }),
        status: { in: ["Sent", "Partially Paid", "Overdue"] },
      },
      _sum: { balanceDue: true },
    });

    // Get collection rate
    const totals = await prisma.invoice.aggregate({
      where: {
        ...(schoolId && { schoolId }),
        status: { not: "Cancelled" },
      },
      _sum: { totalAmount: true, paidAmount: true },
    });

    const collectionRate =
      totals._sum.totalAmount && totals._sum.totalAmount > 0
        ? ((totals._sum.paidAmount || 0) / totals._sum.totalAmount) * 100
        : 0;

    return NextResponse.json({
      reconciled: {
        overdueInvoicesMarked: overdueResult.count,
        timestamp: now.toISOString(),
      },
      summary: summary.map((s) => ({
        status: s.status,
        count: s._count,
        totalAmount: s._sum.totalAmount || 0,
        paidAmount: s._sum.paidAmount || 0,
        balanceDue: s._sum.balanceDue || 0,
      })),
      totals: {
        totalOutstanding: outstanding._sum.balanceDue || 0,
        totalInvoiced: totals._sum.totalAmount || 0,
        totalCollected: totals._sum.paidAmount || 0,
        collectionRate: Math.round(collectionRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error reconciling:", error);
    return NextResponse.json({ error: "Failed to reconcile" }, { status: 500 });
  }
}

// GET - Get fee structures with collection stats
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
    const year = searchParams.get("year") || new Date().getFullYear();

    // Get fee structures with collection stats
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        ...(schoolId && { schoolId }),
        year: parseInt(year as string),
        isActive: true,
      },
      include: {
        invoices: {
          select: {
            totalAmount: true,
            paidAmount: true,
            balanceDue: true,
            status: true,
          },
        },
        discounts: {
          where: { isActive: true },
          select: {
            name: true,
            type: true,
            value: true,
            currentUsage: true,
          },
        },
      },
    });

    const structuresWithStats = feeStructures.map((fs) => {
      const totalInvoiced = fs.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalCollected = fs.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalOutstanding = fs.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const overdueCount = fs.invoices.filter((inv) => inv.status === "Overdue").length;

      return {
        id: fs.id,
        name: fs.name,
        grade: fs.grade,
        baseAmount: fs.baseAmount,
        term: fs.term,
        year: fs.year,
        invoiceCount: fs.invoices.length,
        stats: {
          totalInvoiced,
          totalCollected,
          totalOutstanding,
          collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
          overdueCount,
        },
        discounts: fs.discounts,
      };
    });

    return NextResponse.json(structuresWithStats);
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
