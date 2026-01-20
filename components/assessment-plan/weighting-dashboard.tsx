"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Save, Info, Scale } from "lucide-react";
import { Assessment } from "@prisma/client";
import { useWeightingLogic, TermWeights } from "@/lib/hooks/use-weighting-logic";

interface WeightingDashboardProps {
    planId: string;
    assessments: Assessment[];
    termWeights: TermWeights | null;
    yearTerm: string; // "T1", "T2"
    canEdit?: boolean;
}

export function WeightingDashboard({ 
    planId,
    assessments, 
    termWeights: initialTermWeights, 
    yearTerm,
    canEdit = true 
}: WeightingDashboardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

    const {
        assessments: localAssessments,
        termWeights,
        totalsByTerm,
        termWeightTotal,
        isTermWeightsValid,
        effectiveWeights,
        hasChanges,
        updateWeight,
        updateWeightPercentage,
        updateTermWeight,
        balanceTermWeights,
        markSaved,
    } = useWeightingLogic(assessments, initialTermWeights);

    // Filter for current term
    const termAssessments = localAssessments.filter(a => a.term === yearTerm);
    const totalRawWeight = totalsByTerm[yearTerm] || 0;
    const termContribution = termWeights[yearTerm] || 0;

    // Calculate percentage validity for term assessments
    const currentTotalPercentage = termAssessments.reduce((sum, a) => {
        return sum + (totalRawWeight > 0 ? (a.rawWeight / totalRawWeight) * 100 : 0);
    }, 0);

    const isValid = Math.abs(currentTotalPercentage - 100) < 0.1;

    // Save weights to backend
    const handleSave = async () => {
        if (!canEdit) return;
        
        setSaveSuccess(null);
        
        startTransition(async () => {
            try {
                // Save assessment weights
                const weightUpdates = localAssessments.map(a => ({
                    id: a.id,
                    rawWeight: a.rawWeight,
                }));

                await fetch(`/api/assessment-plans/${planId}/weights`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ updates: weightUpdates }),
                });

                // Save term weights
                await fetch(`/api/assessment-plans/${planId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ termWeights }),
                });

                markSaved();
                setSaveSuccess(true);
                router.refresh();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSaveSuccess(null), 3000);
            } catch (error) {
                console.error("Failed to save weights:", error);
                setSaveSuccess(false);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Save Status Banner */}
            {saveSuccess === true && (
                <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                        Weights saved successfully!
                    </AlertDescription>
                </Alert>
            )}
            {saveSuccess === false && (
                <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        Failed to save weights. Please try again.
                    </AlertDescription>
                </Alert>
            )}

            {/* Term Configuration Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5" />
                            Term Grade Composition
                        </CardTitle>
                        <CardDescription>How {yearTerm} contributes to the final year mark</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={termContribution.toFixed(1)}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && canEdit) {
                                        updateTermWeight(yearTerm, val);
                                    }
                                }}
                                className="w-24 text-center font-bold text-xl"
                                min="0"
                                max="100"
                                step="0.5"
                                disabled={!canEdit}
                            />
                            <span className="text-xl font-bold">%</span>
                            <Slider
                                value={[termContribution]}
                                max={100}
                                step={0.5}
                                onValueChange={(val) => canEdit && updateTermWeight(yearTerm, val[0])}
                                className="flex-1"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Term SBA</span>
                            <span>Other Terms ({(100 - termContribution).toFixed(1)}%)</span>
                        </div>
                        <Progress value={termContribution} className="h-4" />
                        
                        {/* Term Weight Validation */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">All terms total:</span>
                                <Badge variant={isTermWeightsValid ? "default" : "destructive"}>
                                    {termWeightTotal.toFixed(1)}%
                                </Badge>
                                {!isTermWeightsValid && (
                                    <span className="text-destructive text-xs">
                                        (should be 100%)
                                    </span>
                                )}
                            </div>
                            {!isTermWeightsValid && canEdit && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={balanceTermWeights}
                                >
                                    Auto-balance
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Validation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-full pt-0">
                        {isValid && isTermWeightsValid ? (
                            <div className="text-center text-green-600">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                                <p className="font-medium">All weights balance</p>
                            </div>
                        ) : (
                            <div className="text-center text-amber-600">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                                {!isValid && (
                                    <p className="font-medium">Term: {currentTotalPercentage.toFixed(1)}%</p>
                                )}
                                {!isTermWeightsValid && (
                                    <p className="font-medium">Terms: {termWeightTotal.toFixed(1)}%</p>
                                )}
                                <p className="text-xs mt-1">Both should equal 100%</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assessment Weights Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Assessments</CardTitle>
                        <CardDescription>Adjust the relative weighting of each task within {yearTerm}</CardDescription>
                    </div>
                    {hasChanges && canEdit && (
                        <Button onClick={handleSave} disabled={isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Max Marks</TableHead>
                                <TableHead className="text-right">Weight (%)</TableHead>
                                <TableHead className="text-right">Final Contribution</TableHead>
                                <TableHead className="text-right text-muted-foreground">Raw Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {termAssessments.map((assessment) => {
                                const percentage = totalRawWeight > 0 ? (assessment.rawWeight / totalRawWeight) * 100 : 0;
                                const effective = effectiveWeights[assessment.id];
                                return (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-medium">{assessment.taskName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{assessment.type || "Task"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{assessment.totalMark}</TableCell>
                                        <TableCell className="text-right max-w-[100px]">
                                            <div className="flex items-center justify-end gap-2">
                                                <Input
                                                    type="number"
                                                    className="w-20 text-right"
                                                    value={percentage.toFixed(1)}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && canEdit) {
                                                            updateWeightPercentage(assessment.id, val, yearTerm);
                                                        }
                                                    }}
                                                    disabled={!canEdit}
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-muted-foreground">%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge className="bg-primary/10 text-primary">
                                                {effective?.effectiveFinalPercent.toFixed(1) || "0"}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {assessment.rawWeight.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {termAssessments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No assessments defined for this term.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* Info Box */}
                    <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>Total marks and weights are independent.</strong> A 5-mark quiz can contribute 90% if weighted that way.
                            The &quot;Final Contribution&quot; shows how much each assessment contributes to the year mark.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}
