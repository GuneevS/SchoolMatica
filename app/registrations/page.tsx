import { RegistrationManager } from "@/components/registrations/registration-manager";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpPanel } from "@/components/help/help-panel";
import { registrationsHelp } from "@/lib/help-content";

export default async function RegistrationsPage() {
  const [registrations, classes, school] = await Promise.all([
    prisma.learnerRegistration.findMany({
      include: {
        classGroup: { include: { subject: true } },
        student: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classGroup.findMany({
      include: { subject: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.school.findFirst({ select: { id: true } }),
  ]);

  const schoolId = school?.id ?? classes[0]?.schoolId ?? registrations[0]?.schoolId ?? "";
  const classOptions = classes.map((classGroup) => ({
    id: classGroup.id,
    name: `${classGroup.name} · ${classGroup.subject.name}`,
  }));
  const serializedRegistrations = registrations.map((registration) => ({
    id: registration.id,
    status: registration.status,
    learnerData: registration.learnerData as Record<string, unknown>,
    guardianData: registration.guardianData as Record<string, unknown>,
    supportingDocs: (registration.supportingDocs as Record<string, unknown>) ?? null,
    classGroup: registration.classGroup
      ? {
          id: registration.classGroup.id,
          name: `${registration.classGroup.name} · ${registration.classGroup.subject.name}`,
        }
      : null,
    student: registration.student
      ? {
          id: registration.student.id,
          admissionNumber: registration.student.admissionNumber,
        }
      : null,
    createdAt: registration.createdAt.toISOString(),
    decidedAt: registration.decidedAt?.toISOString() ?? null,
    decisionNote: registration.decisionNote,
  }));

  return (
    <>
      <HelpPanel page="registrations" content={registrationsHelp} />
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Learner registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Capture new learners, track supporting documents, and approve placement into classes with a full audit trail.
          </p>
        </CardContent>
      </Card>
      <RegistrationManager schoolId={schoolId} registrations={serializedRegistrations} classes={classOptions} />
    </div>
    </>
  );
}

