import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/schools/search
 * Public endpoint to search for schools by name or short code
 * Used in the login flow for teachers, parents, and students
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ schools: [] });
    }

    const schools = await prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortCode: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        shortCode: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Error searching schools:", error);
    return NextResponse.json(
      { error: "Failed to search schools" },
      { status: 500 }
    );
  }
}
