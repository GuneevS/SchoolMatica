import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// PayFast webhook handler - ITN (Instant Transaction Notification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const data = Object.fromEntries(params);

    // Verify payment is from PayFast (signature validation)
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const signature = data.signature;
    delete data.signature;

    const paramString = Object.keys(data)
      .filter((key) => data[key] !== "")
      .sort()
      .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
      .join("&");

    const signatureString = passphrase
      ? `${paramString}&passphrase=${encodeURIComponent(passphrase)}`
      : paramString;

    const calculatedSignature = crypto.createHash("md5").update(signatureString).digest("hex");

    if (signature !== calculatedSignature) {
      console.error("Invalid PayFast signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // Get payment details
    const paymentId = data.m_payment_id;
    const paymentStatus = data.payment_status;
    const amountGross = parseFloat(data.amount_gross);
    const invoiceId = data.custom_str1;

    if (!paymentId) {
      return new NextResponse("Missing payment ID", { status: 400 });
    }

    // Get the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      console.error("Payment not found:", paymentId);
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Update payment based on status
    if (paymentStatus === "COMPLETE") {
      // Payment successful
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "Completed",
            gatewayRef: data.pf_payment_id,
            processedAt: new Date(),
            metadata: {
              ...(payment.metadata as object || {}),
              payFastResponse: data,
            },
          },
        });

        // Update invoice
        const newPaidAmount = payment.invoice.paidAmount + amountGross;
        const newBalanceDue = payment.invoice.totalAmount - newPaidAmount;
        const newStatus = newBalanceDue <= 0 ? "Paid" : "Partially Paid";

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            status: newStatus,
          },
        });

        // Create ledger entry
        await tx.accountLedger.create({
          data: {
            schoolId: payment.invoice.schoolId,
            studentId: payment.invoice.studentId,
            type: "Payment",
            description: `Online Payment ${payment.paymentRef} - PayFast`,
            debit: 0,
            credit: amountGross,
            balance: newBalanceDue,
            reference: payment.id,
          },
        });
      });

      console.log("Payment completed:", paymentId);
    } else if (paymentStatus === "CANCELLED") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "Failed",
          failureReason: "Payment cancelled by user",
          metadata: {
            ...(payment.metadata as object || {}),
            payFastResponse: data,
          },
        },
      });
    } else if (paymentStatus === "FAILED") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "Failed",
          failureReason: data.reason || "Payment failed",
          metadata: {
            ...(payment.metadata as object || {}),
            payFastResponse: data,
          },
        },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("PayFast webhook error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
