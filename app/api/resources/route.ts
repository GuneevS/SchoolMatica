import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";

// GET - List resources for the school
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = auth.user.schoolId;
    if (!schoolId && !auth.isSuperAdmin) {
      return NextResponse.json({ error: "No school context" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const grade = searchParams.get("grade");
    const category = searchParams.get("category");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    // Get approved assessment documents as resources
    const documents = await prisma.assessmentDocument.findMany({
      where: {
        status: "Approved",
        OR: [
          { assessment: { assessmentPlan: { classGroup: { schoolId } } } },
          { assessmentPlan: { classGroup: { schoolId } } },
        ],
        ...(subject && {
          OR: [
            { assessment: { assessmentPlan: { classGroup: { subject: { name: subject } } } } },
            { assessmentPlan: { classGroup: { subject: { name: subject } } } },
          ],
        }),
        ...(grade && {
          OR: [
            { assessment: { assessmentPlan: { classGroup: { grade: parseInt(grade) } } } },
            { assessmentPlan: { classGroup: { grade: parseInt(grade) } } },
          ],
        }),
        ...(year && {
          OR: [
            { assessment: { assessmentPlan: { year: parseInt(year) } } },
            { assessmentPlan: { year: parseInt(year) } },
          ],
        }),
        ...(search && {
          OR: [
            { label: { contains: search, mode: "insensitive" } },
            { fileName: { contains: search, mode: "insensitive" } },
          ],
        }),
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

    // Transform documents
    const resources = documents
      .map((doc) => {
        const plan = doc.assessment?.assessmentPlan || doc.assessmentPlan;
        const classGroup = plan?.classGroup;

        // Determine category based on label
        let docCategory = "Resource";
        if (doc.label.toLowerCase().includes("rubric")) docCategory = "Rubric";
        else if (doc.label.toLowerCase().includes("memo")) docCategory = "Memo";
        else if (doc.label.toLowerCase().includes("paper")) docCategory = "Question Paper";

        // Filter by category if specified
        if (category && docCategory !== category) return null;

        return {
          id: doc.id,
          label: doc.label,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          fileUrl: doc.fileUrl,
          version: doc.version,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedByName || "Unknown",
          subject: classGroup?.subject?.name || "General",
          subjectCode: classGroup?.subject?.code || "",
          grade: classGroup?.grade || 0,
          gradeName: classGroup?.gradeLevel?.name || `Grade ${classGroup?.grade}`,
          year: plan?.year || new Date().getFullYear(),
          term: doc.assessment?.term || "Annual",
          assessmentName: doc.assessment?.taskName || plan?.name || "Resource",
          category: docCategory,
        };
      })
      .filter(Boolean);

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}
