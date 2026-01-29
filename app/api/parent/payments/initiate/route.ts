import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import crypto from "crypto";

// PayFast configuration (sandbox for development)
const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || "10000100",
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a",
  passphrase: process.env.PAYFAST_PASSPHRASE || "",
  testMode: process.env.NODE_ENV !== "production",
  returnUrl: process.env.NEXT_PUBLIC_APP_URL + "/parent/fees?payment=success",
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL + "/parent/fees?payment=cancelled",
  notifyUrl: process.env.NEXT_PUBLIC_APP_URL + "/api/parent/payments/webhook",
};

// Generate PayFast signature
function generatePayFastSignature(data: Record<string, string>, passphrase: string): string {
  const params = Object.keys(data)
    .filter((key) => data[key] !== "")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const signatureString = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase)}` : params;

  return crypto.createHash("md5").update(signatureString).digest("hex");
}

// POST - Initiate payment for an invoice
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, paymentMethod } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, amount" },
        { status: 400 }
      );
    }

    // Verify parent has access to this invoice
    const parentUser = await prisma.parentUser.findUnique({
      where: { userId: auth.user.id },
      include: {
        contacts: {
          include: {
            student: {
              include: {
                invoices: {
                  where: { id: invoiceId },
                },
              },
            },
          },
        },
      },
    });

    const invoice = parentUser?.contacts
      .flatMap((c) => c.student.invoices)
      .find((inv) => inv.id === invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (amount > invoice.balanceDue) {
      return NextResponse.json(
        { error: "Payment amount exceeds balance due" },
        { status: 400 }
      );
    }

    // Get student details for payment reference
    const student = await prisma.student.findFirst({
      where: { id: invoice.studentId },
      include: {
        classGroup: {
          include: { school: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Generate payment reference
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        paymentRef,
        invoiceId,
        amount,
        method: paymentMethod || "PayFast",
        gateway: "PayFast",
        status: "Pending",
        metadata: {
          initiatedBy: auth.user.id,
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    // For PayFast integration
    if (paymentMethod === "PayFast" || !paymentMethod) {
      const payFastData: Record<string, string> = {
        merchant_id: PAYFAST_CONFIG.merchantId,
        merchant_key: PAYFAST_CONFIG.merchantKey,
        return_url: PAYFAST_CONFIG.returnUrl,
        cancel_url: PAYFAST_CONFIG.cancelUrl,
        notify_url: PAYFAST_CONFIG.notifyUrl,
        name_first: auth.user.displayName?.split(" ")[0] || "Parent",
        name_last: auth.user.displayName?.split(" ").slice(1).join(" ") || "",
        email_address: auth.user.email,
        m_payment_id: payment.id,
        amount: amount.toFixed(2),
        item_name: `School Fees - ${student.firstName} ${student.lastName}`,
        item_description: `Payment for invoice ${invoice.invoiceNumber}`,
        custom_str1: invoiceId,
        custom_str2: student.id,
      };

      const signature = generatePayFastSignature(payFastData, PAYFAST_CONFIG.passphrase);
      payFastData.signature = signature;

      const payFastUrl = PAYFAST_CONFIG.testMode
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        paymentRef,
        gateway: "PayFast",
        redirectUrl: payFastUrl,
        formData: payFastData,
      });
    }

    // For other payment methods (e.g., bank transfer reference)
    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentRef,
      bankDetails: {
        bankName: "First National Bank",
        accountName: student.classGroup.school.name,
        accountNumber: "62XXXXXXXX", // Would come from school settings
        branchCode: "250655",
        reference: `${student.admissionNumber}-${invoice.invoiceNumber}`,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
