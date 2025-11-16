import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ registrationId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Draft", "Submitted", "InReview", "Approved", "Rejected"]).optional(),
  classGroupId: z.string().optional(),
  decisionNote: z.string().optional(),
  actorRole: z.enum(["Teacher", "HOD", "SMT"]),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { registrationId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const registration = await prisma.learnerRegistration.findUnique({
    where: { id: registrationId },
  });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
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
    const classGroupId = effectiveClassGroupId!;
    const learnerData = registration.learnerData as Record<string, string>;
    const admissionNumber = `ADM-${Date.now().toString().slice(-6)}`;
    const student = await prisma.student.create({
      data: {
        classGroupId,
        admissionNumber,
        firstName: learnerData.firstName ?? "Learner",
        lastName: learnerData.lastName ?? "Pending",
        gender: learnerData.gender ?? "",
      },
    });
    studentId = student.id;
    updates.student = { connect: { id: student.id } };
  }

  const updated = await prisma.learnerRegistration.update({
    where: { id: registrationId },
    data: updates,
  });

  return NextResponse.json({ ...updated, studentId });
}

