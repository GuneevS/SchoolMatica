import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { formatCurrency } from "@/lib/utils/currency";

// GET - Generate PDF statement for a student
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
    const hasDateFilter = startDate || endDate;

    // Verify parent has access to this student
    const parentUser = await prisma.parentUser.findUnique({
      where: { userId: auth.user.id },
      include: {
        contacts: {
          where: { studentId },
          include: {
            student: {
              include: {
                classGroup: {
                  include: { school: true },
                },
                invoices: {
                  orderBy: { createdAt: "desc" },
                },
                ledgerEntries: {
                  where: hasDateFilter ? { createdAt: dateFilter } : undefined,
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!parentUser || parentUser.contacts.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const student = parentUser.contacts[0].student;
    const school = student.classGroup.school;
    const bankDetails = school.bankDetails as { bankName?: string; accountNumber?: string; branchCode?: string; accountHolder?: string; reference?: string } | null;

    // Calculate totals
    const totalDebit = student.ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = student.ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
    const balance = totalDebit - totalCredit;

    // Generate HTML for PDF
    const statementDate = new Date().toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Statement - ${student.firstName} ${student.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a2e; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
    .school-name { font-size: 24px; font-weight: bold; color: #6366f1; }
    .statement-title { font-size: 18px; color: #64748b; margin-top: 8px; }
    .statement-date { text-align: right; }
    .student-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .student-info h3 { font-size: 16px; margin-bottom: 10px; color: #334155; }
    .student-info p { color: #64748b; }
    .summary-box { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary-item { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-item.balance { background: ${balance > 0 ? "#fef2f2" : "#f0fdf4"}; }
    .summary-item.balance .value { color: ${balance > 0 ? "#dc2626" : "#16a34a"}; }
    .summary-item .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-item .value { font-size: 24px; font-weight: bold; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .debit { color: #dc2626; }
    .credit { color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10px; }
    .payment-info { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
    .payment-info h4 { margin-bottom: 10px; color: #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="school-name">${school.name}</div>
        <div class="statement-title">Account Statement</div>
      </div>
      <div class="statement-date">
        <p><strong>Statement Date:</strong> ${statementDate}</p>
        <p><strong>Account #:</strong> ${student.admissionNumber}</p>
        ${hasDateFilter ? `<p><strong>Period:</strong> ${startDate || "Start"} to ${endDate || "Present"}</p>` : ""}
      </div>
    </div>

    <div class="student-info">
      <h3>Student Information</h3>
      <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
      <p><strong>Class:</strong> ${student.classGroup.name} (Grade ${student.classGroup.grade})</p>
      <p><strong>Admission Number:</strong> ${student.admissionNumber}</p>
    </div>

    <div class="summary-box">
      <div class="summary-item">
        <div class="label">Total Invoiced</div>
        <div class="value">${formatCurrency(totalDebit)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Total Paid</div>
        <div class="value" style="color: #16a34a;">${formatCurrency(totalCredit)}</div>
      </div>
      <div class="summary-item balance">
        <div class="label">Balance Due</div>
        <div class="value">${formatCurrency(balance)}</div>
      </div>
    </div>

    <h3>Transaction History</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Type</th>
          <th class="text-right">Debit</th>
          <th class="text-right">Credit</th>
          <th class="text-right">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${student.ledgerEntries
          .map(
            (entry) => `
          <tr>
            <td>${new Date(entry.createdAt).toLocaleDateString("en-ZA")}</td>
            <td>${entry.description}</td>
            <td>${entry.type}</td>
            <td class="text-right ${entry.debit > 0 ? "debit" : ""}">${entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</td>
            <td class="text-right ${entry.credit > 0 ? "credit" : ""}">${entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</td>
            <td class="text-right">${formatCurrency(entry.balance)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    ${
      balance > 0
        ? `
    <div class="payment-info">
      <h4>Payment Information</h4>
      ${bankDetails && bankDetails.bankName ? `
      <p><strong>Bank:</strong> ${bankDetails.bankName}</p>
      <p><strong>Account Holder:</strong> ${bankDetails.accountHolder || school.name}</p>
      <p><strong>Account Number:</strong> ${bankDetails.accountNumber || "Contact school"}</p>
      <p><strong>Branch Code:</strong> ${bankDetails.branchCode || "N/A"}</p>
      ` : `<p>Please contact the school finance office for banking details.</p>`}
      <p><strong>Reference:</strong> ${student.admissionNumber}</p>
      <p style="margin-top: 8px; font-size: 11px; color: #64748b;">Please use your child's admission number as the payment reference. Payments can also be made via the parent portal.</p>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Generated by SchoolMatica on ${statementDate}</p>
      <p>${school.name} • South Africa</p>
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML (for browser rendering to PDF, or can be converted server-side with puppeteer/pdf-lib)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="statement-${student.admissionNumber}-${new Date().toISOString().split("T")[0]}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating statement:", error);
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 });
  }
}
