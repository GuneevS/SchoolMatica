import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";

export default async function TimetablesPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access timetables.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No accessible schools found. Select or create a school to continue.</p>
      </div>
    );
  }

  const timetables = await prisma.timetable.findMany({
    where: { schoolId: school.id },
    include: {
      _count: {
        select: { periods: true, slots: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const stats = {
    total: timetables.length,
    active: timetables.filter((t) => t.status === "Active").length,
    draft: timetables.filter((t) => t.status === "Draft").length,
  };

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Schedule Management"
        title={
          <>
            <span className="gradient-text">Timetables</span>
          </>
        }
        description="Manage school timetables and class schedules"
        badges={[
          { label: `${stats.total} Total`, color: "hsl(var(--accent-blue))" },
          { label: `${stats.active} Active`, color: "hsl(var(--accent-mint))" },
        ]}
        aside={
          <HeroMetricPanel
            title="Timetable Overview"
            icon={<Calendar className="h-4 w-4" />}
            metrics={[
              { label: "Total Timetables", value: stats.total.toString(), accent: "highlight" },
              { label: "Active", value: stats.active.toString() },
              { label: "Draft", value: stats.draft.toString() },
            ]}
          />
        }
      />

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/timetables/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Timetable
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {timetables.map((timetable) => (
          <Link key={timetable.id} href={`/timetables/${timetable.id}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{timetable.name}</CardTitle>
                  <Badge variant={timetable.status === "Active" ? "default" : "secondary"}>
                    {timetable.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {timetable.term} {timetable.year}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{timetable.cycleType} Cycle</span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{timetable._count.periods} Periods</span>
                  <span>{timetable._count.slots} Classes</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(timetable.startDate).toLocaleDateString()} -{" "}
                  {new Date(timetable.endDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {timetables.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No timetables yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first timetable to start scheduling classes
              </p>
              <Button asChild>
                <Link href="/timetables/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Timetable
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
