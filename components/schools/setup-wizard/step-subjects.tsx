"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { WizardValues, DEFAULT_GRADES, SA_CAPS_SUBJECTS, GradeSubjectEntry, getPhaseForGrade } from "./wizard-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BookOpen, Check } from "lucide-react";

export function StepSubjects() {
    const { watch, setValue } = useFormContext<WizardValues>();
    const selectedGrades = watch("selectedGrades") || [];
    const subjectsByPhase = watch("subjectsByPhase") || {};

    // Get unique phases from selected grades
    const phases = Array.from(new Set(
        selectedGrades.map(gradeId => getPhaseForGrade(gradeId))
    )).sort((a, b) => {
        const order = ["Foundation", "Intermediate", "Senior", "FET"];
        return order.indexOf(a) - order.indexOf(b);
    });

    // Initialize subjects for phases if not already set
    useEffect(() => {
        const currentSubjects = { ...subjectsByPhase };
        let updated = false;

        phases.forEach(phase => {
            if (!currentSubjects[phase]) {
                const phaseSubjects = SA_CAPS_SUBJECTS[phase as keyof typeof SA_CAPS_SUBJECTS] || [];
                currentSubjects[phase] = phaseSubjects.map(s => ({
                    code: s.code,
                    name: s.name,
                    isCompulsory: s.isCompulsory,
                    enabled: s.isCompulsory, // Enable compulsory by default
                }));
                updated = true;
            }
        });

        if (updated) {
            setValue("subjectsByPhase", currentSubjects);
        }
    }, [phases, subjectsByPhase, setValue]);

    const toggleSubject = (phase: string, code: string) => {
        const phaseSubjects = subjectsByPhase[phase] || [];
        const updatedSubjects = phaseSubjects.map(s => {
            if (s.code === code && !s.isCompulsory) {
                return { ...s, enabled: !s.enabled };
            }
            return s;
        });
        setValue("subjectsByPhase", {
            ...subjectsByPhase,
            [phase]: updatedSubjects,
        });
    };

    const enableAllForPhase = (phase: string) => {
        const phaseSubjects = subjectsByPhase[phase] || [];
        const updatedSubjects = phaseSubjects.map(s => ({ ...s, enabled: true }));
        setValue("subjectsByPhase", {
            ...subjectsByPhase,
            [phase]: updatedSubjects,
        });
    };

    const enableCompulsoryOnlyForPhase = (phase: string) => {
        const phaseSubjects = subjectsByPhase[phase] || [];
        const updatedSubjects = phaseSubjects.map(s => ({ ...s, enabled: s.isCompulsory }));
        setValue("subjectsByPhase", {
            ...subjectsByPhase,
            [phase]: updatedSubjects,
        });
    };

    // Count enabled subjects
    const totalEnabled = Object.values(subjectsByPhase).reduce((sum, subjects) => {
        return sum + subjects.filter(s => s.enabled).length;
    }, 0);

    const gradesPerPhase = phases.reduce((acc, phase) => {
        acc[phase] = selectedGrades.filter(g => getPhaseForGrade(g) === phase);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="space-y-6 py-4">
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>
                    Configure subjects for your school. Compulsory subjects are pre-selected based on SA CAPS guidelines.
                </span>
            </div>

            {/* Phase Cards */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {phases.map(phase => {
                    const subjects = subjectsByPhase[phase] || [];
                    const enabledCount = subjects.filter(s => s.enabled).length;
                    const grades = gradesPerPhase[phase] || [];
                    
                    return (
                        <Card key={phase} className="border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{phase} Phase</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Grades: {grades.map(g => g === "R" ? "R" : g).join(", ")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {enabledCount}/{subjects.length} subjects
                                        </Badge>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => enableCompulsoryOnlyForPhase(phase)}
                                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
                                            >
                                                Compulsory only
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => enableAllForPhase(phase)}
                                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
                                            >
                                                All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {subjects.map(subject => {
                                        const isClickable = !subject.isCompulsory;
                                        return (
                                            <div
                                                key={subject.code}
                                                onClick={() => isClickable && toggleSubject(phase, subject.code)}
                                                className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                                                    subject.enabled 
                                                        ? "border-primary/50 bg-primary/5" 
                                                        : "border-border bg-muted/30"
                                                } ${
                                                    isClickable 
                                                        ? "cursor-pointer hover:border-primary/70 hover:shadow-sm" 
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                                        subject.enabled 
                                                            ? "bg-primary/20 text-primary" 
                                                            : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {subject.code.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{subject.name}</p>
                                                        {subject.isCompulsory && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                                                                Compulsory
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    checked={subject.enabled}
                                                    onCheckedChange={() => toggleSubject(phase, subject.code)}
                                                    disabled={subject.isCompulsory}
                                                    className={subject.isCompulsory ? "opacity-70" : ""}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{totalEnabled}</strong> subject{totalEnabled !== 1 ? "s" : ""} selected across{" "}
                    <strong className="text-foreground">{phases.length}</strong> phase{phases.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3" />
                    <span>Subjects will be created when school is set up</span>
                </div>
            </div>
        </div>
    );
}
