"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import {
  CreditCard,
  Receipt,
  TrendingUp,
  FileText,
  Plus,
  Download,
  Eye,
  Send,
  Check,
  AlertCircle,
  Clock,
  Wallet,
  PiggyBank,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: string;
  student: string;
  class: string;
  parent: string;
  amount: number;
  paid: number;
  balance: number;
  status: string;
  dueDate: string;
}

interface Payment {
  id: string;
  invoice: string;
  student: string;
  amount: number;
  method: string;
  date: string;
  status: string;
}

interface FeeStructure {
  id: string;
  name: string;
  grade: number;
  baseAmount: number;
  students: number;
  collected: number;
  outstanding: number;
}

interface Discount {
  name: string;
  type: string;
  applied: number;
  desc: string;
}

interface FeesPageClientProps {
  invoices: Invoice[];
  payments: Payment[];
  feeStructures: FeeStructure[];
  discounts: Discount[];
}

const heroHighlights = [
  { label: "Real-time accounting", color: "hsl(var(--accent-iris))" },
  { label: "Multi-payment support", color: "hsl(var(--accent-mint))" },
  { label: "Automated invoicing", color: "hsl(var(--accent-gold))" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Partially Paid": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return styles[status] || styles.Draft;
};

export function FeesPageClient({ invoices, payments, feeStructures, discounts }: FeesPageClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Financial Management"
        title={
          <>
            <span className="gradient-text">Fees</span> & Account Management
          </>
        }
        description="Manage school fees, generate invoices, track payments, and reconcile accounts with real-time insights and South African payment gateway support."
        badges={heroHighlights}
        aside={
          <HeroMetricPanel
            title="Financial overview"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              {
                label: "Collected",
                value: formatCurrency(totalCollected),
                helper: "This term",
                accent: "highlight",
              },
              { label: "Outstanding", value: formatCurrency(totalOutstanding) },
              { label: "Collection rate", value: `${collectionRate.toFixed(0)}%` },
              { label: "Overdue", value: overdueInvoices.length.toString() },
            ]}
          />
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="structures" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fee Structures
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Discounts
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-violet-500 hover:bg-violet-600">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        <TabsContent value="overview">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">{overdueInvoices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold">{collectionRate.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Structure Performance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fee Collection by Grade</CardTitle>
              <CardDescription>Collection progress by fee structure</CardDescription>
            </CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No fee structures defined yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feeStructures.map((structure) => {
                    const total = structure.collected + structure.outstanding;
                    const percent = total > 0 ? (structure.collected / total) * 100 : 0;
                    return (
                      <div key={structure.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{structure.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {structure.students} students • {formatCurrency(structure.baseAmount)}/student
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(structure.collected)}</p>
                            <p className="text-sm text-muted-foreground">
                              of {formatCurrency(total)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={percent} className="flex-1" />
                          <span className="text-sm font-medium w-12">{percent.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Check className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.student}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.method} • {payment.date}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          +{formatCurrency(payment.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue Invoices</CardTitle>
                <CardDescription>Requires immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overdueInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Check className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                      <p>No overdue invoices</p>
                    </div>
                  ) : (
                    overdueInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.student}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {invoice.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(invoice.balance)}
                          </p>
                          <Button variant="ghost" size="sm" className="text-violet-500 p-0 h-auto">
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage all student invoices</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input
                      placeholder="Search invoices..."
                      className="pl-4 w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No invoices found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.student}</TableCell>
                        <TableCell>{invoice.class}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.paid)}</TableCell>
                        <TableCell
                          className={cn(
                            invoice.balance > 0 && "text-amber-600 font-medium"
                          )}
                        >
                          {formatCurrency(invoice.balance)}
                        </TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All payment transactions</CardDescription>
                </div>
                <Button className="bg-violet-500 hover:bg-violet-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payments recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Ref</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.invoice}</TableCell>
                        <TableCell>{payment.student}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.method}</Badge>
                        </TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Supported Payment Methods</CardTitle>
              <CardDescription>Parents can pay using any of these methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "EFT / Bank Transfer", icon: "🏦", desc: "Direct bank payment" },
                  { name: "Credit/Debit Card", icon: "💳", desc: "Visa, Mastercard" },
                  { name: "Apple Pay", icon: "🍎", desc: "Quick mobile payments" },
                  { name: "Google Pay", icon: "📱", desc: "Android payments" },
                  { name: "SnapScan", icon: "📸", desc: "Scan & pay" },
                  { name: "PayFast", icon: "⚡", desc: "SA payment gateway" },
                  { name: "Cash", icon: "💵", desc: "In-person payments" },
                  { name: "Debit Order", icon: "🔄", desc: "Monthly automation" },
                ].map((method) => (
                  <div key={method.name} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fee Structures</CardTitle>
                  <CardDescription>Define fee structures for different grades and terms</CardDescription>
                </div>
                <Button className="bg-violet-500 hover:bg-violet-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No fee structures defined yet</p>
                  <p className="text-sm mt-1">Create a fee structure to start generating invoices</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feeStructures.map((structure) => (
                    <div key={structure.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium">{structure.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Grade {structure.grade} • {structure.students} students
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(structure.baseAmount)}</p>
                        <p className="text-sm text-muted-foreground">per student</p>
                      </div>
                      <Button variant="outline">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discounts & Bursaries</CardTitle>
                  <CardDescription>Manage fee reductions and financial assistance</CardDescription>
                </div>
                <Button className="bg-violet-500 hover:bg-violet-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Discount
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {discounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No discounts defined yet</p>
                  <p className="text-sm mt-1">Create discounts for siblings, staff, or merit-based bursaries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {discounts.map((discount, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <PiggyBank className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{discount.name}</p>
                          <p className="text-sm text-muted-foreground">{discount.desc || "Fee discount"}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline">{discount.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{discount.applied}</p>
                        <p className="text-sm text-muted-foreground">students</p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
