"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Receipt, TrendingUp, FileText, Plus, Download, Eye, Send, Check, AlertCircle, Clock, Wallet, PiggyBank, Activity, Landmark, Loader2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateInvoiceDialog } from "@/components/finance/create-invoice-dialog";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { CreateFeeStructureDialog } from "@/components/finance/create-fee-structure-dialog";
import { CreateDiscountDialog } from "@/components/finance/create-discount-dialog";
import { BankReconciliationTab } from "@/components/finance/bank-reconciliation-tab";
import { BulkInvoiceDialog } from "@/components/finance/bulk-invoice-dialog";
import { buildCSVRow } from "@/lib/utils/csv";
import { formatCurrency } from "@/lib/utils/currency";

interface InvoicePayment { id: string; paymentRef: string; amount: number; method: string; status: string; date: string; }
interface Invoice {
  id: string; invoiceNumber: string; student: string; studentId: string; class: string; parent: string;
  amount: number; paid: number; balance: number; status: string; dueDate: string; term: string; year: number;
  lineItems: Array<{ description: string; amount: number; quantity: number }>; feeStructure: string | null;
  payments: InvoicePayment[];
}
interface Payment { id: string; paymentRef: string; invoiceId: string; invoice: string; student: string; amount: number; method: string; date: string; status: string; }
interface FeeStructureDiscount { id: string; name: string; type: string; value: number; currentUsage: number; maxUsage: number | null; }
interface FeeStructure {
  id: string; name: string; description: string | null; grade: number; year: number; term: string | null;
  baseAmount: number; components: Array<{ name: string; amount: number; optional: boolean; description?: string }>;
  isActive: boolean; students: number; collected: number; outstanding: number; discounts: FeeStructureDiscount[];
}
interface Discount { id: string; name: string; type: string; applied: number; feeStructureId: string; }
interface StudentOption { id: string; name: string; admissionNumber: string; classGroup: { id: string; name: string; grade: number }; parentContact: { id: string; fullName: string; email: string | null } | null; }

interface FeesPageClientProps {
  invoices: Invoice[]; payments: Payment[]; feeStructures: FeeStructure[];
  discounts: Discount[]; students: StudentOption[];
  classGroups: { id: string; name: string; grade: number }[]; schoolId: string;
}

const heroHighlights = [
  { label: "Real-time accounting", color: "hsl(var(--accent-iris))" },
  { label: "Bank reconciliation", color: "hsl(var(--accent-mint))" },
  { label: "SA payment support", color: "hsl(var(--accent-gold))" },
];

