import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

interface Params {
  params: Promise<{ documentId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Draft", "Pending", "Approved", "ChangesRequested"]).optional(),
  version: z.number().int().min(1).optional(),
  approval: z
    .object({
      reviewerRole: z.enum(["Teacher", "HOD", "SMT"]),
      reviewerName: z.string().optional(),
      status: z.enum(["Pending", "Approved", "ChangesRequested"]),
      notes: z.string().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "assessmentPlan:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { documentId } = await params;
  const document = await prisma.assessmentDocument.findUnique({
    where: { id: documentId },
    include: {
      approvals: true,
      assessmentPlan: {
        include: {
          classGroup: true,
        },
      },
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Determine the schoolId from the document's related entities
  const schoolId = document.assessmentPlan?.classGroup.schoolId ||
                   document.assessment?.assessmentPlan.classGroup.schoolId;

  if (!schoolId) {
    return NextResponse.json({ error: "Unable to determine school context" }, { status: 500 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  return NextResponse.json(document);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "assessmentPlan:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { documentId } = await params;

  // Fetch document first to verify school access
  const existingDocument = await prisma.assessmentDocument.findUnique({
    where: { id: documentId },
    include: {
      assessmentPlan: {
        include: {
          classGroup: true,
        },
      },
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: true,
            },
          },
        },
      },
    },
  });

  if (!existingDocument) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Determine the schoolId from the document's related entities
  const schoolId = existingDocument.assessmentPlan?.classGroup.schoolId ||
                   existingDocument.assessment?.assessmentPlan.classGroup.schoolId;

  if (!schoolId) {
    return NextResponse.json({ error: "Unable to determine school context" }, { status: 500 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status) {
    updates.status = parsed.data.status;
  }
  if (parsed.data.version) {
    updates.version = parsed.data.version;
  }

  const document = await prisma.assessmentDocument.update({
    where: { id: documentId },
    data: updates,
    include: { approvals: true },
  });

  if (parsed.data.approval) {
    await prisma.documentApproval.create({
      data: {
        documentId: document.id,
        reviewerRole: parsed.data.approval.reviewerRole,
        reviewerName: parsed.data.approval.reviewerName,
        status: parsed.data.approval.status,
        notes: parsed.data.approval.notes ?? null,
        decidedAt: parsed.data.approval.status === "Pending" ? null : new Date(),
      },
    });
  }

  const refreshed = await prisma.assessmentDocument.findUnique({
    where: { id: documentId },
    include: { approvals: true },
  });

  return NextResponse.json(refreshed);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "assessmentPlan:delete");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { documentId } = await params;

  // Fetch document first to verify school access
  const existingDocument = await prisma.assessmentDocument.findUnique({
    where: { id: documentId },
    include: {
      assessmentPlan: {
        include: {
          classGroup: true,
        },
      },
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: true,
            },
          },
        },
      },
    },
  });

  if (!existingDocument) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Determine the schoolId from the document's related entities
  const schoolId = existingDocument.assessmentPlan?.classGroup.schoolId ||
                   existingDocument.assessment?.assessmentPlan.classGroup.schoolId;

  if (!schoolId) {
    return NextResponse.json({ error: "Unable to determine school context" }, { status: 500 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  try {
    // Delete all approvals first
    await prisma.documentApproval.deleteMany({
      where: { documentId },
    });

    // Delete the document
    await prisma.assessmentDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
