"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface CreateFeeStructureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const SA_FEE_COMPONENTS = [
    "Tuition", "Registration", "Transport", "Stationery", "Uniforms",
    "Technology Levy", "Sports Levy", "Excursion Fund", "Textbooks",
    "After-care", "Meals / Tuck Shop", "Building Fund", "Library Levy",
];

export function CreateFeeStructureDialog({ open, onOpenChange, onSuccess }: CreateFeeStructureDialogProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [grade, setGrade] = useState<string>("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [term, setTerm] = useState("Annual");
    const [components, setComponents] = useState<Array<{ name: string; amount: number; optional: boolean; description: string }>>([
        { name: "Tuition", amount: 0, optional: false, description: "" },
    ]);
    const [error, setError] = useState("");

    const addComponent = () => setComponents([...components, { name: "", amount: 0, optional: false, description: "" }]);
    const removeComponent = (i: number) => setComponents(components.filter((_, idx) => idx !== i));
    const updateComponent = (i: number, field: string, value: string | number | boolean) => {
        const updated = [...components];
        (updated[i] as Record<string, string | number | boolean>)[field] = value;
        setComponents(updated);
    };

    const baseAmount = components.filter((c) => !c.optional).reduce((sum, c) => sum + c.amount, 0);

    const handleSubmit = async () => {
        setError("");
        if (!name || components.length === 0 || baseAmount <= 0) {
            setError("Please provide a name and at least one fee component with an amount.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/fees/structures", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, description: description || undefined,
                    grade: grade ? parseInt(grade) : null,
                    year, term: term || null, baseAmount,
                    components: components.map((c) => ({ ...c, amount: Number(c.amount) })),
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create fee structure");
            }
            onOpenChange(false);
            setName(""); setDescription(""); setGrade(""); setTerm("Annual");
            setComponents([{ name: "Tuition", amount: 0, optional: false, description: "" }]);
            setError("");
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create fee structure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Fee Structure</DialogTitle>
                    <DialogDescription>Define fee components for a grade and academic period. Components marked as optional are not included in the base amount.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Structure Name *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 10 2026 Annual Fees" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Grade</Label>
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger><SelectValue placeholder="All grades" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {Array.from({ length: 13 }, (_, i) => (
                                        <SelectItem key={i} value={String(i)}>Grade {i === 0 ? "R" : i}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Period</Label>
                            <Select value={term} onValueChange={setTerm}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Annual", "Term 1", "Term 2", "Term 3", "Term 4"].map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Fee Components *</Label>
                            <Button variant="outline" size="sm" onClick={addComponent}><Plus className="h-3 w-3 mr-1" />Add Component</Button>
                        </div>
                        <div className="space-y-2">
                            {components.map((comp, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Select value={comp.name} onValueChange={(v) => updateComponent(i, "name", v)}>
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Component" /></SelectTrigger>
                                        <SelectContent>
                                            {SA_FEE_COMPONENTS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input className="w-28" type="number" placeholder="R Amount" value={comp.amount || ""} onChange={(e) => updateComponent(i, "amount", parseFloat(e.target.value) || 0)} />
                                    <label className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                                        <input type="checkbox" checked={comp.optional} onChange={(e) => updateComponent(i, "optional", e.target.checked)} className="rounded" />
                                        Optional
                                    </label>
                                    {components.length > 1 && (
                                        <Button variant="ghost" size="icon" onClick={() => removeComponent(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Base Amount (mandatory components)</span>
                            <span>{formatCurrency(baseAmount)}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Structure
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
