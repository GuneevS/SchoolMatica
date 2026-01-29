import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { z } from "zod";

// Schema for updating invoices
const updateInvoiceSchema = z.object({
  status: z.enum(["Draft", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"]).optional(),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date").optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    amount: z.number().positive(),
    quantity: z.number().int().positive().default(1),
  })).optional(),
  discountAmount: z.number().min(0).optional(),
});

// GET - Get single invoice with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;
    const schoolId = auth.user.schoolId;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(schoolId && !auth.isSuperAdmin && { schoolId }),
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
          select: { fullName: true, email: true, phone: true, relationship: true },
        },
        feeStructure: {
          select: { name: true, baseAmount: true, components: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        school: {
          select: { name: true, shortCode: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PATCH - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;
    const schoolId = auth.user.schoolId;

    // Check invoice exists and belongs to school
    const existing = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(schoolId && !auth.isSuperAdmin && { schoolId }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Don't allow editing paid or cancelled invoices
    if (existing.status === "Paid" || existing.status === "Cancelled") {
      return NextResponse.json(
        { error: `Cannot modify ${existing.status.toLowerCase()} invoices` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Recalculate totals if line items changed
    let updateData: Record<string, unknown> = {};

    if (data.lineItems) {
      const subtotal = data.lineItems.reduce(
        (sum, item) => sum + item.amount * item.quantity,
        0
      );
      const discountAmount = data.discountAmount ?? existing.discountAmount;
      const totalAmount = subtotal - discountAmount + existing.taxAmount;
      const balanceDue = totalAmount - existing.paidAmount;

      updateData = {
        ...updateData,
        lineItems: data.lineItems,
        subtotal,
        discountAmount,
        totalAmount,
        balanceDue,
      };
    } else if (data.discountAmount !== undefined) {
      const totalAmount = existing.subtotal - data.discountAmount + existing.taxAmount;
      const balanceDue = totalAmount - existing.paidAmount;
      updateData = {
        ...updateData,
        discountAmount: data.discountAmount,
        totalAmount,
        balanceDue,
      };
    }

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "Sent" && !existing.sentAt) {
        updateData.sentAt = new Date();
      }
    }

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        student: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE - Cancel invoice (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;
    const schoolId = auth.user.schoolId;

    const existing = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(schoolId && !auth.isSuperAdmin && { schoolId }),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Can only cancel draft or sent invoices
    if (!["Draft", "Sent"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Can only cancel draft or sent invoices" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "Cancelled" },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error cancelling invoice:", error);
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}
