import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Calendar,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "My Children | SchoolMatica Parent Portal",
  description: "View your children's academic profiles and progress.",
};

// Mock data
const mockChildren = [
  {
    id: "1",
    firstName: "Thabo",
    lastName: "Mokoena",
    grade: "Grade 10",
    class: "10A",
    school: "Pretoria High School",
    overallAverage: 72,
    merits: 15,
    demerits: 2,
    subjects: [
      { name: "Mathematics", average: 68, trend: "up" },
      { name: "Physical Sciences", average: 75, trend: "up" },
      { name: "English Home Language", average: 72, trend: "stable" },
      { name: "Afrikaans FAL", average: 65, trend: "down" },
      { name: "Life Orientation", average: 82, trend: "stable" },
    ],
    attendance: 95,
  },
  {
    id: "2",
    firstName: "Naledi",
    lastName: "Mokoena",
    grade: "Grade 7",
    class: "7B",
    school: "Pretoria Primary School",
    overallAverage: 85,
    merits: 22,
    demerits: 0,
    subjects: [
      { name: "Mathematics", average: 88, trend: "up" },
      { name: "Natural Sciences", average: 90, trend: "up" },
      { name: "English Home Language", average: 85, trend: "stable" },
      { name: "Afrikaans FAL", average: 78, trend: "up" },
      { name: "Life Skills", average: 92, trend: "stable" },
    ],
    attendance: 98,
  },
];

export default function ChildrenPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground mt-1">
          View your children&apos;s academic profiles and track their progress.
        </p>
      </div>

      <div className="space-y-6">
        {mockChildren.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-iris))]/10 to-[hsl(var(--accent-violet))]/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-bold text-xl">
                    {child.firstName[0]}{child.lastName[0]}
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {child.firstName} {child.lastName}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {child.grade} • Class {child.class}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {child.school}
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/parent/children/${child.id}`}>
                    Full Profile
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[hsl(var(--accent-iris))]/10 text-center">
                  <GraduationCap className="h-5 w-5 mx-auto mb-2 text-[hsl(var(--accent-iris))]" />
                  <p className="text-2xl font-bold">{child.overallAverage}%</p>
                  <p className="text-xs text-muted-foreground">Overall Average</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
                  <Award className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{child.merits}</p>
                  <p className="text-xs text-muted-foreground">Merit Points</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{child.demerits}</p>
                  <p className="text-xs text-muted-foreground">Demerit Points</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{child.attendance}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subject Performance
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {child.subjects.map((subject) => (
                    <div
                      key={subject.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.average}% average
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            subject.average >= 80
                              ? "text-emerald-500"
                              : subject.average >= 60
                              ? "text-blue-500"
                              : subject.average >= 50
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        >
                          {subject.average >= 80 ? "7" : subject.average >= 70 ? "6" : subject.average >= 60 ? "5" : subject.average >= 50 ? "4" : "3"}
                        </span>
                        {subject.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        )}
                        {subject.trend === "down" && (
                          <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
