import { prisma } from "@/lib/prisma";
import { getAuthorizedActiveSchool } from "@/lib/auth-server";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { SubjectConfigForm } from "@/components/settings/subject-config-form";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubjectsSettingsPage() {
    const school = await getAuthorizedActiveSchool();

    if (!school) {
        return (
            <div className="p-10 text-center text-muted-foreground">
                <p>No schools found. Create one from the Schools workspace to get started.</p>
            </div>
        );
    }

    const [subjects, gradeLevels, gradeSubjectConfigs] = await Promise.all([
        prisma.subject.findMany({
            where: { schoolId: school.id },
            orderBy: { name: "asc" },
        }),
        prisma.gradeLevel.findMany({
            where: { schoolId: school.id },
            orderBy: { order: "asc" },
        }),
        prisma.gradeSubjectConfig.findMany({
            where: { schoolId: school.id },
            include: { subject: true, gradeLevel: true },
        }),
    ]);

    // Group configs by grade
    const configsByGrade = gradeLevels.reduce((acc, grade) => {
        acc[grade.id] = gradeSubjectConfigs
            .filter(c => c.gradeLevelId === grade.id)
            .map(c => ({
                subjectId: c.subjectId,
                subjectName: c.subject.name,
                subjectCode: c.subject.code,
                isCompulsory: c.isCompulsory,
            }));
        return acc;
    }, {} as Record<string, { subjectId: string; subjectName: string; subjectCode: string; isCompulsory: boolean }[]>);

    return (
        <div className="space-y-6">
            <AuroraHero
                eyebrow="Configuration"
                title={
                    <>
                        <span className="gradient-text">Subject</span> management
                    </>
                }
                description="Configure which subjects are offered at each grade level. Define compulsory and elective subjects based on SA CAPS guidelines."
                badges={[
                    { label: `${subjects.length} subjects`, color: "hsl(var(--accent-iris))" },
                    { label: `${gradeLevels.length} grades`, color: "hsl(var(--accent-mint))" },
                ]}
                aside={
                    <HeroMetricPanel
                        title="Subject overview"
                        icon={<BookOpen className="h-4 w-4" />}
                        metrics={[
                            { label: "Total subjects", value: subjects.length.toString(), accent: "highlight" },
                            { label: "Grade levels", value: gradeLevels.length.toString() },
                            { label: "Configurations", value: gradeSubjectConfigs.length.toString(), helper: "subject-grade links" },
                        ]}
                    />
                }
            />

            <SubjectConfigForm
                schoolId={school.id}
                subjects={subjects.map(s => ({ id: s.id, name: s.name, code: s.code, phase: s.phase }))}
                gradeLevels={gradeLevels.map(g => ({ id: g.id, name: g.name, order: g.order }))}
                configsByGrade={configsByGrade}
            />
        </div>
    );
}
