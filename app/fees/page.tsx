import { getServerAuthContext, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FeesPageClient } from "./fees-client";

export const metadata = {
  title: "Fees & Accounting | SchoolMatica",
  description: "Manage school fees, invoices, payments, and financial records.",
};

// Check if user has finance access
async function checkFinanceAccess(auth: NonNullable<Awaited<ReturnType<typeof getServerAuthContext>>>) {
  // Finance access granted to: super admin, school admin, or users with finance permissions
  const financePermissions = [
    "finance:read",
    "finance:write",
    "fees:manage",
    "invoices:read",
    "invoices:write",
    "payments:read",
    "payments:write",
  ];
  
  // Super admin and school admin always have access
  if (auth.isSuperAdmin || auth.isAdmin) {
    return true;
  }
  
  // Check for finance-specific roles
  const financeRoles = ["bursar", "finance_admin", "accountant", "finance"];
  if (auth.roleAssignments.some(ra => financeRoles.includes(ra.role.key))) {
    return true;
  }
  
  // Check for specific finance permissions
  for (const perm of financePermissions) {
    if (auth.permissions.has(perm)) {
      return true;
    }
  }
  
  return false;
}

export default async function FeesPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");

  // For super admins without a school, get the first school or allow them to select
  let schoolId = auth.user.schoolId;
  
  // Super admins can access fees even without an assigned school
  if (!schoolId && auth.isSuperAdmin) {
    // Get the first school for super admin to view
    const firstSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (firstSchool) {
      schoolId = firstSchool.id;
    }
  }
  
  if (!schoolId) {
    redirect("/dashboard?error=no_school&message=No%20school%20available");
  }

  // Check finance access
  const hasFinanceAccess = await checkFinanceAccess(auth);
  if (!hasFinanceAccess) {
    redirect("/dashboard?error=unauthorized&message=Finance%20access%20required");
  }

  // Fetch invoices with related data
  const invoices = await prisma.invoice.findMany({
    where: { schoolId },
    include: {
      student: {
        include: {
          classGroup: true,
        },
      },
      parentContact: true,
      feeStructure: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch payments with related data
  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        schoolId,
      },
    },
    include: {
      invoice: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch fee structures with aggregated data
  const feeStructures = await prisma.feeStructure.findMany({
    where: { schoolId, isActive: true },
    include: {
      invoices: {
        select: {
          totalAmount: true,
          paidAmount: true,
        },
      },
    },
    orderBy: { year: "desc" },
  });

  // Fetch student discounts
  const studentDiscounts = await prisma.studentDiscount.findMany({
    where: {
      student: {
        classGroup: {
          schoolId,
        },
      },
    },
    include: {
      discount: true,
      student: true,
    },
  });

  // Transform data for the client component
  const transformedInvoices = invoices.map((inv) => ({
    id: inv.invoiceNumber,
    student: `${inv.student.firstName} ${inv.student.lastName}`,
    class: inv.student.classGroup.name,
    parent: inv.parentContact?.fullName || "N/A",
    amount: inv.totalAmount,
    paid: inv.paidAmount,
    balance: inv.balanceDue,
    status: inv.status,
    dueDate: inv.dueDate.toISOString().split("T")[0],
  }));

  const transformedPayments = payments.map((pay) => ({
    id: pay.paymentRef,
    invoice: pay.invoice.invoiceNumber,
    student: `${pay.invoice.student.firstName} ${pay.invoice.student.lastName}`,
    amount: pay.amount,
    method: pay.method,
    date: pay.processedAt?.toISOString().split("T")[0] || pay.createdAt.toISOString().split("T")[0],
    status: pay.status,
  }));

  const transformedFeeStructures = feeStructures.map((fs) => {
    const collected = fs.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const total = fs.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    return {
      id: fs.id,
      name: fs.name,
      grade: fs.grade || 0,
      baseAmount: fs.baseAmount,
      students: fs.invoices.length,
      collected,
      outstanding: total - collected,
    };
  });

  // Group discounts by type for display
  const discountSummary = studentDiscounts.reduce((acc, sd) => {
    const key = sd.discount.name;
    if (!acc[key]) {
      acc[key] = {
        name: sd.discount.name,
        type: sd.discount.type === "Percentage" 
          ? `${sd.discount.value}% off` 
          : `R${sd.discount.value.toLocaleString()} off`,
        applied: 0,
        desc: "",
      };
    }
    if (sd.status === "Approved") {
      acc[key].applied++;
    }
    return acc;
  }, {} as Record<string, { name: string; type: string; applied: number; desc: string }>);

  return (
    <FeesPageClient
      invoices={transformedInvoices}
      payments={transformedPayments}
      feeStructures={transformedFeeStructures}
      discounts={Object.values(discountSummary)}
    />
  );
}
