import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/search
 * Search for users within a school for messaging
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!schoolId) {
      return NextResponse.json({ error: "School ID required" }, { status: 400 });
    }

    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name, display name, or email
    const users = await prisma.appUser.findMany({
      where: {
        schoolId,
        id: { not: auth.user.id }, // Exclude current user
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        name: true,
        email: true,
        roleAssignments: {
          include: {
            role: {
              select: {
                name: true,
                priority: true,
              },
            },
          },
          orderBy: {
            role: { priority: "desc" },
          },
          take: 1,
        },
      },
      take: limit,
    });

    // Transform users for response
    const transformedUsers = users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      name: user.name,
      email: user.email,
      role: user.roleAssignments[0]?.role.name || "User",
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
