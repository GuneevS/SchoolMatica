import { RegistrationManager } from "@/components/registrations/registration-manager";
import { prisma } from "@/lib/prisma";
import { HelpPanel } from "@/components/help/help-panel";
import { registrationsHelp } from "@/lib/help-content";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { ShieldCheck } from "lucide-react";

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
  const statusCounts: Record<string, number> = {
    Draft: 0,
    Submitted: 0,
    InReview: 0,
    Approved: 0,
    Rejected: 0,
  };
  registrations.forEach((registration) => {
    statusCounts[registration.status] = (statusCounts[registration.status] ?? 0) + 1;
  });
  const awaitingAction = (statusCounts.Submitted ?? 0) + (statusCounts.InReview ?? 0);
  const docsMissing = registrations.filter((registration) => {
    const docs = registration.supportingDocs as Record<string, unknown> | null;
    return !docs || Object.keys(docs).length === 0;
  }).length;

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
      <div className="space-y-8">
        <AuroraHero
          eyebrow="Enrolment"
          title={
            <>
              <span className="gradient-text">Registrations</span> workspace
            </>
          }
          description="Capture new learners, track supporting documents, and approve placement into classes with a full audit trail."
          badges={[
            { label: `${awaitingAction} awaiting action`, color: "hsl(var(--accent-iris))" },
            { label: `${docsMissing} missing docs`, color: "hsl(var(--accent-gold))" },
          ]}
          aside={
            <HeroMetricPanel
              title="Pipeline health"
              icon={<ShieldCheck className="h-4 w-4" />}
              metrics={[
                { label: "In review", value: awaitingAction.toString(), helper: "submitted + in review", accent: "highlight" },
                { label: "Approved", value: (statusCounts.Approved ?? 0).toString() },
                { label: "Rejected", value: (statusCounts.Rejected ?? 0).toString() },
                { label: "Docs missing", value: docsMissing.toString() },
              ]}
            />
          }
        />
        <RegistrationManager schoolId={schoolId} registrations={serializedRegistrations} classes={classOptions} />
      </div>
    </>
  );
}

