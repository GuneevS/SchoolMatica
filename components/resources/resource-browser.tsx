"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  Download,
  Search,
  Filter,
  FolderOpen,
  FileSpreadsheet,
  FileImage,
  File,
  Calendar,
  User,
  BookOpen,
  Grid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  label: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  subject: string;
  subjectCode: string;
  grade: number;
  gradeName: string;
  year: number;
  term: string;
  assessmentName: string;
  category: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface GradeLevel {
  id: string;
  name: string;
  order: number;
}

interface ResourceBrowserProps {
  resources: Resource[];
  subjects: Subject[];
  gradeLevels: GradeLevel[];
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("image")) return FileImage;
  return File;
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Rubric":
      return "bg-[hsl(var(--accent-violet))/0.12] text-[hsl(var(--accent-violet))]";
    case "Memo":
      return "bg-emerald-100 text-emerald-700";
    case "Question Paper":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function ResourceBrowser({ resources, subjects, gradeLevels }: ResourceBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique years from resources
  const years = useMemo(() => {
    const uniqueYears = [...new Set(resources.map((r) => r.year))];
    return uniqueYears.sort((a, b) => b - a);
  }, [resources]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(resources.map((r) => r.category))];
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        !searchQuery ||
        resource.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.assessmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject;
      const matchesGrade = selectedGrade === "all" || resource.grade.toString() === selectedGrade;
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
      const matchesYear = selectedYear === "all" || resource.year.toString() === selectedYear;

      return matchesSearch && matchesSubject && matchesGrade && matchesCategory && matchesYear;
    });
  }, [resources, searchQuery, selectedSubject, selectedGrade, selectedCategory, selectedYear]);

  // Group resources by subject for grid view
  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    filteredResources.forEach((resource) => {
      if (!groups[resource.subject]) {
        groups[resource.subject] = [];
      }
      groups[resource.subject].push(resource);
    });
    return groups;
  }, [filteredResources]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSelectedGrade("all");
    setSelectedCategory("all");
    setSelectedYear("all");
  };

  const hasActiveFilters = searchQuery || selectedSubject !== "all" || selectedGrade !== "all" || selectedCategory !== "all" || selectedYear !== "all";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.id} value={grade.order.toString()}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredResources.length} of {resources.length} resources
        </p>
        {selectedYear && (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {selectedYear}
          </Badge>
        )}
      </div>

      {/* Resources display */}
      {filteredResources.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "No approved resources have been uploaded yet."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="space-y-8">
          {Object.entries(groupedResources).map(([subject, subjectResources]) => (
            <div key={subject}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                <h2 className="text-lg font-semibold">{subject}</h2>
                <Badge variant="outline">{subjectResources.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {subjectResources.map((resource) => {
                  const FileIcon = getFileIcon(resource.mimeType);
                  return (
                    <Card
                      key={resource.id}
                      className="group hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--accent-violet))/0.12] flex items-center justify-center flex-shrink-0">
                            <FileIcon className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={resource.label}>
                              {resource.label}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {resource.assessmentName}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          <Badge className={getCategoryColor(resource.category)}>
                            {resource.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resource.gradeName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resource.term}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(resource.uploadedAt)}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            asChild
                          >
                            <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => {
                const FileIcon = getFileIcon(resource.mimeType);
                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--accent-violet))/0.12] flex items-center justify-center">
                          <FileIcon className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
                        </div>
                        <div>
                          <p className="font-medium">{resource.label}</p>
                          <p className="text-sm text-muted-foreground">{resource.assessmentName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{resource.subject}</TableCell>
                    <TableCell>{resource.gradeName}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(resource.category)}>
                        {resource.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(resource.uploadedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
