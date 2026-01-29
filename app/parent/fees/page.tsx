import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ParentFeesClient } from "./fees-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fee Statements | Parent Portal | SchoolMatica",
  description: "View your children's fee statements and make payments.",
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function getParentFeeData(userId: string) {
  // Get parent user with children
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                select: { name: true, grade: true, schoolId: true },
              },
              invoices: {
                include: {
                  payments: {
                    where: { status: "Completed" },
                    orderBy: { createdAt: "desc" },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
              ledgerEntries: {
                orderBy: { createdAt: "desc" },
                take: 50,
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    return null;
  }

  // Process data for each child
  const childrenData = parentUser.contacts.map((contact) => {
    const student = contact.student;
    const invoices = student.invoices;
    const ledger = student.ledgerEntries;

    // Calculate totals
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        className: student.classGroup.name,
        grade: student.classGroup.grade,
      },
      summary: {
        totalOutstanding,
        totalPaid,
        totalInvoiced,
        invoiceCount: invoices.length,
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        term: inv.term,
        year: inv.year,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
        lineItems: inv.lineItems as Array<{ description: string; amount: number; quantity: number }>,
        payments: inv.payments.map((p) => ({
          id: p.id,
          paymentRef: p.paymentRef,
          amount: p.amount,
          method: p.method,
          date: p.processedAt?.toISOString() || p.createdAt.toISOString(),
        })),
      })),
      transactions: ledger.map((entry) => ({
        id: entry.id,
        date: entry.createdAt.toISOString(),
        type: entry.type,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        balance: entry.balance,
      })),
    };
  });

  return childrenData;
}

export default async function ParentFeesPage() {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const feeData = await getParentFeeData(auth.user.id);

  if (!feeData || feeData.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Statements</h1>
          <p className="text-muted-foreground mt-1">
            View and pay school fees for your children.
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>No children linked to your account.</p>
          <p className="text-sm mt-2">
            Please contact your school to link your children to your parent account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Statements</h1>
        <p className="text-muted-foreground mt-1">
          View and pay school fees for your children.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <ParentFeesClient childrenData={feeData} />
      </Suspense>
    </div>
  );
}
