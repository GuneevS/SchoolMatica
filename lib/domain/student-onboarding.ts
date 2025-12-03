import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

export interface GuardianPayload {
  fullName: string;
  relationship?: string;
  email?: string;
  phone?: string;
  primary?: boolean;
}

export interface StudentOnboardingPayload {
  classGroupId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender?: string;
  advisorTeacherId?: string;
  guardian?: GuardianPayload | null;
}

export async function createStudentRecord(payload: StudentOnboardingPayload, client: PrismaClientOrTx = prisma) {
  const { classGroupId, admissionNumber, firstName, lastName, gender, advisorTeacherId, guardian } = payload;

  return client.student.create({
    data: {
      classGroupId,
      admissionNumber,
      firstName,
      lastName,
      gender: gender ?? "",
      advisorTeacherId,
      parents: guardian
        ? {
            create: [
              {
                fullName: guardian.fullName,
                relationship: guardian.relationship ?? "Guardian",
                email: guardian.email,
                phone: guardian.phone,
                primary: guardian.primary ?? true,
              },
            ],
          }
        : undefined,
    },
  });
}

export function generateAdmissionNumber(seed?: string) {
  if (seed && seed.trim().length > 0) {
    return seed.trim();
  }
  return `ADM-${Date.now().toString().slice(-6)}`;
}
