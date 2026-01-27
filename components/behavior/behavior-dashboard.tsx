"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  ChevronRight,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncidentDialog } from "./incident-dialog";

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  classGroup: {
    name: string;
  };
}

interface IncidentInfo {
  id: string;
  type: string;
  points: number;
  category: string;
  description: string;
  date: Date;
  student: StudentInfo;
  issuedBy: {
    displayName: string;
  };
}

interface BalanceInfo {
  id: string;
  meritTotal: number;
  demeritTotal: number;
  student: StudentInfo;
}

interface BehaviorDashboardProps {
  stats: {
    totalMerits: number;
    totalDemerits: number;
    recentIncidents: IncidentInfo[];
    studentsAtRisk: BalanceInfo[];
  };
  schoolId: string;
}

export function BehaviorDashboard({ stats, schoolId }: BehaviorDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Issue Merit
        </Button>
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Issue Demerit
        </Button>
        <Button variant="outline" asChild>
          <Link href="/behavior/policies">
            <Settings className="h-4 w-4 mr-2" />
            Manage Policies
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/behavior/incidents">
            <FileText className="h-4 w-4 mr-2" />
            View All Incidents
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              Total Merits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.totalMerits}
              </p>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Total Demerits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {stats.totalDemerits}
              </p>
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-red-500" />
              At Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.studentsAtRisk.length}
              </p>
              <Badge variant="destructive" className="text-xs">
                Needs Attention
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">
                {stats.recentIncidents.length}
              </p>
              <span className="text-xs text-muted-foreground">incidents</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Latest behaviour records</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/behavior/incidents">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No incidents recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentIncidents.slice(0, 5).map((incident) => (
                  <div
                    key={incident.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      incident.type === "Merit"
                        ? "bg-emerald-500/10"
                        : "bg-amber-500/10"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        incident.type === "Merit"
                          ? "bg-emerald-500/20"
                          : "bg-amber-500/20"
                      )}
                    >
                      {incident.type === "Merit" ? (
                        <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {incident.student.firstName} {incident.student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {incident.category} • {incident.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={incident.type === "Merit" ? "default" : "secondary"}
                        className={cn(
                          incident.type === "Merit"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                      >
                        {incident.type === "Merit" ? "+" : "-"}{incident.points}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(incident.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students at Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students at Risk</CardTitle>
                <CardDescription>High demerit counts requiring attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.studentsAtRisk.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No students currently at risk
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.studentsAtRisk.map((balance) => (
                  <Link
                    key={balance.id}
                    href={`/students/${balance.student.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {balance.student.firstName} {balance.student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {balance.student.classGroup.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {balance.demeritTotal}
                      </p>
                      <p className="text-xs text-muted-foreground">demerits</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Dialog */}
      <IncidentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        schoolId={schoolId}
      />
    </div>
  );
}
