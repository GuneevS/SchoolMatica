import { getServerAuthContext } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FeesPageClient } from "./fees-client";

export const metadata = {
  title: "Fees & Accounting | SchoolMatica",
  description: "Manage school fees, invoices, payments, and financial records.",
};

export const dynamic = "force-dynamic";

// Check if user has finance access
async function checkFinanceAccess(auth: NonNullable<Awaited<ReturnType<typeof getServerAuthContext>>>) {
  const financePermissions = [
    "finance:read", "finance:write", "fees:manage",
    "invoices:read", "invoices:write", "payments:read", "payments:write",
  ];

  if (auth.isSuperAdmin || auth.isAdmin) return true;

  const financeRoles = ["bursar", "finance_admin", "accountant", "finance"];
  if (auth.roleAssignments.some((ra: { role: { key: string } }) => financeRoles.includes(ra.role.key))) return true;

  for (const perm of financePermissions) {
    if (auth.permissions.has(perm)) return true;
  }

  return false;
}

export default async function FeesPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");

  let schoolId = auth.user.schoolId;

  if (!schoolId && auth.isSuperAdmin) {
    const firstSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (firstSchool) schoolId = firstSchool.id;
  }

  if (!schoolId) {
    redirect("/dashboard?error=no_school&message=No%20school%20available");
  }

  const hasFinanceAccess = await checkFinanceAccess(auth);
  if (!hasFinanceAccess) {
    redirect("/dashboard?error=unauthorized&message=Finance%20access%20required");
  }

  // Fetch all data in parallel
  const [invoices, payments, feeStructures, studentDiscounts, students, classGroups] = await Promise.all([
    // Invoices
    prisma.invoice.findMany({
      where: { schoolId },
      include: {
        student: { include: { classGroup: true } },
        parentContact: true,
        feeStructure: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Payments
    prisma.payment.findMany({
      where: { invoice: { schoolId } },
      include: {
        invoice: { include: { student: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Fee structures
    prisma.feeStructure.findMany({
      where: { schoolId },
      include: {
        discounts: { where: { isActive: true } },
        invoices: { select: { totalAmount: true, paidAmount: true, status: true } },
      },
      orderBy: [{ year: "desc" }, { grade: "asc" }],
    }),
    // Student discounts
    prisma.studentDiscount.findMany({
      where: { student: { classGroup: { schoolId } } },
      include: { discount: true, student: true },
    }),
    // Students for dropdowns
    prisma.student.findMany({
      where: { classGroup: { schoolId } },
      include: {
        classGroup: { select: { id: true, name: true, grade: true } },
        parents: { where: { primary: true }, take: 1, select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    // Class groups for dropdowns
    prisma.classGroup.findMany({
      where: { schoolId },
      select: { id: true, name: true, grade: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  // Transform invoices
  const transformedInvoices = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    student: `${inv.student.firstName} ${inv.student.lastName}`,
    studentId: inv.studentId,
    class: inv.student.classGroup.name,
    parent: inv.parentContact?.fullName || "N/A",
    amount: inv.totalAmount,
    paid: inv.paidAmount,
    balance: inv.balanceDue,
    status: inv.status,
    dueDate: inv.dueDate.toISOString().split("T")[0],
    term: inv.term,
    year: inv.year,
    lineItems: inv.lineItems as Array<{ description: string; amount: number; quantity: number }>,
    feeStructure: inv.feeStructure?.name || null,
    payments: inv.payments.map((p) => ({
      id: p.id,
      paymentRef: p.paymentRef,
      amount: p.amount,
      method: p.method,
      status: p.status,
      date: p.processedAt?.toISOString().split("T")[0] || p.createdAt.toISOString().split("T")[0],
    })),
  }));

  // Transform payments
  const transformedPayments = payments.map((pay) => ({
    id: pay.id,
    paymentRef: pay.paymentRef,
    invoiceId: pay.invoiceId,
    invoice: pay.invoice.invoiceNumber,
    student: `${pay.invoice.student.firstName} ${pay.invoice.student.lastName}`,
    amount: pay.amount,
    method: pay.method,
    date: pay.processedAt?.toISOString().split("T")[0] || pay.createdAt.toISOString().split("T")[0],
    status: pay.status,
  }));

  // Transform fee structures
  const transformedFeeStructures = feeStructures.map((fs) => {
    const collected = fs.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const total = fs.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    return {
      id: fs.id,
      name: fs.name,
      description: fs.description,
      grade: fs.grade || 0,
      year: fs.year,
      term: fs.term,
      baseAmount: fs.baseAmount,
      components: fs.components as Array<{ name: string; amount: number; optional: boolean; description?: string }>,
      isActive: fs.isActive,
      students: fs.invoices.length,
      collected,
      outstanding: total - collected,
      discounts: fs.discounts.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        value: d.value,
        currentUsage: d.currentUsage,
        maxUsage: d.maxUsage,
      })),
    };
  });

  // Group discounts
  const discountSummary = studentDiscounts.reduce((acc, sd) => {
    const key = sd.discount.name;
    if (!acc[key]) {
      acc[key] = {
        id: sd.discount.id,
        name: sd.discount.name,
        type: sd.discount.type === "Percentage"
          ? `${sd.discount.value}% off`
          : `R${sd.discount.value.toLocaleString()} off`,
        applied: 0,
        feeStructureId: sd.discount.feeStructureId,
      };
    }
    if (sd.status === "Approved") acc[key].applied++;
    return acc;
  }, {} as Record<string, { id: string; name: string; type: string; applied: number; feeStructureId: string }>);

  // Transform students for dropdowns
  const transformedStudents = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    admissionNumber: s.admissionNumber,
    classGroup: s.classGroup,
    parentContact: s.parents[0] || null,
  }));

  return (
    <FeesPageClient
      invoices={transformedInvoices}
      payments={transformedPayments}
      feeStructures={transformedFeeStructures}
      discounts={Object.values(discountSummary)}
      students={transformedStudents}
      classGroups={classGroups}
      schoolId={schoolId}
    />
  );
}
