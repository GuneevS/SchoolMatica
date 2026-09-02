import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStudentRecord, generateAdmissionNumber } from "@/lib/domain/student-onboarding";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

interface Params {
  params: Promise<{ registrationId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Draft", "Submitted", "InReview", "Approved", "Rejected"]).optional(),
  classGroupId: z.string().optional(),
  decisionNote: z.string().optional(),
  actorRole: z.enum(["Teacher", "HOD", "SMT"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Determine permission needed based on status change
    const { registrationId } = await params;
  
  // First check if we're updating status to Approved/Rejected (requires decide permission)
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Use decide permission for status changes, update for other changes
  const permission = parsed.data.status === "Approved" || parsed.data.status === "Rejected" 
    ? "registration:decide" 
    : "registration:update";
  
  const authResult = await authorizeWithSchool(request, permission);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const registration = await prisma.learnerRegistration.findUnique({
    where: { id: registrationId },
  });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Verify user has access to this school
  if (!hasSchoolAccess(auth, registration.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const updates: Prisma.LearnerRegistrationUpdateInput = {};
  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "Approved") {
      updates.decidedAt = new Date();
    }
  }
  let effectiveClassGroupId = registration.classGroupId ?? undefined;
  if (parsed.data.classGroupId !== undefined) {
    if (parsed.data.classGroupId === "") {
      updates.classGroup = { disconnect: true };
      effectiveClassGroupId = undefined;
    } else {
      const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId } });
      if (!classGroup || classGroup.schoolId !== registration.schoolId) {
        return NextResponse.json({ error: "Invalid class group selection" }, { status: 400 });
      }
      updates.classGroup = { connect: { id: classGroup.id } };
      effectiveClassGroupId = classGroup.id;
    }
  }
  if (parsed.data.decisionNote !== undefined) {
    updates.decisionNote = parsed.data.decisionNote;
  }

  let studentId = registration.studentId;
  if (parsed.data.status === "Approved" && !registration.studentId) {
    if (!effectiveClassGroupId) {
      return NextResponse.json({ error: "Class group required to approve registration" }, { status: 400 });
    }
    const classGroupId = effectiveClassGroupId;
    const learnerData = registration.learnerData as Record<string, string>;
    const guardianData = registration.guardianData as Record<string, string> | null;
    const student = await createStudentRecord(
      {
        classGroupId,
        admissionNumber: generateAdmissionNumber(learnerData.admissionNumber as string | undefined),
        firstName: (learnerData.firstName as string) ?? "Learner",
        lastName: (learnerData.lastName as string) ?? "Pending",
        gender: (learnerData.gender as string) ?? "",
        advisorTeacherId: learnerData.advisorTeacherId as string | undefined,
        guardian: guardianData
          ? {
              fullName: (guardianData.guardianName as string) ?? "Guardian",
              relationship: (guardianData.relationship as string) ?? "Guardian",
              email: guardianData.email as string | undefined,
              phone: guardianData.phone as string | undefined,
              primary: true,
            }
          : null,
      },
      prisma,
    );
    studentId = student.id;
    updates.student = { connect: { id: student.id } };
  }

  const updated = await prisma.learnerRegistration.update({
    where: { id: registrationId },
    data: updates,
  });

  return NextResponse.json({ ...updated, studentId });
  } catch (error) {
    return handleApiError("PATCH registrations/[registrationId]", error);
  }
}

