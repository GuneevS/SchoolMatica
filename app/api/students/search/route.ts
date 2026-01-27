import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/search
 * Search for students by name or admission number
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        classGroup: {
          schoolId,
        },
        OR: [
          {
            firstName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            admissionNumber: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        classGroup: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
