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
  Bell,
  Send,
  Mail,
  CheckCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncidentDialog } from "./incident-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [notifyDialogOpen, setNotifyDialogOpen] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [notificationMessage, setNotificationMessage] = React.useState("");
  const [notificationType, setNotificationType] = React.useState("demerit_alert");

  const handleNotifyParents = () => {
    // In production, this would call an API to send notifications
    console.log("Notifying parents for students:", selectedStudents);
    setNotifyDialogOpen(false);
    setSelectedStudents([]);
    setNotificationMessage("");
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllAtRisk = () => {
    setSelectedStudents(stats.studentsAtRisk.map((s) => s.student.id));
  };

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
        <Button
          variant="outline"
          className="border-[hsl(var(--accent-violet))/0.5] text-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.12]"
          onClick={() => setNotifyDialogOpen(true)}
        >
          <Bell className="h-4 w-4 mr-2" />
          Notify Parents
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

      {/* Auto-notification Alert */}
      {stats.studentsAtRisk.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {stats.studentsAtRisk.length} student{stats.studentsAtRisk.length > 1 ? "s" : ""} reached demerit threshold
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Parents should be notified about their child&apos;s behaviour record
                  </p>
                </div>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => {
                  selectAllAtRisk();
                  setNotifyDialogOpen(true);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              {stats.studentsAtRisk.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectAllAtRisk();
                    setNotifyDialogOpen(true);
                  }}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Notify All
                </Button>
              )}
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
                {stats.studentsAtRisk.map((balance, index) => {
                  // Mock notification status - in production this would come from DB
                  const notified = index % 2 === 0;
                  
                  return (
                    <div
                      key={balance.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <Link href={`/students/${balance.student.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {balance.student.firstName} {balance.student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {balance.student.classGroup.name}
                        </p>
                      </Link>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {balance.demeritTotal}
                        </p>
                        <p className="text-xs text-muted-foreground">demerits</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notified ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Notified
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.12]"
                            onClick={() => {
                              setSelectedStudents([balance.student.id]);
                              setNotifyDialogOpen(true);
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                Recent Notifications
              </CardTitle>
              <CardDescription>
                Parent communications about behaviour incidents
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/behavior/notifications">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock notification history */}
            {[
              {
                id: "1",
                student: "Thabo Mokoena",
                type: "Demerit Alert",
                sentTo: "Mr. Mokoena",
                method: "Email & In-App",
                date: "2 hours ago",
              },
              {
                id: "2",
                student: "Sipho Nkosi",
                type: "Threshold Warning",
                sentTo: "Mrs. Nkosi",
                method: "SMS",
                date: "Yesterday",
              },
              {
                id: "3",
                student: "Nomvula Dlamini",
                type: "Merit Celebration",
                sentTo: "Mr. Dlamini",
                method: "In-App",
                date: "2 days ago",
              },
            ].map((notification) => (
              <div
                key={notification.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--accent-violet))/0.1] flex items-center justify-center">
                  <Bell className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.student}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.type} sent to {notification.sentTo} via {notification.method}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{notification.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incident Dialog */}
      <IncidentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        schoolId={schoolId}
      />

      {/* Parent Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notify Parents</DialogTitle>
            <DialogDescription>
              Send behaviour notifications to selected parents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demerit_alert">Demerit Alert</SelectItem>
                  <SelectItem value="threshold_warning">Threshold Warning</SelectItem>
                  <SelectItem value="merit_celebration">Merit Celebration</SelectItem>
                  <SelectItem value="behaviour_summary">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Students</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllAtRisk}
                  className="text-xs"
                >
                  Select all at-risk
                </Button>
              </div>
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {stats.studentsAtRisk.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students at risk
                  </p>
                ) : (
                  <div className="p-2 space-y-2">
                    {stats.studentsAtRisk.map((balance) => (
                      <div
                        key={balance.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedStudents.includes(balance.student.id)
                            ? "bg-[hsl(var(--accent-violet))/0.1]"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        onClick={() => toggleStudentSelection(balance.student.id)}
                      >
                        <Checkbox
                          checked={selectedStudents.includes(balance.student.id)}
                          onCheckedChange={() => toggleStudentSelection(balance.student.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {balance.student.firstName} {balance.student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {balance.student.classGroup.name} • {balance.demeritTotal} demerits
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personalized message to the notification..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Delivery Options */}
            <div className="space-y-2">
              <Label>Delivery Methods</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="notify-app" defaultChecked />
                  <Label htmlFor="notify-app" className="text-sm cursor-pointer">
                    In-App
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="notify-email" defaultChecked />
                  <Label htmlFor="notify-email" className="text-sm cursor-pointer">
                    Email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="notify-sms" />
                  <Label htmlFor="notify-sms" className="text-sm cursor-pointer">
                    SMS
                  </Label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Message Preview</p>
              <p className="text-sm">
                Dear Parent, your child has accumulated {"{demerits}"} demerits this term.{" "}
                {notificationMessage && `Teacher's note: ${notificationMessage}`}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
              onClick={handleNotifyParents}
              disabled={selectedStudents.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedStudents.length} Parent{selectedStudents.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
