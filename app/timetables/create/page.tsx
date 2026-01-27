import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveSchool } from "@/lib/school";
import { CreateTimetableForm } from "@/components/timetable/create-timetable-form";
import { AuroraHero } from "@/components/layout/aurora-hero";
import { Calendar } from "lucide-react";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

export default async function CreateTimetablePage() {
  const school = await getActiveSchool();
  if (!school) {
    redirect("/");
  }

  const classes = await prisma.classGroup.findMany({
    where: { schoolId: school.id },
    include: { subject: true },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  const teachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Timetables"
        title={
          <>
            <Calendar className="inline-block h-8 w-8 mr-3" />
            <span className="gradient-text">Create Timetable</span>
          </>
        }
        description="Set up a new timetable schedule for your school"
      />
      <CreateTimetableForm 
        schoolId={school.id} 
        classes={classes}
        teachers={teachers}
      />
    </div>
  );
}
