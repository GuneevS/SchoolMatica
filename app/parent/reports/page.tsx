import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Report Cards | SchoolMatica Parent Portal",
  description: "View and download your children's report cards.",
};

// Mock data
const mockReports = [
  {
    id: "1",
    child: "Thabo Mokoena",
    grade: "Grade 10",
    term: "Term 1",
    year: 2024,
    status: "Published",
    overallAverage: 72,
    achievementLevel: 5,
    publishedDate: "2024-03-22",
    isNew: true,
  },
  {
    id: "2",
    child: "Naledi Mokoena",
    grade: "Grade 7",
    term: "Term 1",
    year: 2024,
    status: "Published",
    overallAverage: 85,
    achievementLevel: 6,
    publishedDate: "2024-03-22",
    isNew: true,
  },
  {
    id: "3",
    child: "Thabo Mokoena",
    grade: "Grade 10",
    term: "Term 4",
    year: 2023,
    status: "Finalized",
    overallAverage: 68,
    achievementLevel: 5,
    publishedDate: "2023-12-08",
    isNew: false,
  },
  {
    id: "4",
    child: "Naledi Mokoena",
    grade: "Grade 7",
    term: "Term 4",
    year: 2023,
    status: "Finalized",
    overallAverage: 82,
    achievementLevel: 6,
    publishedDate: "2023-12-08",
    isNew: false,
  },
];

export default function ReportsPage() {
  const newReports = mockReports.filter((r) => r.isNew);
  const pastReports = mockReports.filter((r) => !r.isNew);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground mt-1">
          View and download your children&apos;s academic report cards.
        </p>
      </div>

      {/* New Reports */}
      {newReports.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge className="bg-[hsl(var(--accent-iris))]">New</Badge>
            Latest Reports
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {newReports.map((report) => (
              <Card key={report.id} className="overflow-hidden border-[hsl(var(--accent-iris))]/30">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-2 bg-gradient-to-b from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))]" />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{report.child}</h3>
                          <p className="text-sm text-muted-foreground">
                            {report.grade} • {report.term} {report.year}
                          </p>
                        </div>
                        <Badge className="bg-emerald-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {report.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-[hsl(var(--accent-iris))]">
                            {report.overallAverage}%
                          </p>
                          <p className="text-xs text-muted-foreground">Overall Average</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">
                            Level {report.achievementLevel}
                          </p>
                          <p className="text-xs text-muted-foreground">Achievement</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button className="flex-1" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button className="flex-1 bg-[hsl(var(--accent-iris))] hover:bg-[hsl(var(--accent-iris))]/90">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Past Reports
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {pastReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{report.child}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.grade} • {report.term} {report.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold">{report.overallAverage}%</p>
                      <p className="text-xs text-muted-foreground">
                        Level {report.achievementLevel}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
