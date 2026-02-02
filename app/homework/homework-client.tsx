"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Clock,
  Check,
  X,
  AlertTriangle,
  Bell,
  Search,
  Activity,
  Send,
  Eye,
  MoreVertical,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Homework {
  id: string;
  title: string;
  subject: string;
  class: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  submissions: { submitted: number; late: number; missing: number };
  totalStudents: number;
}

interface Submission {
  homeworkId: string;
  id: string;
  student: string;
  status: string;
  submittedAt: string | null;
  grade: string | null;
}

interface HomeworkPageClientProps {
  homework: Homework[];
  submissions: Submission[];
}

const heroHighlights = [
  { label: "Quick assignment", color: "hsl(var(--accent-iris))" },
  { label: "Auto-notifications", color: "hsl(var(--accent-mint))" },
  { label: "Parent alerts", color: "hsl(var(--accent-gold))" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Submitted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Late":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "Missing":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "Pending":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    case "Active":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Completed":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    case "Excused":
      return "bg-[hsl(var(--accent-violet))/0.12] text-[hsl(var(--accent-violet))] dark:bg-[hsl(var(--accent-violet))/0.28] dark:text-[hsl(var(--accent-violet))]";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }
};

export function HomeworkPageClient({ homework, submissions }: HomeworkPageClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const filteredHomework = homework.filter((hw) => {
    const matchesSearch = hw.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !classFilter || hw.class === classFilter;
    const matchesSubject = !subjectFilter || hw.subject === subjectFilter;
    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && hw.status === "Active") ||
      (activeTab === "completed" && hw.status === "Completed");
    return matchesSearch && matchesClass && matchesSubject && matchesTab;
  });

  const totalSubmitted = homework.reduce((acc, hw) => acc + hw.submissions.submitted, 0);
  const totalMissing = homework.reduce((acc, hw) => acc + hw.submissions.missing, 0);
  const totalLate = homework.reduce((acc, hw) => acc + hw.submissions.late, 0);
  const activeCount = homework.filter(h => h.status === "Active").length;

  // Get unique classes and subjects for filters
  const uniqueClasses = [...new Set(homework.map(hw => hw.class))];
  const uniqueSubjects = [...new Set(homework.map(hw => hw.subject))];

  // Get submissions for selected homework
  const selectedSubmissions = selectedHomework
    ? submissions.filter(s => s.homeworkId === selectedHomework.id)
    : [];

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Assignment Tracking"
        title={
          <>
            <span className="gradient-text">Homework</span> Management
          </>
        }
        description="Assign homework, track submissions, and automatically notify parents when assignments are missing or late. Streamlined workflow for busy teachers."
        badges={heroHighlights}
        aside={
          <HeroMetricPanel
            title="This week"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              {
                label: "Active",
                value: activeCount.toString(),
                helper: "Assignments",
                accent: "highlight",
              },
              { label: "Submitted", value: totalSubmitted.toString() },
              { label: "Missing", value: totalMissing.toString() },
              { label: "Late", value: totalLate.toString() },
            ]}
          />
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="all">All Homework</TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge className="ml-2 bg-blue-500 text-white">
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Homework</DialogTitle>
                <DialogDescription>
                  Assign homework to a class with a due date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input id="title" placeholder="e.g., Chapter 5 Exercises" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueClasses.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSubjects.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueTime">Due Time</Label>
                    <Input id="dueTime" type="time" defaultValue="08:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Instructions (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide any additional instructions..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag files here or click to upload
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Checkbox id="notifyParents" />
                  <Label htmlFor="notifyParents" className="text-sm cursor-pointer">
                    Automatically notify parents of missing submissions after due date
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
                  Create Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search homework..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {uniqueClasses.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {uniqueSubjects.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all" className="m-0">
          <HomeworkList
            homework={filteredHomework}
            onSelect={setSelectedHomework}
          />
        </TabsContent>
        <TabsContent value="active" className="m-0">
          <HomeworkList
            homework={filteredHomework}
            onSelect={setSelectedHomework}
          />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <HomeworkList
            homework={filteredHomework}
            onSelect={setSelectedHomework}
          />
        </TabsContent>
      </Tabs>

      {/* Submission Details Dialog */}
      <Dialog open={!!selectedHomework} onOpenChange={() => setSelectedHomework(null)}>
        <DialogContent className="max-w-4xl">
          {selectedHomework && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedHomework.title}</DialogTitle>
                <DialogDescription>
                  {selectedHomework.subject} • {selectedHomework.class} • Due: {selectedHomework.dueDate}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {/* Submission Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {selectedHomework.submissions.submitted}
                    </p>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedHomework.submissions.late}
                    </p>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {selectedHomework.submissions.missing}
                    </p>
                    <p className="text-sm text-muted-foreground">Missing</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {selectedHomework.totalStudents > 0
                        ? Math.round(
                            (selectedHomework.submissions.submitted /
                              selectedHomework.totalStudents) *
                              100
                          )
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Completion</p>
                  </div>
                </div>

                {/* Submissions Table */}
                {selectedSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No students in this class</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.student}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(submission.status)}>
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{submission.submittedAt || "-"}</TableCell>
                          <TableCell>{submission.grade || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {submission.status === "Missing" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-600"
                                >
                                  <Bell className="h-4 w-4 mr-1" />
                                  Notify Parent
                                </Button>
                              )}
                              {submission.status !== "Missing" && (
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Bulk Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox id="selectMissing" />
                    <Label htmlFor="selectMissing" className="text-sm cursor-pointer">
                      Select all missing ({selectedHomework.submissions.missing})
                    </Label>
                  </div>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    <Send className="h-4 w-4 mr-2" />
                    Send Parent Notifications
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HomeworkList({
  homework,
  onSelect,
}: {
  homework: Homework[];
  onSelect: (hw: Homework) => void;
}) {
  if (homework.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">No homework found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or create a new assignment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {homework.map((hw) => {
        const completionRate = hw.totalStudents > 0
          ? Math.round((hw.submissions.submitted / hw.totalStudents) * 100)
          : 0;
        const isDueSoon = new Date(hw.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const isOverdue = new Date(hw.dueDate) < new Date();

        return (
          <Card key={hw.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusBadge(hw.status)}>{hw.status}</Badge>
                    <Badge variant="outline">{hw.subject}</Badge>
                    <Badge variant="outline">{hw.class}</Badge>
                    {isDueSoon && hw.status === "Active" && !isOverdue && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Due Soon
                      </Badge>
                    )}
                    {isOverdue && hw.status === "Active" && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{hw.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Assigned by {hw.teacher} • Due: {hw.dueDate}
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs text-emerald-600">
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                      <span className="text-sm">
                        <span className="font-medium">{hw.submissions.submitted}</span> submitted
                      </span>
                    </div>
                    {hw.submissions.late > 0 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          <span className="font-medium">{hw.submissions.late}</span> late
                        </span>
                      </div>
                    )}
                    {hw.submissions.missing > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <X className="h-4 w-4" />
                        <span className="text-sm">
                          <span className="font-medium">{hw.submissions.missing}</span> missing
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{completionRate}%</p>
                    <p className="text-xs text-muted-foreground">completion</p>
                  </div>
                  <Progress value={completionRate} className="w-24" />
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => onSelect(hw)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Submissions
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Assignment</DropdownMenuItem>
                        <DropdownMenuItem>Extend Due Date</DropdownMenuItem>
                        <DropdownMenuItem>Notify All Parents</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
