"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Invoice {
    id: string;
    invoiceNumber: string;
    student: string;
    balance: number;
}

interface RecordPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoices: Invoice[];
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { value: "EFT", label: "EFT / Bank Transfer" },
    { value: "Card", label: "Credit/Debit Card" },
    { value: "Cash", label: "Cash" },
    { value: "DebitOrder", label: "Debit Order" },
    { value: "PayFast", label: "PayFast" },
    { value: "Snapscan", label: "SnapScan" },
    { value: "Ozow", label: "Ozow" },
    { value: "ApplePay", label: "Apple Pay" },
    { value: "GooglePay", label: "Google Pay" },
];

export function RecordPaymentDialog({ open, onOpenChange, invoices, onSuccess }: RecordPaymentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [invoiceId, setInvoiceId] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState("EFT");
    const [gatewayRef, setGatewayRef] = useState("");
    const [paidBy, setPaidBy] = useState("");
    const [error, setError] = useState("");

    const selectedInvoice = invoices.find((inv) => inv.id === invoiceId);
    const unpaidInvoices = invoices.filter((inv) => inv.balance > 0);

    const handleSubmit = async () => {
        setError("");
        if (!invoiceId || !amount || !method) {
            setError("Please select an invoice, enter an amount, and choose a payment method.");
            return;
        }
        if (selectedInvoice && amount > selectedInvoice.balance) {
            setError(`Amount exceeds balance due (${formatCurrency(selectedInvoice.balance)})`);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/fees/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId, amount: Number(amount), method,
                    gatewayRef: gatewayRef || undefined,
                    paidBy: paidBy || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to record payment");
            }
            onOpenChange(false);
            setInvoiceId(""); setAmount(0); setMethod("EFT"); setGatewayRef(""); setPaidBy(""); setError("");
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to record payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>Record a manual payment against an outstanding invoice.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>}

                    <div className="space-y-2">
                        <Label>Invoice *</Label>
                        <Select value={invoiceId} onValueChange={(v) => { setInvoiceId(v); const inv = invoices.find((i) => i.id === v); if (inv) setAmount(inv.balance); }}>
                            <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                            <SelectContent>
                                {unpaidInvoices.map((inv) => (
                                    <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.student} (Due: {formatCurrency(inv.balance)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedInvoice && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p>Balance due: <span className="font-bold text-amber-600">{formatCurrency(selectedInvoice.balance)}</span></p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount (ZAR) *</Label>
                            <Input type="number" step="0.01" value={amount || ""} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Reference</Label>
                            <Input value={gatewayRef} onChange={(e) => setGatewayRef(e.target.value)} placeholder="Bank / gateway ref" />
                        </div>
                        <div className="space-y-2">
                            <Label>Paid By</Label>
                            <Input value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder="Name of payer" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
