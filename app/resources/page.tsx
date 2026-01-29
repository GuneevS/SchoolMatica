import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAuthContext, getAuthorizedActiveSchool } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ResourceBrowser } from "@/components/resources/resource-browser";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resource Library | SchoolMatica",
  description: "Browse and download assessment resources, documents, and teaching materials.",
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function getResourceData(schoolId: string) {
  // Get all approved assessment documents as resources
  const documents = await prisma.assessmentDocument.findMany({
    where: {
      status: "Approved",
      OR: [
        { assessment: { assessmentPlan: { classGroup: { schoolId } } } },
        { assessmentPlan: { classGroup: { schoolId } } },
      ],
    },
    include: {
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: {
                include: {
                  subject: true,
                  gradeLevel: true,
                },
              },
            },
          },
        },
      },
      assessmentPlan: {
        include: {
          classGroup: {
            include: {
              subject: true,
              gradeLevel: true,
            },
          },
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  // Get unique subjects and grades for filtering
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { schoolId },
    select: { id: true, name: true, order: true },
    orderBy: { order: "asc" },
  });

  // Transform documents for the resource browser
  const resources = documents.map((doc) => {
    const plan = doc.assessment?.assessmentPlan || doc.assessmentPlan;
    const classGroup = plan?.classGroup;
    
    return {
      id: doc.id,
      label: doc.label,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileUrl: doc.fileUrl,
      version: doc.version,
      uploadedAt: doc.uploadedAt.toISOString(),
      uploadedBy: doc.uploadedByName || "Unknown",
      subject: classGroup?.subject?.name || "General",
      subjectCode: classGroup?.subject?.code || "",
      grade: classGroup?.grade || 0,
      gradeName: classGroup?.gradeLevel?.name || `Grade ${classGroup?.grade}`,
      year: plan?.year || new Date().getFullYear(),
      term: doc.assessment?.term || "Annual",
      assessmentName: doc.assessment?.taskName || plan?.name || "Resource",
      category: doc.label.toLowerCase().includes("rubric")
        ? "Rubric"
        : doc.label.toLowerCase().includes("memo")
        ? "Memo"
        : doc.label.toLowerCase().includes("paper")
        ? "Question Paper"
        : "Resource",
    };
  });

  return { resources, subjects, gradeLevels };
}

export default async function ResourcesPage() {
  const auth = await getServerAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const school = await getAuthorizedActiveSchool();
  if (!school) {
    redirect("/dashboard");
  }

  const { resources, subjects, gradeLevels } = await getResourceData(school.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resource Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse and download assessment resources, rubrics, memos, and teaching materials.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <ResourceBrowser
          resources={resources}
          subjects={subjects}
          gradeLevels={gradeLevels}
        />
      </Suspense>
    </div>
  );
}
