import Link from "next/link";
import { Activity, Award, ChevronRight } from "lucide-react";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudentContext } from "@/lib/student-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });

export default async function StudentBehaviorPage() {
  const { student } = await getStudentContext();

  const incidents = await prisma.behaviorIncident.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  const balance = student.behaviorBalance;
  const meritTotal = balance?.meritTotal ?? 0;
  const demeritTotal = balance?.demeritTotal ?? 0;
  const netBalance = balance?.netBalance ?? meritTotal - demeritTotal;

  const recentMerits = incidents.filter((i) => i.type === "Merit").length;
  const recentDemerits = incidents.filter((i) => i.type === "Demerit").length;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Behaviour"
        title={
          <>
            Wellbeing & Conduct
            <span className="block text-muted-foreground text-xl md:text-2xl font-semibold mt-3">
              Monitor your merit balance and behaviour feedback.
            </span>
          </>
        }
        description="Merits and demerits are recorded by your school to celebrate progress and guide support."
        actions={
          <Button variant="outline" asChild>
            <Link href="/student/messages">
              Contact your advisor
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        }
        aside={
          <HeroMetricPanel
            title="Behaviour Summary"
            icon={<Award className="h-4 w-4" />}
            metrics={[
              {
                label: "Net Balance",
                value: `${netBalance >= 0 ? "+" : ""}${netBalance}`,
                helper: `${meritTotal} merits / ${demeritTotal} demerits`,
                accent: "highlight",
              },
              {
                label: "Recent Merits",
                value: recentMerits.toString(),
              },
              {
                label: "Recent Demerits",
                value: recentDemerits.toString(),
              },
            ]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Behaviour Log
          </CardTitle>
          <CardDescription>Recent merits and demerits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              <Award className="h-8 w-8 mb-2 opacity-60" />
              <p className="font-medium">No incidents recorded</p>
              <p className="text-sm">Keep it up and maintain positive momentum.</p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{incident.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(incident.date)} • {incident.description}
                  </p>
                </div>
                <Badge
                  className={cn(
                    incident.type === "Merit"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-red-500/15 text-red-600",
                  )}
                >
                  {incident.type} {incident.type === "Merit" ? `+${Math.abs(incident.points)}` : `-${Math.abs(incident.points)}`}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
