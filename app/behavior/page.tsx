import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAuthContext, requireAuth, getAuthorizedActiveSchool } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { BehaviorDashboard } from "@/components/behavior/behavior-dashboard";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Behaviour Management | SchoolMatica",
  description: "Track and manage student behaviour, merits, and demerits.",
};

async function getBehaviorStats(schoolId: string) {
  // Filter to current academic year (SA school year starts in January)
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);

  const [totalMerits, totalDemerits, recentIncidents, studentsAtRisk] = await Promise.all([
    // Total merits this academic year
    prisma.behaviorIncident.count({
      where: {
        schoolId,
        type: "Merit",
        status: "Active",
        createdAt: { gte: currentYearStart },
      },
    }),
    // Total demerits this academic year
    prisma.behaviorIncident.count({
      where: {
        schoolId,
        type: "Demerit",
        status: "Active",
        createdAt: { gte: currentYearStart },
      },
    }),
    // Recent incidents (last 7 days)
    prisma.behaviorIncident.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classGroup: {
              select: {
                name: true,
              },
            },
          },
        },
        issuedBy: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Students with high demerit count (TODO: make threshold configurable per school)
    prisma.behaviorBalance.findMany({
      where: {
        student: {
          classGroup: {
            schoolId,
          },
        },
        demeritTotal: {
          gte: 10,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classGroup: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { demeritTotal: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalMerits,
    totalDemerits,
    recentIncidents,
    studentsAtRisk,
  };
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function BehaviorPage() {
  await requireAuth();
  const school = await getAuthorizedActiveSchool();

  if (!school) {
    redirect("/dashboard");
  }

  const stats = await getBehaviorStats(school.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Behaviour Management</h1>
        <p className="text-muted-foreground mt-1">
          Track student merits and demerits, manage policies, and monitor behaviour across your school.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <BehaviorDashboard
          stats={stats}
          schoolId={school.id}
        />
      </Suspense>
    </div>
  );
}
