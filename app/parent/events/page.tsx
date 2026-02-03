import { Calendar, CalendarDays } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function ParentEventsPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login?callbackUrl=/parent/events");

  // Get parent's children to find the school
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  school: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    redirect("/dashboard?error=parent_access_required");
  }

  // Get the school from the first child
  const schools = parentUser.contacts
    .map((c: { student: { classGroup?: { school?: { id: string; name: string } | null } | null } }) => c.student.classGroup?.school)
    .filter((school): school is { id: string; name: string } => Boolean(school));
  
  const primarySchool = schools[0];
  if (!primarySchool) {
    redirect("/parent?error=no_school");
  }

  const now = new Date();

  const [upcomingEvents, recentEvents] = await Promise.all([
    prisma.schoolEvent.findMany({
      where: {
        schoolId: primarySchool.id,
        startDate: { gte: now },
        status: "Active",
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    prisma.schoolEvent.findMany({
      where: {
        schoolId: primarySchool.id,
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
              Stay informed about upcoming school activities.
            </span>
          </>
        }
        description="View all school events and important dates."
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
          <CardDescription>Stay on top of school activities and important dates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No upcoming events</p>
              <p className="text-sm">Check back as the school adds events.</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-3"
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
