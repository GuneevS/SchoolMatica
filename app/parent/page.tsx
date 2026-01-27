import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  FileText,
  Award,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Bell,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Parent Dashboard | SchoolMatica",
  description: "View your children's academic progress and school updates.",
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Mock data - in production this would come from the database
const mockChildren = [
  {
    id: "1",
    firstName: "Thabo",
    lastName: "Mokoena",
    grade: "Grade 10",
    class: "10A",
    overallAverage: 72,
    merits: 15,
    demerits: 2,
    pendingReports: 1,
  },
  {
    id: "2",
    firstName: "Naledi",
    lastName: "Mokoena",
    grade: "Grade 7",
    class: "7B",
    overallAverage: 85,
    merits: 22,
    demerits: 0,
    pendingReports: 0,
  },
];

const mockNotifications = [
  {
    id: "1",
    type: "grade",
    title: "New marks available",
    body: "Thabo's Mathematics Term 1 marks have been published",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "2",
    type: "message",
    title: "Message from Mrs. van der Berg",
    body: "Regarding the upcoming parent-teacher meeting...",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "3",
    type: "behavior",
    title: "Merit awarded",
    body: "Naledi received 5 merit points for community service",
    time: "2 days ago",
    unread: false,
  },
];

const mockUpcoming = [
  { title: "Parent-Teacher Meeting", date: "15 Feb 2024", type: "meeting" },
  { title: "Term 1 Report Cards", date: "22 Mar 2024", type: "report" },
  { title: "School Sports Day", date: "28 Mar 2024", type: "event" },
];

export default async function ParentDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning!</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your children today.
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact School
          </Link>
        </Button>
      </div>

      <Suspense fallback={<LoadingState />}>
        {/* Children Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          {mockChildren.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-2 bg-gradient-to-b from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))]" />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {child.grade} • Class {child.class}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/parent/children/${child.id}`}>
                          View Profile
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-[hsl(var(--accent-iris))]">
                          {child.overallAverage}%
                        </p>
                        <p className="text-xs text-muted-foreground">Average</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {child.merits}
                        </p>
                        <p className="text-xs text-muted-foreground">Merits</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-amber-500/10">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {child.demerits}
                        </p>
                        <p className="text-xs text-muted-foreground">Demerits</p>
                      </div>
                    </div>

                    {child.pendingReports > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">
                            {child.pendingReports} new report{child.pendingReports > 1 ? "s" : ""} available
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-blue-500" asChild>
                          <Link href="/parent/reports">View</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Notifications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Updates
                  </CardTitle>
                  <CardDescription>Latest notifications from school</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      notification.unread ? "bg-[hsl(var(--accent-iris))]/5" : "bg-muted/30"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        notification.type === "grade"
                          ? "bg-blue-500/20"
                          : notification.type === "message"
                          ? "bg-violet-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    >
                      {notification.type === "grade" ? (
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      ) : notification.type === "message" ? (
                        <MessageSquare className="h-5 w-5 text-violet-500" />
                      ) : (
                        <Award className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {notification.unread && (
                          <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming
              </CardTitle>
              <CardDescription>Important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUpcoming.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[hsl(var(--accent-iris))]/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-[hsl(var(--accent-iris))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/parent/children">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--accent-iris))]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[hsl(var(--accent-iris))]" />
                </div>
                <div>
                  <p className="font-medium">My Children</p>
                  <p className="text-sm text-muted-foreground">View profiles</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/reports">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Report Cards</p>
                  <p className="text-sm text-muted-foreground">View reports</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/behavior">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">Behaviour</p>
                  <p className="text-sm text-muted-foreground">Merits & demerits</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/parent/messages">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">Contact teachers</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </Suspense>
    </div>
  );
}
