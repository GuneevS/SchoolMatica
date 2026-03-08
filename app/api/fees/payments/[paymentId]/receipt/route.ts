import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { formatCurrency } from "@/lib/utils/currency";

// GET - Generate receipt HTML for a payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                classGroup: {
                  include: { school: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const invoice = payment.invoice;
    const student = invoice.student;
    const school = student.classGroup.school;

    // Verify school access
    if (!auth.isSuperAdmin && auth.user.schoolId !== school.id) {
      // Check parent access
      const parentAccess = await prisma.parentContact.findFirst({
        where: {
          studentId: student.id,
          parentUser: { userId: auth.user.id },
        },
      });
      if (!parentAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const bankDetails = school.bankDetails as {
      bankName?: string;
      accountNumber?: string;
      branchCode?: string;
      accountHolder?: string;
    } | null;

    const paymentDate = new Date(payment.processedAt || payment.createdAt).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${payment.receiptNumber || payment.paymentRef}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a2e; line-height: 1.6; }
    .container { max-width: 700px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
    .school-name { font-size: 22px; font-weight: bold; color: #6366f1; }
    .receipt-badge { background: #6366f1; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
    .receipt-number { font-size: 16px; font-weight: bold; margin-top: 8px; color: #334155; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .detail-box { padding: 16px; background: #f8fafc; border-radius: 8px; }
    .detail-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; }
    .detail-box p { color: #334155; }
    .amount-box { text-align: center; padding: 30px; background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; margin: 30px 0; }
    .amount-box .label { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .amount-box .amount { font-size: 36px; font-weight: bold; color: #16a34a; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-completed { background: #dcfce7; color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
    @media print { .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="school-name">${school.name}</div>
        <div class="receipt-number">${payment.receiptNumber || payment.paymentRef}</div>
      </div>
      <div class="receipt-badge">RECEIPT</div>
    </div>

    <div class="details-grid">
      <div class="detail-box">
        <h4>Student</h4>
        <p><strong>${student.firstName} ${student.lastName}</strong></p>
        <p>Admission #: ${student.admissionNumber}</p>
        <p>Class: ${student.classGroup.name} (Grade ${student.classGroup.grade})</p>
      </div>
      <div class="detail-box">
        <h4>Payment Details</h4>
        <p><strong>Date:</strong> ${paymentDate}</p>
        <p><strong>Method:</strong> ${payment.method}</p>
        <p><strong>Reference:</strong> ${payment.paymentRef}</p>
        ${payment.gatewayRef ? `<p><strong>Gateway Ref:</strong> ${payment.gatewayRef}</p>` : ""}
        <p><strong>Status:</strong> <span class="status-badge status-completed">${payment.status}</span></p>
      </div>
    </div>

    <div class="amount-box">
      <div class="label">Amount Received</div>
      <div class="amount">${formatCurrency(payment.amount)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Invoice #</th>
          <th class="text-right">Invoice Total</th>
          <th class="text-right">Amount Paid</th>
          <th class="text-right">Balance Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.description || "School Fees"}</td>
          <td>${invoice.invoiceNumber}</td>
          <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
          <td class="text-right">${formatCurrency(payment.amount)}</td>
          <td class="text-right">${formatCurrency(invoice.balanceDue)}</td>
        </tr>
      </tbody>
    </table>

    ${payment.paidBy ? `<p style="margin-top: 10px; color: #64748b;"><strong>Paid by:</strong> ${payment.paidBy}${payment.paidByContact ? ` (${payment.paidByContact})` : ""}</p>` : ""}

    ${bankDetails && bankDetails.bankName ? `
    <div class="detail-box" style="margin-top: 20px;">
      <h4>School Banking Details</h4>
      <p><strong>Bank:</strong> ${bankDetails.bankName}</p>
      <p><strong>Account Holder:</strong> ${bankDetails.accountHolder || school.name}</p>
      <p><strong>Account Number:</strong> ${bankDetails.accountNumber || "N/A"}</p>
      <p><strong>Branch Code:</strong> ${bankDetails.branchCode || "N/A"}</p>
    </div>
    ` : ""}

    <div class="footer">
      <p>This is an official receipt generated by SchoolMatica</p>
      <p>${school.name} &bull; South Africa</p>
      <p>Generated on ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="receipt-${payment.receiptNumber || payment.paymentRef}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
