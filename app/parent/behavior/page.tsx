import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Users,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Behaviour | SchoolMatica Parent Portal",
  description: "View your children's merit and demerit records.",
};

export default async function BehaviorPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Get parent user with all children and their behavior data
  const parentUser = await prisma.parentUser.findUnique({
    where: { userId: auth.user.id },
    include: {
      contacts: {
        include: {
          student: {
            include: {
              classGroup: {
                include: {
                  gradeLevel: true,
                },
              },
              behaviorBalance: true,
              behaviorIncidents: {
                where: {
                  status: "Active",
                },
                orderBy: { date: "desc" },
                take: 10,
                include: {
                  issuedBy: {
                    select: {
                      displayName: true,
                      name: true,
                      teacher: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parentUser) {
    redirect("/login");
  }

  // Get school behavior policies for threshold information
  const schoolIds = [...new Set(parentUser.contacts.map(c => c.student.classGroup.schoolId))];
  const behaviorPolicies = await prisma.behaviorPolicy.findMany({
    where: {
      schoolId: { in: schoolIds },
      isActive: true,
    },
  });

  // Process merit thresholds from policies
  const meritThresholds = behaviorPolicies
    .filter(p => p.type === "Merit")
    .flatMap(p => {
      const thresholds = p.thresholds as Array<{ points: number; reward: string }>;
      return thresholds?.map(t => ({
        points: t.points,
        reward: t.reward,
      })) || [];
    })
    .sort((a, b) => a.points - b.points)
    .slice(0, 3);

  // Process demerit thresholds from policies
  const demeritThresholds = behaviorPolicies
    .filter(p => p.type === "Demerit")
    .flatMap(p => {
      const thresholds = p.thresholds as Array<{ points: number; consequence: string }>;
      return thresholds?.map(t => ({
        points: t.points,
        consequence: t.consequence,
      })) || [];
    })
    .sort((a, b) => a.points - b.points)
    .slice(0, 3);

  // Default thresholds if none found in policies
  const defaultMeritThresholds = [
    { points: 25, reward: "Bronze Certificate" },
    { points: 50, reward: "Silver Certificate" },
    { points: 100, reward: "Gold Certificate" },
  ];

  const defaultDemeritThresholds = [
    { points: 10, consequence: "Parent Notification" },
    { points: 20, consequence: "Detention" },
    { points: 30, consequence: "Disciplinary Meeting" },
  ];

  // Process children behavior data for display
  const childrenBehavior = parentUser.contacts.map((contact) => {
    const student = contact.student;

    // Process recent incidents
    const recentIncidents = student.behaviorIncidents.map((incident) => {
      // Get issuer name
      let issuedByName = "Staff";
      if (incident.issuedBy.teacher) {
        issuedByName = `${incident.issuedBy.teacher.firstName} ${incident.issuedBy.teacher.lastName}`;
      } else if (incident.issuedBy.displayName) {
        issuedByName = incident.issuedBy.displayName;
      } else if (incident.issuedBy.name) {
        issuedByName = incident.issuedBy.name;
      }

      return {
        type: incident.type as "Merit" | "Demerit",
        points: incident.points,
        category: incident.category,
        description: incident.description,
        date: incident.date.toISOString().split("T")[0],
        issuedBy: issuedByName,
      };
    });

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.classGroup.gradeLevel?.name || `Grade ${student.classGroup.grade}`,
      meritTotal: student.behaviorBalance?.meritTotal || 0,
      demeritTotal: student.behaviorBalance?.demeritTotal || 0,
      netBalance: student.behaviorBalance?.netBalance || 0,
      recentIncidents,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Behaviour Records</h1>
          <p className="text-muted-foreground mt-1">
            Track your children&apos;s merit and demerit points.
          </p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childrenBehavior.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {childrenBehavior.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
            <p className="text-muted-foreground">
              Your account is not linked to any students yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {childrenBehavior.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>{child.grade}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-emerald-500" />
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {child.meritTotal}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Merits</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {child.demeritTotal}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Demerits</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-muted/50">
                      <span className="text-2xl font-bold">
                        {child.netBalance >= 0 ? "+" : ""}{child.netBalance}
                      </span>
                      <p className="text-xs text-muted-foreground">Net Balance</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Activity
                </h4>
                {child.recentIncidents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No behavior incidents recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {child.recentIncidents.map((incident, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          incident.type === "Merit"
                            ? "bg-emerald-500/10"
                            : "bg-amber-500/10"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            incident.type === "Merit"
                              ? "bg-emerald-500/20"
                              : "bg-amber-500/20"
                          }`}
                        >
                          {incident.type === "Merit" ? (
                            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{incident.description}</p>
                            <Badge
                              className={
                                incident.type === "Merit"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }
                            >
                              {incident.type === "Merit" ? "+" : "-"}{incident.points}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {incident.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {incident.issuedBy}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {new Date(incident.date).toLocaleDateString("en-ZA", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Threshold Information */}
          <Card>
            <CardHeader>
              <CardTitle>Understanding Behaviour Points</CardTitle>
              <CardDescription>
                How the merit and demerit system works at your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-5 w-5" />
                    Merit Rewards
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(meritThresholds.length > 0 ? meritThresholds : defaultMeritThresholds).map((threshold, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/30">
                        <span>{threshold.points}+ points</span>
                        <span className="text-muted-foreground">{threshold.reward}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Demerit Consequences
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(demeritThresholds.length > 0 ? demeritThresholds : defaultDemeritThresholds).map((threshold, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-muted/30">
                        <span>{threshold.points} points</span>
                        <span className="text-muted-foreground">{threshold.consequence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
