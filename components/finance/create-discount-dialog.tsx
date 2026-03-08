"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface FeeStructure { id: string; name: string; }

interface CreateDiscountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feeStructures: FeeStructure[];
    onSuccess: () => void;
}

export function CreateDiscountDialog({ open, onOpenChange, feeStructures, onSuccess }: CreateDiscountDialogProps) {
    const [loading, setLoading] = useState(false);
    const [feeStructureId, setFeeStructureId] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState<"Percentage" | "FixedAmount">("Percentage");
    const [value, setValue] = useState<number>(0);
    const [maxUsage, setMaxUsage] = useState<string>("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!feeStructureId || !name || !value) {
            setError("Please fill all required fields.");
            return;
        }
        if (type === "Percentage" && value > 100) {
            setError("Percentage cannot exceed 100%.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/fees/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feeStructureId, name, type, value: Number(value),
                    maxUsage: maxUsage ? parseInt(maxUsage) : null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create discount");
            }
            onOpenChange(false);
            setFeeStructureId(""); setName(""); setType("Percentage"); setValue(0); setMaxUsage(""); setError("");
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create discount");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Discount / Bursary</DialogTitle>
                    <DialogDescription>Create a fee reduction that can be applied to students. Common SA discounts include sibling discounts, staff discounts, and merit bursaries.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>}

                    <div className="space-y-2">
                        <Label>Fee Structure *</Label>
                        <Select value={feeStructureId} onValueChange={setFeeStructureId}>
                            <SelectTrigger><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                            <SelectContent>
                                {feeStructures.map((fs) => (<SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Discount Name *</Label>
                        <Select value={name} onValueChange={setName}>
                            <SelectTrigger><SelectValue placeholder="Select or type" /></SelectTrigger>
                            <SelectContent>
                                {["Sibling Discount", "Staff Discount", "Merit Bursary", "Financial Assistance", "Early Payment Discount", "Sports Bursary", "Academic Bursary", "Other"].map((n) => (
                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={type} onValueChange={(v) => setType(v as "Percentage" | "FixedAmount")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="FixedAmount">Fixed Amount (R)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Value *</Label>
                            <Input type="number" value={value || ""} onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                                placeholder={type === "Percentage" ? "e.g. 10" : "e.g. 5000"} />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Students</Label>
                            <Input type="number" value={maxUsage} onChange={(e) => setMaxUsage(e.target.value)} placeholder="Unlimited" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Discount
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
