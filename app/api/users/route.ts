import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, isSystemAdmin, hasSchoolAccess, getUserSchoolIds } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).optional(),
  schoolId: z.string(), // Required - user's primary school
  teacherId: z.string().optional(),
  roleAssignments: z.array(z.object({
    roleKey: z.string(),
    scopeSchoolId: z.string().optional(),
  })).optional(),
});

/**
 * GET /api/users - List users
 * Admin: all users
 * Others: only users from their schools
 * Supports search query for messaging recipient selection
 */
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "user:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "50");

    // Validate school access if schoolId is provided
    if (schoolId && !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};
    
    // School filter
    if (isSystemAdmin(auth)) {
      if (schoolId) {
        whereClause = { schoolId };
      }
    } else {
      const userSchoolIds = getUserSchoolIds(auth);
      whereClause = schoolId 
        ? { schoolId }
        : { 
            OR: [
              { schoolId: { in: userSchoolIds } },
              { roleAssignments: { some: { scopeSchoolId: { in: userSchoolIds } } } }
            ]
          };
    }

    // Search filter for recipient selection
    if (search && search.length >= 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchFilter: any = {
        OR: [
          { displayName: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { teacher: { firstName: { contains: search, mode: "insensitive" } } },
          { teacher: { lastName: { contains: search, mode: "insensitive" } } },
        ],
      };
      
      whereClause = whereClause.OR 
        ? { AND: [whereClause, searchFilter] }
        : { ...whereClause, ...searchFilter };
    }

    // Exclude the current user from search results (for messaging)
    if (search) {
      whereClause = {
        AND: [
          whereClause,
          { id: { not: auth.user.id } },
        ],
      };
    }

    const users = await prisma.appUser.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        displayName: true,
        name: true,
        schoolId: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { displayName: "asc" },
      take: limit,
    });

    return NextResponse.json({ users });

  } catch (error) {
    return handleApiError("GET users", error);
  }
}

/**
 * POST /api/users - Create a new user
 * Requires user:create permission
 * System admin can create for any school
 * Others can only create for their schools
 */
export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "user:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const json = await request.json();
    const parsed = createUserSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { email, displayName, schoolId, teacherId, roleAssignments } = parsed.data;

    // Validate school access - schoolId is required
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Validate role assignments school access
    if (roleAssignments) {
      for (const ra of roleAssignments) {
        if (ra.scopeSchoolId && !hasSchoolAccess(auth, ra.scopeSchoolId)) {
          return NextResponse.json({ error: "Access denied to assign role to this school" }, { status: 403 });
        }
      }
    }

    // Check if email already exists
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // If teacherId is provided, validate it exists and belongs to the right school
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({ 
        where: { id: teacherId },
        select: { schoolId: true },
      });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
      if (schoolId && teacher.schoolId !== schoolId) {
        return NextResponse.json({ error: "Teacher does not belong to the specified school" }, { status: 400 });
      }
      if (!hasSchoolAccess(auth, teacher.schoolId)) {
        return NextResponse.json({ error: "Access denied to this teacher's school" }, { status: 403 });
      }
    }

    // Prepare role assignments
    let roleAssignmentData: Array<{ roleId: string; scopeSchoolId: string | null }> = [];
    if (roleAssignments && roleAssignments.length > 0) {
      // Get roles by key
      const roleKeys = roleAssignments.map(ra => ra.roleKey);
      const roles = await prisma.roleDefinition.findMany({
        where: { key: { in: roleKeys } },
      });
      
      const roleMap = new Map(roles.map((r: { key: string; id: string }) => [r.key, r.id]));
      
      for (const ra of roleAssignments) {
        const roleId = roleMap.get(ra.roleKey);
        if (!roleId) {
          return NextResponse.json({ error: `Role not found: ${ra.roleKey}` }, { status: 400 });
        }
        // Only admins can assign system_admin role
        if (ra.roleKey === "system_admin" && !isSystemAdmin(auth)) {
          return NextResponse.json({ error: "Only system admins can assign the system_admin role" }, { status: 403 });
        }
        roleAssignmentData.push({
          roleId,
          scopeSchoolId: ra.scopeSchoolId ?? null,
        });
      }
    }

    // Build user data with school connection (required) and optional teacher
    const userData: Parameters<typeof prisma.appUser.create>[0]["data"] = {
      email,
      displayName: displayName ?? email.split("@")[0],
      school: { connect: { id: schoolId } },
      roleAssignments: {
        create: roleAssignmentData,
      },
    };

    // Connect optional teacher relation
    if (teacherId) {
      userData.teacher = { connect: { id: teacherId } };
    }

    // Create the user
    const user = await prisma.appUser.create({
      data: userData,
      include: {
        roleAssignments: {
          include: { role: true },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    return handleApiError("POST users", error);
  }
}
