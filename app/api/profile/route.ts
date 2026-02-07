import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  profileColor: z.string().max(50).optional(),
});

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = {
    id: auth.user.id,
    email: auth.user.email,
    displayName: auth.user.displayName,
    profilePictureUrl: (auth.user as { profilePictureUrl?: string }).profilePictureUrl ?? null,
    profileColor: (auth.user as { profileColor?: string }).profileColor ?? null,
    image: auth.user.image,
    schoolId: auth.user.schoolId,
    roleAssignments: auth.user.roleAssignments.map((ra: typeof auth.user.roleAssignments[number]) => ({
      role: {
        name: ra.role.name,
        key: ra.role.key,
        priority: ra.role.priority,
      },
      scopeSchoolId: ra.scopeSchoolId,
    })),
  };

  return NextResponse.json(profile);
}

/**
 * PUT /api/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { displayName, profileColor } = parsed.data;

    const updateData: Record<string, string | undefined> = {};
    if (displayName !== undefined) {
      updateData.displayName = displayName;
      updateData.name = displayName; // Sync with name field
    }
    if (profileColor !== undefined) {
      updateData.profileColor = profileColor;
    }

    const updatedUser = await prisma.appUser.update({
      where: { id: auth.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        profilePictureUrl: true,
        profileColor: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
