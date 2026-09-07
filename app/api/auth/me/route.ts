import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isSystemAdmin, getUserSchoolIds, isSuperAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * GET /api/auth/me
 * Returns the current user's authentication context for client-side use
 */
export async function GET(request: NextRequest) {
  try {    const auth = await getAuthContext(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Transform to client-friendly format
    const clientAuth = {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        displayName: auth.user.displayName,
        schoolId: auth.user.schoolId,
        profilePictureUrl: (auth.user as { profilePictureUrl?: string }).profilePictureUrl ?? null,
        image: auth.user.image ?? null,
        roleAssignments: auth.user.roleAssignments.map((assignment: typeof auth.user.roleAssignments[number]) => ({
          role: {
            name: assignment.role.name,
            key: assignment.role.key,
            priority: assignment.role.priority,
          },
          scopeSchoolId: assignment.scopeSchoolId,
        })),
      },
      permissions: Array.from(auth.permissions),
      isAdmin: isSystemAdmin(auth),
      isSuperAdmin: isSuperAdmin(auth),
      schoolIds: getUserSchoolIds(auth),
    };
    
    return NextResponse.json(clientAuth);

  } catch (error) {
    return handleApiError("GET auth/me", error);
  }
}
