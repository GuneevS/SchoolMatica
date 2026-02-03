"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Homework {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  className: string;
  gradeLevel: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  status: "pending" | "submitted" | "late" | "missing" | "excused";
  isOverdue: boolean;
  points: number | null;
  childId: string;
  childName: string;
  submittedAt: string | null;
  homeworkGrade: string | null;
  feedback: string | null;
}

interface Child {
  id: string;
  name: string;
  grade: string;
  className: string;
}

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  missing: number;
  overdue: number;
}

interface Props {
  homework: Homework[];
  children: Child[];
  subjects: string[];
  stats: Stats;
}

const getStatusBadge = (status: Homework["status"], isOverdue: boolean) => {
  if (status === "submitted") {
    return {
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      label: "Submitted",
      icon: CheckCircle,
    };
  }
  if (status === "late") {
    return {
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      label: "Submitted Late",
      icon: Clock,
    };
  }
  if (status === "missing") {
    return {
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: "Missing",
      icon: XCircle,
    };
  }
  if (status === "excused") {
    return {
      className: "bg-[hsl(var(--accent-violet))/0.12] text-[hsl(var(--accent-violet))] dark:bg-[hsl(var(--accent-violet))/0.28] dark:text-[hsl(var(--accent-violet))]",
      label: "Excused",
      icon: CheckCircle,
    };
  }
  if (isOverdue) {
    return {
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: "Overdue",
      icon: AlertTriangle,
    };
  }
  return {
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Pending",
    icon: Clock,
  };
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDaysUntilDue = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export function ParentHomeworkClient({ homework, children, subjects, stats }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  // Filter homework based on all filters
  const filteredHomework = homework.filter((hw) => {
    const matchesSearch =
      hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChild = childFilter === "all" || hw.childId === childFilter;
    const matchesSubject = subjectFilter === "all" || hw.subject === subjectFilter;
    
    let matchesStatus = true;
    if (statusFilter === "all") matchesStatus = true;
    else if (statusFilter === "pending") matchesStatus = hw.status === "pending" && !hw.isOverdue;
    else if (statusFilter === "submitted") matchesStatus = hw.status === "submitted" || hw.status === "late";
    else if (statusFilter === "missing") matchesStatus = hw.status === "missing";
    else if (statusFilter === "overdue") matchesStatus = hw.isOverdue && hw.status !== "submitted" && hw.status !== "late" && hw.status !== "excused";

    let matchesTab = true;
    if (activeTab === "upcoming") {
      matchesTab = !hw.isOverdue && hw.status === "pending";
    } else if (activeTab === "overdue") {
      matchesTab = hw.isOverdue && hw.status !== "submitted" && hw.status !== "late" && hw.status !== "excused";
    } else if (activeTab === "completed") {
      matchesTab = hw.status === "submitted" || hw.status === "late" || hw.status === "excused";
    }

    return matchesSearch && matchesChild && matchesSubject && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/parent">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
            <p className="text-muted-foreground mt-1">
              Track your children&apos;s assignments and submissions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.overdue > 0 ? "border-red-500/50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {stats.pending > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white text-xs">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue
              {stats.overdue > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">
                  {stats.overdue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
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

              {children.length > 1 && (
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All children" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All children</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Homework List */}
        <TabsContent value="all" className="m-0">
          <HomeworkList homework={filteredHomework} onSelect={setSelectedHomework} />
        </TabsContent>
        <TabsContent value="upcoming" className="m-0">
          <HomeworkList homework={filteredHomework} onSelect={setSelectedHomework} />
        </TabsContent>
        <TabsContent value="overdue" className="m-0">
          <HomeworkList homework={filteredHomework} onSelect={setSelectedHomework} />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <HomeworkList homework={filteredHomework} onSelect={setSelectedHomework} />
        </TabsContent>
      </Tabs>

      {/* Homework Details Dialog */}
      <Dialog open={!!selectedHomework} onOpenChange={() => setSelectedHomework(null)}>
        <DialogContent className="max-w-2xl">
          {selectedHomework && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedHomework.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{selectedHomework.subject}</Badge>
                  <Badge variant="outline">{selectedHomework.className}</Badge>
                  {(() => {
                    const { className, label, icon: Icon } = getStatusBadge(
                      selectedHomework.status,
                      selectedHomework.isOverdue
                    );
                    return (
                      <Badge className={className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    );
                  })()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Assignment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="font-medium">{selectedHomework.childName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teacher</p>
                      <p className="font-medium">{selectedHomework.teacherName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned</p>
                      <p className="font-medium">{formatDate(selectedHomework.assignedDate)}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      selectedHomework.isOverdue &&
                        selectedHomework.status !== "submitted" &&
                        selectedHomework.status !== "late"
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-muted/50"
                    )}
                  >
                    <Clock
                      className={cn(
                        "h-5 w-5",
                        selectedHomework.isOverdue &&
                          selectedHomework.status !== "submitted" &&
                          selectedHomework.status !== "late"
                          ? "text-red-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p
                        className={cn(
                          "font-medium",
                          selectedHomework.isOverdue &&
                            selectedHomework.status !== "submitted" &&
                            selectedHomework.status !== "late"
                            ? "text-red-600"
                            : ""
                        )}
                      >
                        {formatDate(selectedHomework.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedHomework.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Instructions</h4>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm whitespace-pre-wrap">{selectedHomework.description}</p>
                    </div>
                  </div>
                )}

                {/* Submission Status */}
                {(selectedHomework.status === "submitted" || selectedHomework.status === "late") && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <h4 className="font-medium text-emerald-700 dark:text-emerald-400">
                        Submission Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedHomework.submittedAt && (
                        <div>
                          <p className="text-muted-foreground">Submitted At</p>
                          <p className="font-medium">{formatDateTime(selectedHomework.submittedAt)}</p>
                        </div>
                      )}
                      {selectedHomework.homeworkGrade && (
                        <div>
                          <p className="text-muted-foreground">Grade</p>
                          <p className="font-medium">{selectedHomework.homeworkGrade}</p>
                        </div>
                      )}
                    </div>
                    {selectedHomework.feedback && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Teacher Feedback</p>
                        <p className="text-sm bg-white/50 dark:bg-black/20 rounded p-2">
                          {selectedHomework.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Missing/Overdue Warning */}
                {(selectedHomework.status === "missing" ||
                  (selectedHomework.isOverdue &&
                    selectedHomework.status !== "submitted" &&
                    selectedHomework.status !== "late" &&
                    selectedHomework.status !== "excused")) && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <p className="font-medium text-red-700 dark:text-red-400">
                        This assignment has not been submitted and is overdue
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please ensure your child submits this assignment as soon as possible.
                      Contact the teacher if there are any issues.
                    </p>
                  </div>
                )}
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
            Try adjusting your filters to see more results
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Child</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {homework.map((hw) => {
            const { className, label, icon: Icon } = getStatusBadge(hw.status, hw.isOverdue);
            const daysUntilDue = getDaysUntilDue(hw.dueDate);

            return (
              <TableRow key={hw.id}>
                <TableCell>
                  <div className="font-medium">{hw.title}</div>
                  <div className="text-xs text-muted-foreground">{hw.className}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{hw.childName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{hw.subject}</Badge>
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "text-sm",
                      hw.isOverdue &&
                        hw.status !== "submitted" &&
                        hw.status !== "late" &&
                        hw.status !== "excused"
                        ? "text-red-600 font-medium"
                        : ""
                    )}
                  >
                    {formatDate(hw.dueDate)}
                  </div>
                  {!hw.isOverdue && hw.status === "pending" && (
                    <div
                      className={cn(
                        "text-xs",
                        daysUntilDue <= 2 ? "text-amber-600" : "text-muted-foreground"
                      )}
                    >
                      {daysUntilDue === 0
                        ? "Due today"
                        : daysUntilDue === 1
                        ? "Due tomorrow"
                        : `${daysUntilDue} days left`}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={className}>
                    <Icon className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(hw)}>
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
