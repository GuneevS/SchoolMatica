"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, Loader2 } from "lucide-react";
import type { ClassGroup, Student, Subject } from "@prisma/client";

interface Props {
  classGroups: (ClassGroup & {
    students: Student[];
    subject: Subject | null;
  })[];
  currentYear: number;
  terms: string[];
}

export function ReportGeneratorForm({ classGroups, currentYear, terms }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeConduct, setIncludeConduct] = useState(true);
  const [teacherComment, setTeacherComment] = useState("");
  const [conductGrade, setConductGrade] = useState("");
  const [effortGrade, setEffortGrade] = useState("");

  const selectedClassGroup = classGroups.find((c) => c.id === selectedClass);
  const students = selectedClassGroup?.students ?? [];

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedTerm || selectedStudents.length === 0) {
      alert("Please select class, term, and at least one student");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId: selectedClass,
          term: selectedTerm,
          year: currentYear,
          studentIds: selectedStudents,
          teacherComment: includeComments ? teacherComment : null,
          conductGrade: includeConduct ? conductGrade : null,
          effortGrade: includeConduct ? effortGrade : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully generated ${data.count} report cards!`);
        router.refresh();
      } else {
        alert("Failed to generate reports");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classGroups.map((classGroup) => (
                    <SelectItem key={classGroup.id} value={classGroup.id}>
                      {classGroup.name} - {classGroup.subject?.name || "General"} ({classGroup.students.length} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <Label>Select Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a term..." />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            {selectedClass && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Students</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                      />
                      <label
                        htmlFor={student.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {student.firstName} {student.lastName} ({student.admissionNumber})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStudents.length} of {students.length} students selected
                </p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeComments"
                  checked={includeComments}
                  onCheckedChange={(checked: boolean) => setIncludeComments(checked)}
                />
                <label htmlFor="includeComments" className="text-sm cursor-pointer">
                  Include teacher comments
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeConduct"
                  checked={includeConduct}
                  onCheckedChange={(checked: boolean) => setIncludeConduct(checked)}
                />
                <label htmlFor="includeConduct" className="text-sm cursor-pointer">
                  Include conduct and effort grades
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {includeComments && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teacher Comment (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter general teacher comment to include on all selected report cards..."
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This comment will be applied to all selected students. You can edit individual comments later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conduct Grades */}
        {includeConduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conduct & Effort (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Conduct Grade</Label>
                <Select value={conductGrade} onValueChange={setConductGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Good</SelectItem>
                    <SelectItem value="C">C - Satisfactory</SelectItem>
                    <SelectItem value="D">D - Needs Improvement</SelectItem>
                    <SelectItem value="E">E - Unsatisfactory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Effort Grade</Label>
                <Select value={effortGrade} onValueChange={setEffortGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Good</SelectItem>
                    <SelectItem value="C">C - Satisfactory</SelectItem>
                    <SelectItem value="D">D - Needs Improvement</SelectItem>
                    <SelectItem value="E">E - Unsatisfactory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Sidebar */}
      <div className="space-y-4">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Generation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Class:</span>
                <span className="font-medium">{selectedClassGroup?.name || "Not selected"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Term:</span>
                <span className="font-medium">{selectedTerm || "Not selected"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{currentYear}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Students:</span>
                <Badge variant="secondary">{selectedStudents.length}</Badge>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isPending || !selectedClass || !selectedTerm || selectedStudents.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {selectedStudents.length} Report{selectedStudents.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p>• Reports will be created in Draft status</p>
              <p>• You can edit individual reports before publishing</p>
              <p>• Grades will be calculated automatically from markbook data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
