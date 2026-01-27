"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Award, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const incidentSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  type: z.enum(["Merit", "Demerit"]),
  points: z.number().min(1, "Points must be at least 1").max(100, "Points cannot exceed 100"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

// Categories for merits and demerits
const MERIT_CATEGORIES = [
  { value: "Academic", label: "Academic Excellence" },
  { value: "Service", label: "Community Service" },
  { value: "Leadership", label: "Leadership" },
  { value: "Sports", label: "Sports Achievement" },
  { value: "Arts", label: "Arts & Culture" },
  { value: "Conduct", label: "Exemplary Conduct" },
];

const DEMERIT_CATEGORIES = [
  { value: "Conduct", label: "Misconduct" },
  { value: "Academic", label: "Academic Dishonesty" },
  { value: "Attendance", label: "Attendance Issues" },
  { value: "Uniform", label: "Uniform Violation" },
  { value: "Disrespect", label: "Disrespectful Behaviour" },
  { value: "Property", label: "Property Damage" },
];

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classGroup: {
    name: string;
  };
}

interface IncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  defaultType?: "Merit" | "Demerit";
}

export function IncidentDialog({
  open,
  onOpenChange,
  schoolId,
  defaultType = "Merit",
}: IncidentDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      studentId: "",
      type: defaultType,
      points: 1,
      category: "",
      description: "",
    },
  });

  const incidentType = form.watch("type");
  const categories = incidentType === "Merit" ? MERIT_CATEGORIES : DEMERIT_CATEGORIES;

  // Search students
  React.useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.length < 2) {
        setStudents([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(
          `/api/students/search?q=${encodeURIComponent(searchQuery)}&schoolId=${schoolId}`
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error("Failed to search students:", error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, schoolId]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedStudent(null);
      setSearchQuery("");
      setStudents([]);
    }
  }, [open, form]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    form.setValue("studentId", student.id);
    setSearchQuery("");
    setStudents([]);
  };

  async function onSubmit(values: IncidentFormData) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/behavior/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          schoolId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record incident");
      }

      toast.success(
        values.type === "Merit" ? "Merit awarded!" : "Demerit recorded",
        {
          description: `${values.points} points ${values.type === "Merit" ? "awarded to" : "recorded for"} ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
        }
      );

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to record incident", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Behaviour Incident</DialogTitle>
          <DialogDescription>
            Award merits or record demerits for student behaviour
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={incidentType}
          onValueChange={(v) => form.setValue("type", v as "Merit" | "Demerit")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="Merit"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              <Award className="h-4 w-4 mr-2" />
              Merit
            </TabsTrigger>
            <TabsTrigger
              value="Demerit"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Demerit
            </TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Student</Label>
              {selectedStudent ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="font-medium">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.classGroup.name} • {selectedStudent.admissionNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(null);
                      form.setValue("studentId", "");
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {(students.length > 0 || searchLoading) && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover/95 backdrop-blur-xl border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : (
                        students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleStudentSelect(student)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                          >
                            <div>
                              <p className="font-medium">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.classGroup.name} • {student.admissionNumber}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {form.formState.errors.studentId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.studentId.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            {/* Points */}
            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                max={100}
                {...form.register("points", { valueAsNumber: true })}
              />
              {form.formState.errors.points && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.points.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder={
                  incidentType === "Merit"
                    ? "Describe the positive behaviour..."
                    : "Describe the incident..."
                }
                {...form.register("description")}
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex-1",
                  incidentType === "Merit"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : incidentType === "Merit" ? (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Award Merit
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Record Demerit
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
