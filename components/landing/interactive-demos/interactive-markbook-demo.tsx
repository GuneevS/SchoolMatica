"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  Flame,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  generateDemoMarkbookData,
  type DemoStudent,
  type DemoAssessment,
  type DemoMark,
} from "@/lib/demo/demo-data-generator";

interface InteractiveMarkbookDemoProps {
  onInteraction?: () => void;
}

export function InteractiveMarkbookDemo({ onInteraction }: InteractiveMarkbookDemoProps) {
  // Generate demo data
  const demoData = useMemo(() => generateDemoMarkbookData(12), []);

  const [termFilter, setTermFilter] = useState<string>("ALL");
  const [heatMapMode, setHeatMapMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(demoData.students[0]?.id ?? "");
  const [editingCell, setEditingCell] = useState<{ studentId: string; assessmentId: string } | null>(null);
  const [localMarks, setLocalMarks] = useState<Map<string, number>>(new Map());

  // Filter assessments by term
  const filteredAssessments = useMemo(() => {
    if (termFilter === "ALL") return demoData.assessments;
    return demoData.assessments.filter((a) => a.term === termFilter);
  }, [demoData.assessments, termFilter]);

  // Get mark for student and assessment
  const getMark = (studentId: string, assessmentId: string): DemoMark | undefined => {
    return demoData.marks.find(
      (m) => m.studentId === studentId && m.assessmentId === assessmentId
    );
  };

  // Calculate student average
  const calculateStudentAverage = (studentId: string): number | null => {
    const studentMarks = demoData.marks.filter((m) => m.studentId === studentId && !m.isAbsent && m.percentage !== null);
    if (studentMarks.length === 0) return null;

    const sum = studentMarks.reduce((acc, m) => acc + (m.percentage ?? 0), 0);
    return Math.round(sum / studentMarks.length);
  };

  // Calculate class average for assessment
  const calculateAssessmentAverage = (assessmentId: string): number | null => {
    const assessmentMarks = demoData.marks.filter(
      (m) => m.assessmentId === assessmentId && !m.isAbsent && m.percentage !== null
    );
    if (assessmentMarks.length === 0) return null;

    const sum = assessmentMarks.reduce((acc, m) => acc + (m.percentage ?? 0), 0);
    return Math.round(sum / assessmentMarks.length);
  };

  // Get heat map color
  const getHeatMapColor = (percentage: number | null): string => {
    if (percentage === null) return "";
    if (percentage >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (percentage >= 60) return "bg-blue-100 dark:bg-blue-900/30";
    if (percentage >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (percentage >= 40) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  // Handle cell click
  const handleCellClick = (studentId: string, assessmentId: string) => {
    if (onInteraction) onInteraction();
    const mark = getMark(studentId, assessmentId);
    if (mark && !mark.isAbsent) {
      setEditingCell({ studentId, assessmentId });
    }
  };

  // Handle mark change
  const handleMarkChange = (value: string) => {
    if (!editingCell) return;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const key = `${editingCell.studentId}_${editingCell.assessmentId}`;
      setLocalMarks(new Map(localMarks.set(key, numValue)));
    }
  };

  // Handle save
  const handleSave = () => {
    if (!editingCell) return;
    // In real app, would save to API here
    setEditingCell(null);
  };

  const selectedStudent = demoData.students.find((s) => s.id === selectedStudentId);
  const studentAverage = selectedStudentId ? calculateStudentAverage(selectedStudentId) : null;

  return (
    <div className="space-y-4 p-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Terms</SelectItem>
            <SelectItem value="T1">Term 1</SelectItem>
            <SelectItem value="T2">Term 2</SelectItem>
            <SelectItem value="T3">Term 3</SelectItem>
            <SelectItem value="T4">Term 4</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={heatMapMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (onInteraction) onInteraction();
            setHeatMapMode(!heatMapMode);
          }}
        >
          <Flame className="w-4 h-4 mr-2" />
          Heat Map
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          Click any cell to edit • {filteredAssessments.length} assessments shown
        </div>
      </div>

      {/* Grid Container */}
      <Card className="overflow-x-auto border-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 p-3 text-left font-semibold min-w-[180px]">
                Student
              </th>
              {filteredAssessments.map((assessment) => (
                <th key={assessment.id} className="p-3 text-center font-medium min-w-[100px]">
                  <div className="space-y-1">
                    <div className="font-semibold">{assessment.taskName.split(":")[0]}</div>
                    <Badge variant="outline" className="text-xs">
                      {assessment.term} • {assessment.weightPercent}%
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Class avg: {calculateAssessmentAverage(assessment.id) ?? "—"}%
                    </div>
                  </div>
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-muted/50 p-3 text-center font-semibold min-w-[100px]">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {demoData.students.map((student) => {
              const isSelected = student.id === selectedStudentId;
              const avg = calculateStudentAverage(student.id);

              return (
                <tr
                  key={student.id}
                  className={cn(
                    "border-b hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (onInteraction) onInteraction();
                    setSelectedStudentId(student.id);
                  }}
                >
                  <td className="sticky left-0 z-10 bg-background p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        avg !== null && avg >= 80 ? "bg-green-500" :
                        avg !== null && avg >= 50 ? "bg-yellow-500" :
                        avg !== null ? "bg-red-500" : "bg-gray-300"
                      )} />
                      <div>
                        <div className="font-semibold">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-muted-foreground">{student.admissionNumber}</div>
                      </div>
                    </div>
                  </td>
                  {filteredAssessments.map((assessment) => {
                    const mark = getMark(student.id, assessment.id);
                    const localKey = `${student.id}_${assessment.id}`;
                    const displayValue = localMarks.get(localKey) ?? mark?.percentage ?? null;
                    const isEditing = editingCell?.studentId === student.id && editingCell?.assessmentId === assessment.id;

                    return (
                      <td
                        key={assessment.id}
                        className={cn(
                          "p-2 text-center cursor-pointer transition-colors",
                          heatMapMode && displayValue !== null && getHeatMapColor(displayValue),
                          isEditing && "ring-2 ring-primary"
                        )}
                        onClick={() => handleCellClick(student.id, assessment.id)}
                      >
                        {mark?.isAbsent ? (
                          <Badge variant="secondary">ABS</Badge>
                        ) : mark?.percentage === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={displayValue ?? ""}
                              onChange={(e) => handleMarkChange(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 h-8 text-center"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn(
                                  "font-semibold",
                                  displayValue !== null && displayValue >= 80 ? "text-green-600 dark:text-green-400" :
                                  displayValue !== null && displayValue >= 50 ? "text-blue-600 dark:text-blue-400" :
                                  displayValue !== null && displayValue >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                                  displayValue !== null ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                                )}>
                                  {displayValue}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <div>Raw: {mark?.rawMark}/{assessment.totalMark}</div>
                                  <div>Weight: {assessment.weightPercent}%</div>
                                  <div>Status: {mark?.status}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 bg-background p-3 text-center font-bold">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md",
                      avg !== null && avg >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                      avg !== null && avg >= 50 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
                      avg !== null ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                      "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300"
                    )}>
                      {avg !== null ? (
                        <>
                          {avg >= 80 && <TrendingUp className="w-3 h-3" />}
                          {avg < 50 && <AlertCircle className="w-3 h-3" />}
                          {avg}%
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Selected Student Summary */}
      {selectedStudent && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedStudent.admissionNumber} • {selectedStudent.gender}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Overall Average</p>
              <p className="text-2xl font-bold">
                {studentAverage !== null ? `${studentAverage}%` : "—"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Demo Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>Demo Features:</strong> Click cells to edit marks, toggle heat map mode, filter by term, view class and student averages. All calculations are automatic!
        </p>
      </div>
    </div>
  );
}