export function FeesPageClient({ invoices, payments, feeStructures, discounts, students }: FeesPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showCreateStructure, setShowCreateStructure] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [bulkInvoiceStructure, setBulkInvoiceStructure] = useState<FeeStructure | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<FeeStructure | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleDeactivateStructure = useCallback(
    async (structureId: string) => {
      try {
        const res = await fetch(`/api/fees/structures/${structureId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to deactivate");
        toast.success("Fee structure deactivated");
        refresh();
      } catch (err) {
        console.error("[Fees] deactivate failed:", err);
        toast.error("Could not deactivate the fee structure. Please try again.");
      }
    },
    [refresh],
  );

  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.student.toLowerCase().includes(searchQuery.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReminder = async (invoiceId: string) => {
    setSendingReminder(invoiceId);
    try {
      const res = await fetch(`/api/fees/invoices/${invoiceId}/remind`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send reminder");
    } catch (err) {
      console.error("Send reminder error:", err);
    } finally {
      setSendingReminder(null);
      refresh();
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/fees/invoices/${invoiceId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Sent" }),
      });
      if (!res.ok) throw new Error("Failed to send invoice");
      refresh();
    } catch (err) {
      console.error("Send invoice error:", err);
    }
  };

  const handleExport = () => {
    const headers = ["Invoice #", "Student", "Class", "Amount", "Paid", "Balance", "Status", "Due Date"];
    const csvContent = [
      buildCSVRow(headers),
      ...invoices.map((inv) => buildCSVRow([inv.invoiceNumber, inv.student, inv.class, String(inv.amount), String(inv.paid), String(inv.balance), inv.status, inv.dueDate])),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `invoices-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <AuroraHero eyebrow="Financial Management"
        title={<><span className="gradient-text">Fees</span> & Account Management</>}
        description="Manage school fees, generate invoices, track payments, and reconcile bank statements with real-time insights and South African payment gateway support."
        badges={heroHighlights}
        aside={<HeroMetricPanel title="Financial overview" icon={<Activity className="h-4 w-4" />} metrics={[
          { label: "Collected", value: formatCurrency(totalCollected), helper: "This term", accent: "highlight" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding) },
          { label: "Collection rate", value: `${collectionRate.toFixed(0)}%` },
          { label: "Overdue", value: overdueInvoices.length.toString() },
        ]} />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2"><Receipt className="h-4 w-4" />Invoices</TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="structures" className="flex items-center gap-2"><FileText className="h-4 w-4" />Fee Structures</TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2"><PiggyBank className="h-4 w-4" />Discounts</TabsTrigger>
            <TabsTrigger value="reconcile" className="flex items-center gap-2"><Landmark className="h-4 w-4" />Bank Recon</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]" onClick={() => setShowCreateInvoice(true)}><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
          </div>
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[
              { label: "Total Collected", value: formatCurrency(totalCollected), icon: Wallet, bg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
              { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: Clock, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
              { label: "Overdue", value: overdueInvoices.length.toString(), icon: AlertCircle, bg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400" },
              { label: "Collection Rate", value: `${collectionRate.toFixed(0)}%`, icon: TrendingUp, bg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
            ].map((card) => (
              <Card key={card.label}><CardContent className="p-6"><div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div><p className="text-sm text-muted-foreground">{card.label}</p><p className="text-2xl font-bold">{card.value}</p></div>
              </div></CardContent></Card>
            ))}
          </div>

          <Card className="mb-6">
            <CardHeader><CardTitle>Fee Collection by Grade</CardTitle><CardDescription>Collection progress by fee structure</CardDescription></CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No fee structures defined yet</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowCreateStructure(true)}>Create Fee Structure</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {feeStructures.filter((s) => s.isActive).map((structure) => {
                    const total = structure.collected + structure.outstanding;
                    const percent = total > 0 ? (structure.collected / total) * 100 : 0;
                    return (
                      <div key={structure.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div><p className="font-medium">{structure.name}</p><p className="text-sm text-muted-foreground">{structure.students} students • {formatCurrency(structure.baseAmount)}/student</p></div>
                          <div className="text-right"><p className="font-medium">{formatCurrency(structure.collected)}</p><p className="text-sm text-muted-foreground">of {formatCurrency(total)}</p></div>
                        </div>
                        <div className="flex items-center gap-3"><Progress value={percent} className="flex-1" /><span className="text-sm font-medium w-12">{percent.toFixed(0)}%</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent Payments</CardTitle><CardDescription>Latest payment transactions</CardDescription></CardHeader>
              <CardContent>
                {payments.length === 0 ? <div className="text-center py-8 text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No payments recorded yet</p></div> : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Check className="h-5 w-5 text-emerald-600" /></div>
                          <div><p className="font-medium">{payment.student}</p><p className="text-sm text-muted-foreground">{payment.method} • {payment.date}</p></div>
                        </div>
                        <p className="font-semibold text-emerald-600">+{formatCurrency(payment.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Overdue Invoices</CardTitle><CardDescription>Requires immediate attention</CardDescription></CardHeader>
              <CardContent>
                {overdueInvoices.length === 0 ? <div className="text-center py-8 text-muted-foreground"><Check className="h-12 w-12 mx-auto mb-2 text-emerald-500" /><p>No overdue invoices</p></div> : (
                  <div className="space-y-4">
                    {overdueInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-600" /></div>
                          <div><p className="font-medium">{invoice.student}</p><p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p></div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">{formatCurrency(invoice.balance)}</p>
                          <Button variant="ghost" size="sm" className="text-[hsl(var(--accent-violet))] p-0 h-auto" disabled={sendingReminder === invoice.id} onClick={() => handleSendReminder(invoice.id)}>
                            {sendingReminder === invoice.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Send Reminder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== INVOICES TAB ===== */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Invoices</CardTitle><CardDescription>Manage all student invoices</CardDescription></div>
                <div className="flex items-center gap-3">
                  <Input placeholder="Search invoices..." className="pl-4 w-[250px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      {["all", "Paid", "Partially Paid", "Sent", "Overdue", "Draft", "Cancelled"].map((s) => (
                        <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No invoices found</p></div> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Invoice #</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.student}</TableCell>
                        <TableCell>{invoice.class}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.paid)}</TableCell>
                        <TableCell className={cn(invoice.balance > 0 && "text-amber-600 font-medium")}>{formatCurrency(invoice.balance)}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell><StatusBadge status={invoice.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title="View" onClick={() => setViewInvoice(invoice)}><Eye className="h-4 w-4" /></Button>
                            {invoice.status === "Draft" && <Button variant="ghost" size="icon" title="Send" onClick={() => handleSendInvoice(invoice.id)}><Send className="h-4 w-4" /></Button>}
                            {["Sent", "Partially Paid", "Overdue"].includes(invoice.status) && (
                              <Button variant="ghost" size="icon" title="Send Reminder" disabled={sendingReminder === invoice.id} onClick={() => handleSendReminder(invoice.id)}>
                                {sendingReminder === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-amber-500" />}
                              </Button>
                            )}
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

        {/* ===== PAYMENTS TAB ===== */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Payment History</CardTitle><CardDescription>All payment transactions</CardDescription></div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowRecordPayment(true)}><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? <div className="text-center py-12 text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No payments recorded yet</p></div> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Payment Ref</TableHead><TableHead>Invoice</TableHead><TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.paymentRef}</TableCell>
                        <TableCell>{payment.invoice}</TableCell>
                        <TableCell>{payment.student}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell><Badge variant="outline">{payment.method}</Badge></TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell><StatusBadge status={payment.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader><CardTitle>Supported Payment Methods</CardTitle><CardDescription>Parents can pay using any of these methods</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "EFT / Bank Transfer", icon: "🏦", desc: "Direct bank payment" },
                  { name: "Credit/Debit Card", icon: "💳", desc: "Visa, Mastercard" },
                  { name: "SnapScan", icon: "📸", desc: "Scan & pay" },
                  { name: "PayFast", icon: "⚡", desc: "SA payment gateway" },
                  { name: "Ozow", icon: "💸", desc: "Instant EFT" },
                  { name: "Apple Pay", icon: "🍎", desc: "Quick mobile payments" },
                  { name: "Cash", icon: "💵", desc: "In-person payments" },
                  { name: "Debit Order", icon: "🔄", desc: "Monthly automation" },
                ].map((method) => (
                  <div key={method.name} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="text-2xl">{method.icon}</span>
                    <div><p className="font-medium text-sm">{method.name}</p><p className="text-xs text-muted-foreground">{method.desc}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== FEE STRUCTURES TAB ===== */}
        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Fee Structures</CardTitle><CardDescription>Define fee structures for different grades and terms</CardDescription></div>
                <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]" onClick={() => setShowCreateStructure(true)}><Plus className="h-4 w-4 mr-2" />Create Structure</Button>
              </div>
            </CardHeader>
            <CardContent>
              {feeStructures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No fee structures defined yet</p><p className="text-sm mt-1">Create a fee structure to start generating invoices</p></div>
              ) : (
                <div className="space-y-4">
                  {feeStructures.map((structure) => (
                    <div key={structure.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--accent-violet))/0.12] dark:bg-[hsl(var(--accent-violet))/0.28] flex items-center justify-center">
                            <FileText className="h-6 w-6 text-[hsl(var(--accent-violet))]" />
                          </div>
                          <div>
                            <p className="font-medium">{structure.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {structure.grade != null ? `Grade ${structure.grade === 0 ? "R" : structure.grade}` : "All Grades"} • {structure.year} • {structure.term || "Annual"} • {structure.students} students
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right"><p className="text-lg font-bold">{formatCurrency(structure.baseAmount)}</p><p className="text-sm text-muted-foreground">per student</p></div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[hsl(var(--accent-violet))/0.5] text-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.08]"
                            onClick={() => setBulkInvoiceStructure(structure)}
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1.5" />
                            Generate Invoices
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeactivateTarget(structure)}
                            aria-label={`Deactivate fee structure ${structure.name}`}
                            title="Deactivate fee structure"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {structure.components && structure.components.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {structure.components.map((comp, ci) => (
                            <div key={ci} className="flex items-center justify-between px-3 py-1.5 bg-muted/50 rounded text-sm">
                              <span>{comp.name}{comp.optional ? " *" : ""}</span>
                              <span className="font-medium">{formatCurrency(comp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DISCOUNTS TAB ===== */}
        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Discounts & Bursaries</CardTitle><CardDescription>Manage fee reductions and financial assistance</CardDescription></div>
                <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]" onClick={() => setShowCreateDiscount(true)}><Plus className="h-4 w-4 mr-2" />Create Discount</Button>
              </div>
            </CardHeader>
            <CardContent>
              {discounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No discounts defined yet</p><p className="text-sm mt-1">Create discounts for siblings, staff, or merit-based bursaries</p></div>
              ) : (
                <div className="space-y-4">
                  {discounts.map((discount, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><PiggyBank className="h-6 w-6 text-emerald-600" /></div>
                        <div><p className="font-medium">{discount.name}</p></div>
                      </div>
                      <Badge variant="outline">{discount.type}</Badge>
                      <div className="text-right"><p className="font-medium">{discount.applied}</p><p className="text-sm text-muted-foreground">students</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== BANK RECON TAB ===== */}
        <TabsContent value="reconcile">
          <BankReconciliationTab onRefresh={refresh} />
        </TabsContent>
      </Tabs>

      {/* ===== VIEW INVOICE DIALOG ===== */}
      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewInvoice && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                  <div className="space-y-1">
                    <DialogTitle>Invoice {viewInvoice.invoiceNumber}</DialogTitle>
                    <DialogDescription>
                      {viewInvoice.student} · {viewInvoice.class} · {viewInvoice.term} {viewInvoice.year}
                    </DialogDescription>
                  </div>
                  <StatusBadge status={viewInvoice.status} />
                </div>
              </DialogHeader>

              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewInvoice.lineItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatCurrency(viewInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(viewInvoice.paid)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-border/60 pt-2 text-base font-semibold">
                  <span>Balance due</span>
                  <span
                    className={
                      viewInvoice.balance > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {formatCurrency(viewInvoice.balance)}
                  </span>
                </div>
              </div>

              {viewInvoice.payments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Payment history</h3>
                  <ul className="space-y-1.5">
                    {viewInvoice.payments.map((p) => (
                      <li
                        key={p.id}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm"
                      >
                        <span className="truncate">
                          {p.paymentRef} <span className="text-muted-foreground">· {p.method}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{p.date}</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG MODALS ===== */}
      <CreateInvoiceDialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice} students={students} feeStructures={feeStructures} onSuccess={refresh} />
      <RecordPaymentDialog open={showRecordPayment} onOpenChange={setShowRecordPayment} invoices={invoices} onSuccess={refresh} />
      <CreateFeeStructureDialog open={showCreateStructure} onOpenChange={setShowCreateStructure} onSuccess={refresh} />
      <CreateDiscountDialog open={showCreateDiscount} onOpenChange={setShowCreateDiscount} feeStructures={feeStructures} onSuccess={refresh} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
        title="Deactivate fee structure?"
        description={
          deactivateTarget
            ? `"${deactivateTarget.name}" will be hidden from the active list. Existing invoices already linked to this structure are kept intact.`
            : undefined
        }
        confirmLabel="Deactivate"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (deactivateTarget) await handleDeactivateStructure(deactivateTarget.id);
        }}
      />
      {bulkInvoiceStructure && (
        <BulkInvoiceDialog
          open={!!bulkInvoiceStructure}
          onOpenChange={(isOpen) => { if (!isOpen) setBulkInvoiceStructure(null); }}
          feeStructureId={bulkInvoiceStructure.id}
          feeStructureName={bulkInvoiceStructure.name}
          grade={bulkInvoiceStructure.grade}
          year={bulkInvoiceStructure.year}
          baseAmount={bulkInvoiceStructure.baseAmount}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
