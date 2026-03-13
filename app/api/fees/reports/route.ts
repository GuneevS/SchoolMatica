import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

// GET - Financial reports
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const requestedSchoolId = searchParams.get("schoolId");
    const schoolId = auth.isSuperAdmin
      ? (requestedSchoolId || auth.user.schoolId)
      : auth.user.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    switch (reportType) {
      case "debtors-age":
        return debtorsAgeReport(schoolId);
      case "collection":
        return collectionReport(schoolId, searchParams);
      case "income-summary":
        return incomeSummaryReport(schoolId, searchParams);
      case "outstanding":
        return outstandingReport(schoolId);
      default:
        return NextResponse.json(
          { error: "Invalid report type. Use: debtors-age, collection, income-summary, outstanding" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

// Debtors age analysis: 30/60/90/120+ day buckets
async function debtorsAgeReport(schoolId: string) {
  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const day120 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

  const invoices = await prisma.invoice.findMany({
    where: {
      schoolId,
      balanceDue: { gt: 0 },
      status: { not: "Cancelled" },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNumber: true,
          classGroup: { select: { name: true, grade: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  type Bucket = "current" | "30days" | "60days" | "90days" | "120plus";

  const buckets: Record<Bucket, typeof invoices> = {
    current: [],
    "30days": [],
    "60days": [],
    "90days": [],
    "120plus": [],
  };

  for (const inv of invoices) {
    const dueDate = inv.dueDate || inv.createdAt;
    if (dueDate >= day30) buckets.current.push(inv);
    else if (dueDate >= day60) buckets["30days"].push(inv);
    else if (dueDate >= day90) buckets["60days"].push(inv);
    else if (dueDate >= day120) buckets["90days"].push(inv);
    else buckets["120plus"].push(inv);
  }

  const sumBalance = (items: typeof invoices) =>
    items.reduce((sum: number, i) => sum + i.balanceDue, 0);

  return NextResponse.json({
    reportType: "debtors-age",
    generatedAt: now.toISOString(),
    summary: {
      current: { count: buckets.current.length, total: sumBalance(buckets.current) },
      "30days": { count: buckets["30days"].length, total: sumBalance(buckets["30days"]) },
      "60days": { count: buckets["60days"].length, total: sumBalance(buckets["60days"]) },
      "90days": { count: buckets["90days"].length, total: sumBalance(buckets["90days"]) },
      "120plus": { count: buckets["120plus"].length, total: sumBalance(buckets["120plus"]) },
      grandTotal: sumBalance(invoices),
    },
    details: buckets,
  });
}

// Collection report by grade/term with collection rates
async function collectionReport(schoolId: string, params: URLSearchParams) {
  const year = parseInt(params.get("year") || String(new Date().getFullYear()));
  const term = params.get("term"); // optional

  const invoiceWhere = {
    schoolId,
    year,
    ...(term && { term }),
    status: { not: "Cancelled" },
  };

  const invoices = await prisma.invoice.findMany({
    where: invoiceWhere,
    include: {
      student: {
        select: {
          classGroup: { select: { grade: true, name: true } },
        },
      },
    },
  });

  // Group by grade
  const byGrade: Record<string, { invoiced: number; collected: number; count: number }> = {};

  for (const inv of invoices) {
    const grade = inv.student.classGroup.grade;
    if (!byGrade[grade]) {
      byGrade[grade] = { invoiced: 0, collected: 0, count: 0 };
    }
    byGrade[grade].invoiced += inv.totalAmount;
    byGrade[grade].collected += inv.paidAmount;
    byGrade[grade].count += 1;
  }

  const totalInvoiced = invoices.reduce((sum: number, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.reduce((sum: number, i) => sum + i.paidAmount, 0);

  return NextResponse.json({
    reportType: "collection",
    generatedAt: new Date().toISOString(),
    filters: { year, term },
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding: totalInvoiced - totalCollected,
      collectionRate: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) + "%" : "0%",
    },
    byGrade: Object.entries(byGrade)
      .map(([grade, data]) => ({
        grade,
        ...data,
        outstanding: data.invoiced - data.collected,
        collectionRate: data.invoiced > 0
          ? ((data.collected / data.invoiced) * 100).toFixed(1) + "%"
          : "0%",
      }))
      .sort((a, b) => parseInt(a.grade) - parseInt(b.grade)),
  });
}

// Monthly income breakdown by payment method
async function incomeSummaryReport(schoolId: string, params: URLSearchParams) {
  const year = parseInt(params.get("year") || String(new Date().getFullYear()));

  const payments = await prisma.payment.findMany({
    where: {
      invoice: { schoolId },
      status: "Completed",
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    select: {
      amount: true,
      method: true,
      createdAt: true,
    },
  });

  // Group by month and method
  const monthly: Record<string, Record<string, number>> = {};
  const methodTotals: Record<string, number> = {};

  for (const payment of payments) {
    const month = new Date(payment.createdAt).toLocaleString("en-ZA", { month: "short", year: "numeric" });
    const monthKey = new Date(payment.createdAt).toISOString().slice(0, 7); // YYYY-MM for sorting

    if (!monthly[monthKey]) {
      monthly[monthKey] = { _label: 0 }; // placeholder
    }
    monthly[monthKey]._label = 0; // we'll fix below
    monthly[monthKey][payment.method] = (monthly[monthKey][payment.method] || 0) + payment.amount;

    methodTotals[payment.method] = (methodTotals[payment.method] || 0) + payment.amount;
  }

  const grandTotal = payments.reduce((sum: number, p) => sum + p.amount, 0);

  // Format monthly data with labels
  const months = Object.keys(monthly).sort();
  const formattedMonthly = months.map((key) => {
    const data = monthly[key];
    delete data._label;
    const monthTotal = Object.values(data).reduce((sum: number, v: number) => sum + v, 0);
    return {
      month: key,
      label: new Date(key + "-01").toLocaleString("en-ZA", { month: "long", year: "numeric" }),
      total: monthTotal,
      byMethod: data,
    };
  });

  return NextResponse.json({
    reportType: "income-summary",
    generatedAt: new Date().toISOString(),
    filters: { year },
    summary: {
      grandTotal,
      paymentCount: payments.length,
      methodTotals,
    },
    monthly: formattedMonthly,
  });
}

// Top outstanding accounts
async function outstandingReport(schoolId: string) {
  const students = await prisma.student.findMany({
    where: {
      classGroup: { schoolId },
      invoices: {
        some: { balanceDue: { gt: 0 }, status: { not: "Cancelled" } },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      admissionNumber: true,
      classGroup: { select: { name: true, grade: true } },
      invoices: {
        where: { balanceDue: { gt: 0 }, status: { not: "Cancelled" } },
        select: {
          invoiceNumber: true,
          totalAmount: true,
          paidAmount: true,
          balanceDue: true,
          dueDate: true,
          term: true,
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const accounts = students
    .map((s: (typeof students)[number]) => ({
      studentId: s.id,
      name: `${s.firstName} ${s.lastName}`,
      admissionNumber: s.admissionNumber,
      class: s.classGroup.name,
      grade: s.classGroup.grade,
      totalOutstanding: s.invoices.reduce((sum: number, i) => sum + i.balanceDue, 0),
      invoiceCount: s.invoices.length,
      oldestDueDate: s.invoices[0]?.dueDate || null,
      invoices: s.invoices,
    }))
    .sort((a: { totalOutstanding: number }, b: { totalOutstanding: number }) => b.totalOutstanding - a.totalOutstanding);

  const grandTotal = accounts.reduce((sum: number, a) => sum + a.totalOutstanding, 0);

  return NextResponse.json({
    reportType: "outstanding",
    generatedAt: new Date().toISOString(),
    summary: {
      totalAccounts: accounts.length,
      grandTotal,
      top10Total: accounts.slice(0, 10).reduce((sum: number, a) => sum + a.totalOutstanding, 0),
    },
    accounts,
  });
}
