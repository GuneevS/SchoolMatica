import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";
import crypto from "crypto";

const createSchema = z.object({
  teacherId: z.string(),
  email: z.string().email(),
  roleKey: z.string().optional().default("teacher"),
  expiresInDays: z.number().min(1).max(30).optional().default(7),
});

/**
 * GET /api/teacher-invitations - List teacher invitations
 */
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "teacher:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") ?? undefined;
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  // Validate school access if provided
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Build where clause with school scoping
  let whereClause: any = {};
  
  if (teacherId) {
    whereClause.teacherId = teacherId;
  }
  if (schoolId) {
    whereClause.schoolId = schoolId;
  }
  if (status) {
    whereClause.status = status;
  }

  // Scope to user's schools if not admin
  if (!isSystemAdmin(auth) && !schoolId) {
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause.schoolId = { in: userSchoolIds };
  }

  const invitations = await prisma.teacherInvitation.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

/**
 * POST /api/teacher-invitations - Create a new teacher invitation
 */
export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "teacher:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { teacherId, email, roleKey, expiresInDays } = parsed.data;

  // Get teacher and validate school access
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      school: true,
      account: true,
    },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  if (!hasSchoolAccess(auth, teacher.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Check if teacher already has an account
  if (teacher.account) {
    return NextResponse.json({ 
      error: "Teacher already has a linked account",
      linkedEmail: teacher.account.email,
    }, { status: 409 });
  }

  // Check if there's already a pending invitation for this teacher+email
  const existingInvitation = await prisma.teacherInvitation.findFirst({
    where: {
      teacherId,
      email,
      status: "Pending",
    },
  });

  if (existingInvitation) {
    // If not expired, return the existing one
    if (existingInvitation.expiresAt > new Date()) {
      return NextResponse.json({
        message: "An invitation already exists for this teacher and email",
        invitation: existingInvitation,
      }, { status: 200 });
    }
    
    // Otherwise, expire it and create a new one
    await prisma.teacherInvitation.update({
      where: { id: existingInvitation.id },
      data: { status: "Expired" },
    });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create invitation
  const invitation = await prisma.teacherInvitation.create({
    data: {
      teacherId,
      schoolId: teacher.schoolId,
      email,
      token,
      roleKey,
      status: "Pending",
      invitedBy: auth.user.id,
      expiresAt,
    },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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

  // In a real app, you would send an email here
  // For now, return the invitation with the token (for demo purposes)
  return NextResponse.json({
    invitation,
    // In production, remove this and send via email instead
    inviteUrl: `/invite/teacher/${token}`,
  }, { status: 201 });
}
