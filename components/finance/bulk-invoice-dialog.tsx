"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, FileText, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface BulkInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feeStructureId: string;
    feeStructureName: string;
    grade: number;
    year: number;
    baseAmount: number;
    onSuccess: () => void;
}

interface GenerationResult {
    created: number;
    skipped: number;
    totalAmount: number;
    invoices: Array<{ invoiceNumber: string; student: string; amount: number }>;
}

export function BulkInvoiceDialog({
    open,
    onOpenChange,
    feeStructureId,
    feeStructureName,
    grade,
    year,
    baseAmount,
    onSuccess,
}: BulkInvoiceDialogProps) {
    const [term, setTerm] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setTerm("");
        setDueDate("");
        setIsSubmitting(false);
        setResult(null);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!term || !dueDate) {
            setError("Please select a term and due date");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/fees/invoices/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feeStructureId,
                    term,
                    year,
                    dueDate,
                    gradeFilter: grade > 0 ? grade : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate invoices");
            }

            const data: GenerationResult = await res.json();
            setResult(data);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
    };

    // Calculate a default due date 30 days from now
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                        Generate Invoices
                    </DialogTitle>
                    <DialogDescription>
                        Generate invoices for all students based on the fee structure below.
                        Existing invoices for the same term will be skipped.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    /* ===== SUCCESS VIEW ===== */
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                <Check className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                    Invoices Generated Successfully
                                </p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-500">
                                    {result.created} invoice{result.created !== 1 ? "s" : ""}{" "}
                                    created • {formatCurrency(result.totalAmount)} total
                                </p>
                            </div>
                        </div>

                        {result.skipped > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {result.skipped} student{result.skipped !== 1 ? "s" : ""}{" "}
                                skipped (already had invoices for this term)
                            </p>
                        )}

                        {result.invoices.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {result.invoices.slice(0, 10).map((inv) => (
                                    <div
                                        key={inv.invoiceNumber}
                                        className="flex items-center justify-between text-sm px-3 py-1.5 bg-muted/50 rounded"
                                    >
                                        <span>
                                            {inv.invoiceNumber} — {inv.student}
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(inv.amount)}
                                        </span>
                                    </div>
                                ))}
                                {result.invoices.length > 10 && (
                                    <p className="text-xs text-muted-foreground text-center pt-1">
                                        ...and {result.invoices.length - 10} more
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={() => handleClose(false)}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    /* ===== FORM VIEW ===== */
                    <div className="space-y-4 py-2">
                        {/* Fee Structure Info */}
                        <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{feeStructureName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {grade > 0 ? `Grade ${grade}` : "All Grades"} • {year}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-lg px-3">
                                    {formatCurrency(baseAmount)}
                                </Badge>
                            </div>
                        </div>

                        {/* Term Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="bulk-term">Term</Label>
                            <Select value={term} onValueChange={setTerm}>
                                <SelectTrigger id="bulk-term">
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="T1">Term 1</SelectItem>
                                    <SelectItem value="T2">Term 2</SelectItem>
                                    <SelectItem value="T3">Term 3</SelectItem>
                                    <SelectItem value="T4">Term 4</SelectItem>
                                    <SelectItem value="Annual">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="bulk-due-date">Due Date</Label>
                            <Input
                                id="bulk-due-date"
                                type="date"
                                value={dueDate || defaultDueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !term}
                                className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-4 w-4 mr-2" />
                                        Generate Invoices
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
