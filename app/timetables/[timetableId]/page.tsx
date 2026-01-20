import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getServerAuthContext, hasServerSchoolAccess } from "@/lib/auth-server";

interface Props {
  params: Promise<{ timetableId: string }>;
}

export default async function TimetablePage({ params }: Props) {
  const resolvedParams = await params;

  const auth = await getServerAuthContext();
  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to view timetables.</p>
      </div>
    );
  }
  
  const timetable = await prisma.timetable.findUnique({
    where: { id: resolvedParams.timetableId },
    include: {
      school: true,
      periods: {
        orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
        include: {
          slots: {
            include: {
              classGroup: { include: { subject: true } },
              teacher: true,
              period: true,
              assessmentPlan: true,
            },
          },
        },
      },
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
          assessmentPlan: true,
        },
      },
    },
  });

  if (!timetable) {
    notFound();
  }

  if (!(await hasServerSchoolAccess(timetable.schoolId))) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Access denied to this school.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/timetables">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Timetables
          </Link>
        </Button>
      </div>

      <TimetableGrid timetable={timetable} />
    </div>
  );
}
