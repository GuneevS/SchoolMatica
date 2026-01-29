"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Receipt,
  Wallet,
  AlertCircle,
  Check,
  Clock,
  Download,
  CreditCard,
  FileText,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-700",
    "Partially Paid": "bg-amber-100 text-amber-700",
    Overdue: "bg-red-100 text-red-700",
    Sent: "bg-blue-100 text-blue-700",
    Draft: "bg-slate-100 text-slate-700",
  };
  return styles[status] || styles.Draft;
};

export function ParentFeesClient({ childrenData }: ParentFeesClientProps) {
  const [selectedChild, setSelectedChild] = useState(childrenData[0]?.student.id);
  const [activeTab, setActiveTab] = useState("overview");

  const currentChild = childrenData.find((c) => c.student.id === selectedChild);

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
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
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
              <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-violet-600" />
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
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Statement
              </Button>
              {summary.totalOutstanding > 0 && (
                <Button className="gap-2 bg-violet-500 hover:bg-violet-600">
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

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
                          <Badge className={getStatusBadge(invoice.status)}>{invoice.status}</Badge>
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
                          <Badge className={getStatusBadge(invoice.status)}>{invoice.status}</Badge>
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
                  <CardDescription>Transaction history for {student.firstName}'s account</CardDescription>
                </div>
                <Button variant="outline" className="gap-2">
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
