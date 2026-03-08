/**
 * Atomic reference number generator for invoices, payments, etc.
 * Prevents race conditions by using serialized database transactions.
 */

import { PrismaClient, Prisma } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Generate a unique invoice number within a transaction.
 * Format: INV-{year}-{00001}
 *
 * MUST be called inside a prisma.$transaction() to prevent race conditions.
 */
export async function generateInvoiceNumber(
  tx: PrismaTransactionClient,
  schoolId: string,
  year: number
): Promise<string> {
  // Use findMany with orderBy to get the latest invoice number atomically
  const latest = await tx.invoice.findFirst({
    where: { schoolId, year },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (latest?.invoiceNumber) {
    // Extract the numeric part from "INV-2026-00005" -> 5
    const match = latest.invoiceNumber.match(/INV-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `INV-${year}-${String(nextNum).padStart(5, "0")}`;
}

/**
 * Generate a unique payment reference within a transaction.
 * Format: PAY-{year}-{00001}
 *
 * MUST be called inside a prisma.$transaction() to prevent race conditions.
 */
export async function generatePaymentRef(
  tx: PrismaTransactionClient,
  year: number
): Promise<string> {
  const latest = await tx.payment.findFirst({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    orderBy: { paymentRef: "desc" },
    select: { paymentRef: true },
  });

  let nextNum = 1;
  if (latest?.paymentRef) {
    const match = latest.paymentRef.match(/PAY-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `PAY-${year}-${String(nextNum).padStart(5, "0")}`;
}

/**
 * Generate a unique receipt number within a transaction.
 * Format: REC-{year}-{00001}
 *
 * MUST be called inside a prisma.$transaction() to prevent race conditions.
 */
export async function generateReceiptNumber(
  tx: PrismaTransactionClient,
  year: number
): Promise<string> {
  const latest = await tx.payment.findFirst({
    where: {
      receiptNumber: { not: null },
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  let nextNum = 1;
  if (latest?.receiptNumber) {
    const match = latest.receiptNumber.match(/REC-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `REC-${year}-${String(nextNum).padStart(5, "0")}`;
}

/**
 * Generate a unique credit note number within a transaction.
 * Format: CN-{year}-{00001}
 *
 * MUST be called inside a prisma.$transaction() to prevent race conditions.
 */
export async function generateCreditNoteNumber(
  tx: PrismaTransactionClient,
  schoolId: string,
  year: number
): Promise<string> {
  const latest = await tx.creditNote.findFirst({
    where: {
      schoolId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    orderBy: { creditNoteNumber: "desc" },
    select: { creditNoteNumber: true },
  });

  let nextNum = 1;
  if (latest?.creditNoteNumber) {
    const match = latest.creditNoteNumber.match(/CN-\d{4}-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `CN-${year}-${String(nextNum).padStart(5, "0")}`;
}
