"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface Student {
    id: string;
    name: string;
    admissionNumber: string;
    classGroup: { id: string; name: string; grade: number };
    parentContact: { id: string; fullName: string; email: string | null } | null;
}

interface FeeStructure {
    id: string;
    name: string;
    grade: number;
    baseAmount: number;
    isActive: boolean;
    components: Array<{ name: string; amount: number; optional: boolean; description?: string }>;
}

interface CreateInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: Student[];
    feeStructures: FeeStructure[];
    onSuccess: () => void;
}

export function CreateInvoiceDialog({ open, onOpenChange, students, feeStructures, onSuccess }: CreateInvoiceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [studentId, setStudentId] = useState("");
    const [feeStructureId, setFeeStructureId] = useState("");
    const [term, setTerm] = useState("Term 1");
    const [year, setYear] = useState(new Date().getFullYear());
    const [dueDate, setDueDate] = useState("");
    const [lineItems, setLineItems] = useState<Array<{ description: string; amount: number; quantity: number }>>([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    const selectedStudent = students.find((s) => s.id === studentId);

    const handleFeeStructureSelect = (fsId: string) => {
        setFeeStructureId(fsId);
        const fs = feeStructures.find((f) => f.id === fsId);
        if (fs?.components) {
            setLineItems(fs.components.filter((c) => !c.optional).map((c) => ({
                description: c.name, amount: c.amount, quantity: 1,
            })));
        }
    };

    const addLineItem = () => setLineItems([...lineItems, { description: "", amount: 0, quantity: 1 }]);
    const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
    const updateLineItem = (i: number, field: string, value: string | number) => {
        const updated = [...lineItems];
        (updated[i] as Record<string, string | number>)[field] = value;
        setLineItems(updated);
    };

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const total = Math.max(0, subtotal - discountAmount);

    const handleSubmit = async () => {
        setError("");
        if (!studentId || !term || !dueDate || lineItems.length === 0) {
            setError("Please fill all required fields and add at least one line item.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/fees/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    feeStructureId: feeStructureId || undefined,
                    parentContactId: selectedStudent?.parentContact?.id,
                    term, year, dueDate,
                    lineItems: lineItems.map((li) => ({ ...li, amount: Number(li.amount), quantity: Number(li.quantity) })),
                    discountAmount: Number(discountAmount),
                    notes: notes || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create invoice");
            }
            onOpenChange(false);
            resetForm();
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStudentId(""); setFeeStructureId(""); setTerm("Term 1");
        setDueDate(""); setLineItems([]); setDiscountAmount(0); setNotes(""); setError("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>Generate an invoice for a student. Select a fee structure to auto-populate line items.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Student *</Label>
                            <Select value={studentId} onValueChange={setStudentId}>
                                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.classGroup.name})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fee Structure</Label>
                            <Select value={feeStructureId} onValueChange={handleFeeStructureSelect}>
                                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                <SelectContent>
                                    {feeStructures.filter((f) => f.isActive).map((fs) => (
                                        <SelectItem key={fs.id} value={fs.id}>{fs.name} ({formatCurrency(fs.baseAmount)})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Term *</Label>
                            <Select value={term} onValueChange={setTerm}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Term 1", "Term 2", "Term 3", "Term 4", "Annual"].map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Line Items *</Label>
                            <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                        </div>
                        {lineItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No line items. Select a fee structure or add manually.</p>
                        ) : (
                            <div className="space-y-2">
                                {lineItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input className="flex-1" placeholder="Description" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
                                        <Input className="w-24" type="number" placeholder="Amount" value={item.amount || ""} onChange={(e) => updateLineItem(i, "amount", parseFloat(e.target.value) || 0)} />
                                        <Input className="w-16" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)} />
                                        <Button variant="ghost" size="icon" onClick={() => removeLineItem(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount (ZAR)</Label>
                            <Input type="number" value={discountAmount || ""} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
                        <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
