import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  CreditCard,
  Receipt,
} from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function StudentFeesPage() {
  const { student } = await getStudentContext();

  const invoices = await prisma.invoice.findMany({
    where: { studentId: student.id },
    include: { feeStructure: true },
    orderBy: { dueDate: "desc" },
  });

  const totals = invoices.reduce(
    (acc, invoice) => {
      acc.total += invoice.totalAmount;
      acc.paid += invoice.paidAmount;
      acc.balance += invoice.balanceDue;
      return acc;
    },
    { total: 0, paid: 0, balance: 0 },
  );

  const overdueInvoices = invoices.filter((invoice) => invoice.status === "Overdue");
  const nextInvoice = invoices
    .filter((invoice) => invoice.balanceDue > 0)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Fees"
        title={
          <>
            Fees & Payments
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Track invoices, balances, and upcoming payments.
            </span>
          </>
        }
        description="Payments are managed by your school bursar."
        actions={
          <Button asChild>
            <Link href="/student/messages">
              Contact bursar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        }
        aside={
          <HeroMetricPanel
            title="Account Summary"
            icon={<CreditCard className="h-4 w-4" />}
            metrics={[
              {
                label: "Outstanding",
                value: currencyFormatter.format(totals.balance),
                helper: nextInvoice?.dueDate ? `Next due ${formatDate(nextInvoice.dueDate)}` : "No unpaid invoices",
                accent: "highlight",
              },
              {
                label: "Total Billed",
                value: currencyFormatter.format(totals.total),
              },
              {
                label: "Paid",
                value: currencyFormatter.format(totals.paid),
              },
              {
                label: "Overdue",
                value: overdueInvoices.length.toString(),
              },
            ]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice History
          </CardTitle>
          <CardDescription>All invoices linked to your learner account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <CreditCard className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm">Your fee statements will appear here.</p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3",
                  invoice.status === "Overdue"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))]",
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {invoice.feeStructure?.name ?? "School Fees"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.invoiceNumber} • Due {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      invoice.status === "Paid" && "bg-emerald-500/15 text-emerald-600",
                      invoice.status === "Partially Paid" && "bg-amber-500/15 text-amber-600",
                      invoice.status === "Overdue" && "bg-red-500/15 text-red-600",
                      invoice.status === "Sent" && "bg-blue-500/15 text-blue-600",
                      invoice.status === "Draft" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {invoice.status}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    {currencyFormatter.format(invoice.balanceDue)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {overdueInvoices.length > 0 && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Overdue Notices
            </CardTitle>
            <CardDescription>Contact the bursar to resolve overdue balances.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
                </div>
                <span className="font-semibold text-red-600">
                  {currencyFormatter.format(invoice.balanceDue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Guidance
          </CardTitle>
          <CardDescription>How to settle outstanding invoices.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the bursar contact channel to receive payment instructions or links. Keep your
          invoice number ready when making a payment.
        </CardContent>
      </Card>
    </div>
  );
}
