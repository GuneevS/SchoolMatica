import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";
import { CreateTimetableForm } from "@/components/timetable/create-timetable-form";
import { AuroraHero } from "@/components/layout/aurora-hero";
import { Calendar } from "lucide-react";

export default async function CreateTimetablePage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    redirect("/");
  }

  if (!auth.permissions.has("timetable:create")) {
    redirect("/timetables");
  }

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
