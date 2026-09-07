"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Check, AlertCircle, Loader2, FileText } from "lucide-react";
import { parseCSVWithHeaders } from "@/lib/utils/csv";
import { formatCurrency } from "@/lib/utils/currency";

interface BankEntry {
    date: string;
    description: string;
    amount: number;
    reference?: string;
    balance?: number;
}

interface MatchedEntry {
    bankEntry: BankEntry;
    invoice: {
        id: string;
        invoiceNumber: string;
        student: string;
        admissionNumber: string;
        totalAmount: number;
        balanceDue: number;
        status: string;
    };
    confidence: number;
    matchType: string;
}

interface ReconcileResult {
    summary: { totalEntries: number; matched: number; unmatched: number; alreadyReconciled: number; totalMatchedAmount: number };
    matched: MatchedEntry[];
    unmatched: BankEntry[];
    alreadyReconciled: BankEntry[];
}

interface BankReconciliationTabProps {
    onRefresh: () => void;
}

function parseCSV(text: string): BankEntry[] {
    const rows = parseCSVWithHeaders(text);
    if (rows.length === 0) return [];

    // Find column headers by matching common bank statement patterns
    const findCol = (patterns: string[]) => Object.keys(rows[0]).find((key) => patterns.some((p) => key.toLowerCase().includes(p)));

    const dateCol = findCol(["date"]);
    const descCol = findCol(["desc", "detail", "narr"]);
    const amountCol = findCol(["amount", "credit", "debit"]);
    const refCol = findCol(["ref", "number"]);
    const balCol = findCol(["bal"]);

    if (!dateCol || !amountCol) return [];

    return rows.map((row) => {
        const amount = parseFloat((row[amountCol] || "0").replace(/[^\d.-]/g, ""));
        return {
            date: row[dateCol] || "",
            description: (descCol ? row[descCol] : "") || "",
            amount: Math.abs(amount),
            reference: refCol ? row[refCol] : undefined,
            balance: balCol ? parseFloat((row[balCol] || "0").replace(/[^\d.-]/g, "")) : undefined,
        };
    }).filter((e) => e.amount > 0);
}

export function BankReconciliationTab({ onRefresh }: BankReconciliationTabProps) {
    const [loading, setLoading] = useState(false);
    const [approving, setApproving] = useState(false);
    const [result, setResult] = useState<ReconcileResult | null>(null);
    const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setError("");
        setLoading(true);

        try {
            const text = await file.text();
            const entries = parseCSV(text);
            if (entries.length === 0) {
                setError("Could not parse bank statement CSV. Ensure it has Date, Description/Detail, and Amount columns.");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/fees/bank-reconcile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries }),
            });
            if (!res.ok) throw new Error("Reconciliation failed");
            const data = await res.json();
            setResult(data);
            setSelectedMatches(new Set(data.matched.map((_: MatchedEntry, i: number) => i)));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to process statement");
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleMatch = (idx: number) => {
        const next = new Set(selectedMatches);
        if (next.has(idx)) {
            next.delete(idx);
        } else {
            next.add(idx);
        }
        setSelectedMatches(next);
    };

    const handleApproveMatches = async () => {
        if (!result || selectedMatches.size === 0) return;
        setApproving(true);
        try {
            const matches = Array.from(selectedMatches).map((idx) => ({
                bankEntry: result.matched[idx].bankEntry,
                invoiceId: result.matched[idx].invoice.id,
                paymentMethod: "EFT",
            }));
            const res = await fetch("/api/fees/bank-reconcile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matches }),
            });
            if (!res.ok) throw new Error("Failed to approve matches");
            setResult(null); setSelectedMatches(new Set()); setFileName("");
            onRefresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to approve");
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bank Statement Reconciliation</CardTitle>
                    <CardDescription>Upload a bank statement CSV to auto-match payments against outstanding invoices. Supports standard SA bank CSV formats (FNB, Standard Bank, Nedbank, ABSA, Capitec).</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 mb-4">{error}</div>}

                    <div className="flex items-center gap-4 mb-6">
                        <label className="flex items-center gap-2 px-6 py-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-[hsl(var(--accent-violet))] transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{fileName || "Upload Bank Statement CSV"}</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={loading} />
                        </label>
                        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>

                    {result && (
                        <>
                            <div className="grid gap-4 md:grid-cols-4 mb-6">
                                <div className="p-4 bg-muted/50 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{result.summary.totalEntries}</p>
                                    <p className="text-sm text-muted-foreground">Total Entries</p>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{result.summary.matched}</p>
                                    <p className="text-sm text-muted-foreground">Matched</p>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-amber-600">{result.summary.unmatched}</p>
                                    <p className="text-sm text-muted-foreground">Unmatched</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.summary.totalMatchedAmount)}</p>
                                    <p className="text-sm text-muted-foreground">Matched Amount</p>
                                </div>
                            </div>

                            {result.matched.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-emerald-700 flex items-center gap-2"><Check className="h-4 w-4" />Matched Entries ({result.matched.length})</h3>
                                        <Button onClick={handleApproveMatches} disabled={approving || selectedMatches.size === 0} className="bg-emerald-600 hover:bg-emerald-700">
                                            {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                            Approve {selectedMatches.size} Matches
                                        </Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10"></TableHead>
                                                <TableHead>Bank Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>→ Invoice</TableHead>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Balance Due</TableHead>
                                                <TableHead>Confidence</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.matched.map((match, idx) => (
                                                <TableRow key={idx} className={selectedMatches.has(idx) ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}>
                                                    <TableCell>
                                                        <input type="checkbox" checked={selectedMatches.has(idx)} onChange={() => toggleMatch(idx)} className="rounded" />
                                                    </TableCell>
                                                    <TableCell className="text-sm">{match.bankEntry.date}</TableCell>
                                                    <TableCell className="text-sm max-w-[200px] truncate">{match.bankEntry.description}</TableCell>
                                                    <TableCell className="font-medium text-emerald-600">{formatCurrency(match.bankEntry.amount)}</TableCell>
                                                    <TableCell className="font-medium">{match.invoice.invoiceNumber}</TableCell>
                                                    <TableCell>{match.invoice.student}</TableCell>
                                                    <TableCell>{formatCurrency(match.invoice.balanceDue)}</TableCell>
                                                    <TableCell>
                                                        <Badge className={match.confidence >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                                                            {match.confidence}%
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {result.unmatched.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-3"><AlertCircle className="h-4 w-4" />Unmatched Entries ({result.unmatched.length})</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Reference</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.unmatched.map((entry, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{entry.date}</TableCell>
                                                    <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                                                    <TableCell>{formatCurrency(entry.amount)}</TableCell>
                                                    <TableCell>{entry.reference || "-"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}

                    {!result && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Upload a bank statement CSV to begin reconciliation</p>
                            <p className="text-sm mt-1">The system will automatically match deposits against outstanding invoices by invoice number, student name, and amount.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
