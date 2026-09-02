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
  const prefix = `INV-${year}-`;
  const existing = await tx.invoice.findMany({
    where: { schoolId, invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });

  let max = 0;
  for (const row of existing) {
    const match = row.invoiceNumber.match(/^INV-\d{4}-(\d+)$/);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }

  return `${prefix}${String(max + 1).padStart(5, "0")}`;
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
  const prefix = `PAY-${year}-`;
  const existing = await tx.payment.findMany({
    where: { paymentRef: { startsWith: prefix } },
    select: { paymentRef: true },
  });

  let max = 0;
  for (const row of existing) {
    const match = row.paymentRef.match(/^PAY-\d{4}-(\d+)$/);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }

  return `${prefix}${String(max + 1).padStart(5, "0")}`;
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
  const prefix = `REC-${year}-`;
  const existing = await tx.payment.findMany({
    where: { receiptNumber: { startsWith: prefix } },
    select: { receiptNumber: true },
  });

  let max = 0;
  for (const row of existing) {
    const match = row.receiptNumber?.match(/^REC-\d{4}-(\d+)$/);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }

  return `${prefix}${String(max + 1).padStart(5, "0")}`;
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
