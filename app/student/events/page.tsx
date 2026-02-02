import { Calendar, CalendarDays } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function StudentEventsPage() {
  const { school } = await getStudentContext();
  const now = new Date();

  const [upcomingEvents, recentEvents] = await Promise.all([
    prisma.schoolEvent.findMany({
      where: {
        schoolId: school.id,
        startDate: { gte: now },
        status: "Active",
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    prisma.schoolEvent.findMany({
      where: {
        schoolId: school.id,
        startDate: { lt: now },
        status: "Active",
      },
      orderBy: { startDate: "desc" },
      take: 3,
    }),
  ]);

  const eventTypes = Array.from(
    new Set(upcomingEvents.map((event) => event.eventType)),
  );

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Events"
        title={
          <>
            School Calendar
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Track key dates, activities, and meetings.
            </span>
          </>
        }
        description="All your school events in one timeline."
        aside={
          <HeroMetricPanel
            title="Upcoming"
            icon={<Calendar className="h-4 w-4" />}
            metrics={[
              {
                label: "Next 30 Days",
                value: upcomingEvents.length.toString(),
                helper: eventTypes.length ? `${eventTypes.length} event types` : "No upcoming events",
                accent: "highlight",
              },
              {
                label: "Most Recent",
                value: recentEvents[0] ? formatDate(recentEvents[0].startDate) : "--",
                helper: recentEvents[0]?.title,
              },
            ]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>Plan ahead with the latest school calendar updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No upcoming events</p>
              <p className="text-sm">Check back as your school adds events.</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startDate)}{event.location ? ` • ${event.location}` : ""}
                  </p>
                </div>
                <Badge className={cn("bg-[hsl(var(--accent-iris))]/15 text-[hsl(var(--accent-iris))]")}>{event.eventType}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Completed</CardTitle>
          <CardDescription>Events that took place recently.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{event.title}</span>
                <span className="text-muted-foreground">{formatDate(event.startDate)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
