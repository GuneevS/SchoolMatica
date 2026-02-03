"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen, Settings } from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    phase: string;
}

interface GradeLevel {
    id: string;
    name: string;
    order: number;
}

interface GradeSubjectConfig {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    isCompulsory: boolean;
}

interface Props {
    schoolId: string;
    subjects: Subject[];
    gradeLevels: GradeLevel[];
    configsByGrade: Record<string, GradeSubjectConfig[]>;
}

const PHASE_OPTIONS = ["Foundation", "Intermediate", "Senior", "FET"];

export function SubjectConfigForm({ schoolId, subjects, gradeLevels, configsByGrade }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedGrade, setSelectedGrade] = useState<string>(gradeLevels[0]?.id || "");
    const [addSubjectOpen, setAddSubjectOpen] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: "", code: "", phase: "FET" });

    const currentGradeConfigs = configsByGrade[selectedGrade] || [];
    const availableSubjects = subjects.filter(
        s => !currentGradeConfigs.some(c => c.subjectId === s.id)
    );

    const handleAddSubject = async () => {
        if (!newSubject.name || !newSubject.code) return;

        startTransition(async () => {
            await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newSubject,
                    schoolId,
                }),
            });
            setNewSubject({ name: "", code: "", phase: "FET" });
            setAddSubjectOpen(false);
            router.refresh();
        });
    };

    const handleLinkSubjectToGrade = async (subjectId: string, isCompulsory: boolean) => {
        startTransition(async () => {
            await fetch("/api/grade-subject-configs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schoolId,
                    gradeLevelId: selectedGrade,
                    subjectId,
                    isCompulsory,
                }),
            });
            router.refresh();
        });
    };

    const handleUnlinkSubjectFromGrade = async (subjectId: string) => {
        startTransition(async () => {
            await fetch(`/api/grade-subject-configs?gradeLevelId=${selectedGrade}&subjectId=${subjectId}`, {
                method: "DELETE",
            });
            router.refresh();
        });
    };

    const handleToggleCompulsory = async (subjectId: string, isCompulsory: boolean) => {
        startTransition(async () => {
            await fetch("/api/grade-subject-configs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gradeLevelId: selectedGrade,
                    subjectId,
                    isCompulsory,
                }),
            });
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* Actions Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Label>Grade Level:</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                            {gradeLevels.map(grade => (
                                <SelectItem key={grade.id} value={grade.id}>
                                    {grade.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Subject</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>Subject Name</Label>
                                <Input
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    placeholder="e.g., Mathematics"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Subject Code</Label>
                                <Input
                                    value={newSubject.code}
                                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., MATH"
                                    maxLength={10}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Phase</Label>
                                <Select
                                    value={newSubject.phase}
                                    onValueChange={(value) => setNewSubject({ ...newSubject, phase: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PHASE_OPTIONS.map(phase => (
                                            <SelectItem key={phase} value={phase}>
                                                {phase}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddSubject} disabled={isPending || !newSubject.name || !newSubject.code}>
                                {isPending ? "Adding..." : "Add Subject"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Current Grade Subjects */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Subjects for {gradeLevels.find(g => g.id === selectedGrade)?.name || "Selected Grade"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentGradeConfigs.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">
                            No subjects configured for this grade. Add subjects from the list below.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {currentGradeConfigs.map(config => (
                                <div
                                    key={config.subjectId}
                                    className="flex items-center justify-between rounded-lg border p-3 bg-primary/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                            {config.subjectCode.slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{config.subjectName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Checkbox
                                                    id={`compulsory-${config.subjectId}`}
                                                    checked={config.isCompulsory}
                                                    onCheckedChange={(checked) => 
                                                        handleToggleCompulsory(config.subjectId, Boolean(checked))
                                                    }
                                                    disabled={isPending}
                                                />
                                                <label
                                                    htmlFor={`compulsory-${config.subjectId}`}
                                                    className="text-xs text-muted-foreground cursor-pointer"
                                                >
                                                    Compulsory
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleUnlinkSubjectFromGrade(config.subjectId)}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Available Subjects to Add */}
            {availableSubjects.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings className="h-4 w-4" />
                            Available Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {availableSubjects.map(subject => (
                                <button
                                    key={subject.id}
                                    onClick={() => handleLinkSubjectToGrade(subject.id, false)}
                                    disabled={isPending}
                                    className="flex items-center gap-2 rounded-lg border p-2 text-left hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                        {subject.code.slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{subject.name}</p>
                                        <Badge variant="outline" className="text-[10px] h-4">
                                            {subject.phase}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All Subjects List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All School Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {subjects.map(subject => (
                            <div
                                key={subject.id}
                                className="flex items-center gap-2 rounded-lg border p-2"
                            >
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                    {subject.code.slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{subject.name}</p>
                                    <Badge variant="outline" className="text-[10px] h-4">
                                        {subject.phase}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
