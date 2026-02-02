"use client";

import { useFormContext } from "react-hook-form";
import { WizardValues, DEFAULT_GRADES, SCHOOL_PHASES } from "./wizard-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const PHASE_COLORS: Record<string, string> = {
    Foundation: "bg-[hsl(var(--accent-mint))/0.15] border-[hsl(var(--accent-mint))/0.35] text-[hsl(var(--accent-mint))]",
    Intermediate: "bg-[hsl(var(--accent-cobalt))/0.15] border-[hsl(var(--accent-cobalt))/0.35] text-[hsl(var(--accent-cobalt))]",
    Senior: "bg-[hsl(var(--accent-iris))/0.15] border-[hsl(var(--accent-iris))/0.35] text-[hsl(var(--accent-iris))]",
    FET: "bg-[hsl(var(--accent-gold))/0.15] border-[hsl(var(--accent-gold))/0.35] text-[hsl(var(--accent-gold))]",
};

export function StepGrades() {
    const { watch, setValue } = useFormContext<WizardValues>();
    const selected = watch("selectedGrades") || [];
    const schoolType = watch("schoolType");

    const toggleGrade = (gradeId: string) => {
        if (selected.includes(gradeId)) {
            setValue("selectedGrades", selected.filter(g => g !== gradeId));
        } else {
            setValue("selectedGrades", [...selected, gradeId]);
        }
    };

    const selectPhase = (phase: keyof typeof SCHOOL_PHASES) => {
        const phaseGrades = SCHOOL_PHASES[phase].grades as readonly string[];
        const currentSelected = new Set(selected);
        const allSelected = phaseGrades.every(g => currentSelected.has(g));
        
        if (allSelected) {
            // Deselect all in phase
            setValue("selectedGrades", selected.filter(g => !phaseGrades.includes(g)));
        } else {
            // Select all in phase
            const newSelected = new Set([...selected, ...phaseGrades]);
            setValue("selectedGrades", Array.from(newSelected));
        }
    };

    const selectHighSchool = () => {
        setValue("selectedGrades", ["8", "9", "10", "11", "12"]);
        setValue("schoolType", "high");
    };
    
    const selectPrimarySchool = () => {
        setValue("selectedGrades", ["R", "1", "2", "3", "4", "5", "6", "7"]);
        setValue("schoolType", "primary");
    };
    
    const selectCombined = () => {
        setValue("selectedGrades", DEFAULT_GRADES.map(g => g.id));
        setValue("schoolType", "combined");
    };

    // Group grades by phase
    const gradesByPhase = DEFAULT_GRADES.reduce((acc, grade) => {
        if (!acc[grade.phase]) acc[grade.phase] = [];
        acc[grade.phase].push(grade);
        return acc;
    }, {} as Record<string, typeof DEFAULT_GRADES[number][]>);

    return (
        <div className="space-y-6 py-4">
            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2 text-sm">
                <button
                    type="button"
                    onClick={selectPrimarySchool}
                    className={cn(
                        "px-3 py-1.5 rounded-full border transition-all",
                        schoolType === "primary"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                    )}
                >
                    Primary School (R-7)
                </button>
                <button
                    type="button"
                    onClick={selectHighSchool}
                    className={cn(
                        "px-3 py-1.5 rounded-full border transition-all",
                        schoolType === "high"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                    )}
                >
                    High School (8-12)
                </button>
                <button
                    type="button"
                    onClick={selectCombined}
                    className={cn(
                        "px-3 py-1.5 rounded-full border transition-all",
                        schoolType === "combined"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                    )}
                >
                    Combined (R-12)
                </button>
            </div>

            {/* Grades by Phase */}
            <div className="space-y-4">
                {Object.entries(gradesByPhase).map(([phase, grades]) => {
                    const phaseKey = phase as keyof typeof SCHOOL_PHASES;
                    const phaseGrades = grades.map(g => g.id);
                    const selectedInPhase = phaseGrades.filter(g => selected.includes(g));
                    const allSelected = selectedInPhase.length === phaseGrades.length;
                    
                    return (
                        <Card key={phase} className={cn("border", PHASE_COLORS[phase])}>
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{phase} Phase</CardTitle>
                                        <CardDescription className="text-xs">
                                            {SCHOOL_PHASES[phaseKey].description}
                                        </CardDescription>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => selectPhase(phaseKey)}
                                        className={cn(
                                            "text-xs px-2 py-1 rounded border transition-all",
                                            allSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background hover:bg-muted"
                                        )}
                                    >
                                        {allSelected ? "Deselect All" : "Select All"}
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                                <div className="flex flex-wrap gap-2">
                                    {grades.map((grade) => {
                                        const isSelected = selected.includes(grade.id);
                                        return (
                                            <button
                                                key={grade.id}
                                                type="button"
                                                onClick={() => toggleGrade(grade.id)}
                                                className={cn(
                                                    "relative cursor-pointer rounded-xl border p-3 text-center transition-all min-w-[70px]",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                                        : "bg-background hover:bg-muted border-border"
                                                )}
                                            >
                                                {isSelected && (
                                                    <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-white rounded-full" />
                                                )}
                                                <p className="font-semibold">{grade.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                    <strong>{selected.length}</strong> grade{selected.length !== 1 ? "s" : ""} selected
                </div>
                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {selected.sort((a, b) => {
                            const orderA = DEFAULT_GRADES.find(g => g.id === a)?.order ?? 0;
                            const orderB = DEFAULT_GRADES.find(g => g.id === b)?.order ?? 0;
                            return orderA - orderB;
                        }).map(gradeId => (
                            <Badge key={gradeId} variant="secondary" className="text-xs">
                                {DEFAULT_GRADES.find(g => g.id === gradeId)?.label}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
