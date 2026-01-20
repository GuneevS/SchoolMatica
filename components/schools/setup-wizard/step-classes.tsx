"use client";

import { useFormContext } from "react-hook-form";
import { WizardValues, DEFAULT_GRADES, NAMING_PATTERNS, generateClassNames, NamingPattern } from "./wizard-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Users } from "lucide-react";

export function StepClasses() {
    const { watch, setValue } = useFormContext<WizardValues>();
    const selectedGrades = watch("selectedGrades") || [];
    const classesPerGrade = watch("classesPerGrade") || {};

    // Get selected grades with their info
    const selectedGradeInfo = selectedGrades
        .map(id => DEFAULT_GRADES.find(g => g.id === id))
        .filter(Boolean)
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

    const updateGradeConfig = (gradeId: string, field: string, value: any) => {
        const current = classesPerGrade[gradeId] || { count: 1, namingPattern: "ALPHA" as NamingPattern };
        setValue("classesPerGrade", {
            ...classesPerGrade,
            [gradeId]: { ...current, [field]: value },
        });
    };

    const getClassConfig = (gradeId: string) => {
        return classesPerGrade[gradeId] || { count: 1, namingPattern: "ALPHA" as NamingPattern };
    };

    // Calculate total classes
    const totalClasses = selectedGrades.reduce((sum, gradeId) => {
        return sum + (getClassConfig(gradeId).count || 1);
    }, 0);

    // Set all grades to same config
    const applyToAll = (count: number, pattern: NamingPattern) => {
        const newConfig: typeof classesPerGrade = {};
        selectedGrades.forEach(gradeId => {
            newConfig[gradeId] = { count, namingPattern: pattern };
        });
        setValue("classesPerGrade", newConfig);
    };

    return (
        <div className="space-y-6 py-4">
            {/* Quick Apply */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Quick Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Apply the same configuration to all grades:
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => applyToAll(1, "ALPHA")}
                            className="rounded-lg border p-3 hover:bg-muted transition-colors text-left"
                        >
                            <p className="font-medium text-sm">1 Class Each</p>
                            <p className="text-xs text-muted-foreground">10A, 11A, 12A...</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyToAll(2, "ALPHA")}
                            className="rounded-lg border p-3 hover:bg-muted transition-colors text-left"
                        >
                            <p className="font-medium text-sm">2 Classes Each</p>
                            <p className="text-xs text-muted-foreground">10A-B, 11A-B...</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyToAll(3, "ALPHA")}
                            className="rounded-lg border p-3 hover:bg-muted transition-colors text-left"
                        >
                            <p className="font-medium text-sm">3 Classes Each</p>
                            <p className="text-xs text-muted-foreground">10A-C, 11A-C...</p>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Per-Grade Configuration */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {selectedGradeInfo.map((grade) => {
                    if (!grade) return null;
                    const config = getClassConfig(grade.id);
                    const previewNames = generateClassNames(grade.id, config.count, config.namingPattern);
                    
                    return (
                        <Card key={grade.id} className="border">
                            <CardContent className="py-3 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="min-w-[80px]">
                                        <p className="font-semibold">{grade.label}</p>
                                        <Badge variant="outline" className="text-xs">
                                            {grade.phase}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs whitespace-nowrap">Classes:</Label>
                                            <Slider
                                                value={[config.count]}
                                                onValueChange={([value]) => updateGradeConfig(grade.id, "count", value)}
                                                min={1}
                                                max={10}
                                                step={1}
                                                className="w-24"
                                            />
                                            <span className="text-sm font-medium w-6">{config.count}</span>
                                        </div>
                                        
                                        <Select
                                            value={config.namingPattern}
                                            onValueChange={(value) => updateGradeConfig(grade.id, "namingPattern", value)}
                                        >
                                            <SelectTrigger className="w-[130px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(NAMING_PATTERNS).map(([key, { label }]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="min-w-[120px] text-right">
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {previewNames.slice(0, 3).map(name => (
                                                <Badge key={name} variant="secondary" className="text-xs">
                                                    {name}
                                                </Badge>
                                            ))}
                                            {previewNames.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{previewNames.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">{totalClasses}</strong> class{totalClasses !== 1 ? "es" : ""} across{" "}
                    <strong className="text-foreground">{selectedGrades.length}</strong> grade{selectedGrades.length !== 1 ? "s" : ""}
                </div>
            </div>
        </div>
    );
}
