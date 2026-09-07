"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Receipt,
  AlertCircle,
  Check,
  Download,
  CreditCard,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils/currency";
import { buildCSVRow } from "@/lib/utils/csv";

interface Payment {
  id: string;
  paymentRef: string;
  amount: number;
  method: string;
  date: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  term: string;
  year: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  dueDate: string;
  lineItems: Array<{ description: string; amount: number; quantity: number }>;
  payments: Payment[];
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface ChildFeeData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className: string;
    grade: number;
  };
  summary: {
    totalOutstanding: number;
    totalPaid: number;
    totalInvoiced: number;
    invoiceCount: number;
  };
  invoices: Invoice[];
  transactions: Transaction[];
}

interface ParentFeesClientProps {
  childrenData: ChildFeeData[];
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function ParentFeesClient({ childrenData }: ParentFeesClientProps) {
  const [selectedChild, setSelectedChild] = useState(childrenData[0]?.student.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPayInfo, setShowPayInfo] = useState(false);

  const currentChild = childrenData.find((c) => c.student.id === selectedChild);

  const handleDownloadStatement = useCallback(() => {
    if (!currentChild) return;
    const { student, transactions } = currentChild;
    const headers = ["Date", "Description", "Type", "Debit", "Credit", "Balance"];
    const csvContent = [
      buildCSVRow(headers),
      ...transactions.map((tx) => buildCSVRow([tx.date, tx.description, tx.type, String(tx.debit), String(tx.credit), String(tx.balance)]))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `statement-${student.firstName}-${student.lastName}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [currentChild]);

  if (!currentChild) {
    return <div>No data available</div>;
  }

  const { student, summary, invoices, transactions } = currentChild;

  // Calculate totals across all children
  const totalOutstanding = childrenData.reduce((sum, c) => sum + c.summary.totalOutstanding, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding (All Children)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid (This Child)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalInvoiced)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--accent-violet))/0.12] flex items-center justify-center">
                <FileText className="h-6 w-6 text-[hsl(var(--accent-violet))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold">{summary.invoiceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Child Selector (if multiple children) */}
      {childrenData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {childrenData.map((child) => (
                <Button
                  key={child.student.id}
                  variant={selectedChild === child.student.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.student.id)}
                  className="gap-2"
                >
                  {child.student.firstName} {child.student.lastName}
                  {child.summary.totalOutstanding > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {formatCurrency(child.summary.totalOutstanding)}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Child Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {student.firstName} {student.lastName}
              </CardTitle>
              <CardDescription>
                {student.className} • Grade {student.grade} • {student.admissionNumber}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleDownloadStatement}>
                <Download className="h-4 w-4" />
                Download Statement
              </Button>
              {summary.totalOutstanding > 0 && (
                <Button className="gap-2 bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]" onClick={() => setShowPayInfo(!showPayInfo)}>
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Instructions */}
      {showPayInfo && (
        <Card className="border-[hsl(var(--accent-violet))]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Instructions</CardTitle>
            <CardDescription>Use the following details to make an EFT payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div><p className="text-sm text-muted-foreground">Reference</p><p className="font-bold text-[hsl(var(--accent-violet))]">{student.admissionNumber}</p></div>
                <div><p className="text-sm text-muted-foreground">Amount Due</p><p className="font-bold text-lg">{formatCurrency(summary.totalOutstanding)}</p></div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Please contact the school finance office for banking details and alternative payment methods (EFT, SnapScan, PayFast, card payments). Use your child&apos;s admission number as the payment reference. Payments are usually reflected within 1-3 business days.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Outstanding Invoices */}
          {invoices.filter((inv) => inv.balanceDue > 0).length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Outstanding Invoices
                </CardTitle>
                <CardDescription>Please settle these amounts at your earliest convenience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices
                    .filter((inv) => inv.balanceDue > 0)
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.term} {invoice.year} • Due: {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(invoice.balanceDue)}
                          </p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.flatMap((inv) => inv.payments).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {invoices
                    .flatMap((inv) =>
                      inv.payments.map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber }))
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.paymentRef}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.method} • {formatDate(payment.date)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Complete list of invoices for {student.firstName}</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No invoices found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {invoice.term} {invoice.year}
                        </TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {formatCurrency(invoice.paidAmount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            invoice.balanceDue > 0 && "text-red-600"
                          )}
                        >
                          {formatCurrency(invoice.balanceDue)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Account Statement</CardTitle>
                  <CardDescription>Transaction history for {student.firstName}&apos;s account</CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (!currentChild) return;
                    window.open(`/api/parent/statements/${currentChild.student.id}/pdf`, "_blank");
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.debit > 0 && (
                            <span className="text-red-600 flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {formatCurrency(tx.debit)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.credit > 0 && (
                            <span className="text-emerald-600 flex items-center justify-end gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {formatCurrency(tx.credit)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(tx.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
