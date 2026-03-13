import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const acceptSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/teacher-invitations/accept - Accept a teacher invitation
 * This endpoint links a user account to a teacher record.
 */
export async function POST(request: NextRequest) {
  // Get current authenticated user
  try {    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "You must be logged in to accept an invitation" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = acceptSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { token } = parsed.data;

    // Find the invitation
    const invitation = await prisma.teacherInvitation.findUnique({
      where: { token },
      include: {
        teacher: {
          include: { account: true },
        },
        school: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    // Check invitation status
    if (invitation.status !== "Pending") {
      return NextResponse.json({ 
        error: `This invitation has already been ${invitation.status.toLowerCase()}` 
      }, { status: 400 });
    }

    // Check expiration
    if (invitation.expiresAt < new Date()) {
      await prisma.teacherInvitation.update({
        where: { id: invitation.id },
        data: { status: "Expired" },
      });
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    // Check if teacher already has an account
    if (invitation.teacher.account) {
      return NextResponse.json({ 
        error: "This teacher already has a linked account" 
      }, { status: 409 });
    }

    // Check if current user already has a different teacher link
    if (auth.user.teacherId && auth.user.teacherId !== invitation.teacherId) {
      return NextResponse.json({ 
        error: "Your account is already linked to a different teacher" 
      }, { status: 409 });
    }

    // Get the role to assign
    const role = await prisma.roleDefinition.findUnique({
      where: { key: invitation.roleKey },
    });

    if (!role) {
      return NextResponse.json({ 
        error: "Role configuration error" 
      }, { status: 500 });
    }

    // Perform the account linking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the user to link to the teacher
      const updatedUser = await tx.appUser.update({
        where: { id: auth.user.id },
        data: {
          teacherId: invitation.teacherId,
          // Update school if not already set
          schoolId: auth.user.schoolId ?? invitation.schoolId,
        },
      });

      // Create role assignment if doesn't exist
      const existingAssignment = await tx.userRoleAssignment.findFirst({
        where: {
          userId: auth.user.id,
          roleId: role.id,
          scopeSchoolId: invitation.schoolId,
        },
      });

      if (!existingAssignment) {
        await tx.userRoleAssignment.create({
          data: {
            userId: auth.user.id,
            roleId: role.id,
            scopeSchoolId: invitation.schoolId,
          },
        });
      }

      // Mark invitation as accepted
      await tx.teacherInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "Accepted",
          acceptedAt: new Date(),
        },
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: "Account successfully linked to teacher record",
      teacher: {
        id: invitation.teacher.id,
        firstName: invitation.teacher.firstName,
        lastName: invitation.teacher.lastName,
      },
      school: {
        id: invitation.school.id,
        name: invitation.school.name,
      },
    });

  } catch (error) {
    return handleApiError("POST teacher-invitations/accept", error);
  }
}

/**
 * GET /api/teacher-invitations/accept?token=xxx - Get invitation details (for preview)
 */
export async function GET(request: NextRequest) {
  try {    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.teacherInvitation.findUnique({
      where: { token },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    // Check invitation status
    if (invitation.status !== "Pending") {
      return NextResponse.json({ 
        error: `This invitation has already been ${invitation.status.toLowerCase()}`,
        status: invitation.status,
      }, { status: 400 });
    }

    // Check expiration
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ 
        error: "This invitation has expired",
        status: "Expired",
      }, { status: 400 });
    }

    // Return invitation details (without sensitive data)
    return NextResponse.json({
      teacher: invitation.teacher,
      school: invitation.school,
      roleKey: invitation.roleKey,
      expiresAt: invitation.expiresAt,
    });

  } catch (error) {
    return handleApiError("GET teacher-invitations/accept", error);
  }
}
