import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/behavior/incidents
 * Get behavior incidents for a school
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const type = searchParams.get("type");
    const studentId = searchParams.get("studentId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const incidents = await prisma.behaviorIncident.findMany({
      where: {
        schoolId,
        ...(type && { type }),
        ...(studentId && { studentId }),
      },
      include: {
        student: {
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
        },
        issuedBy: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/behavior/incidents
 * Create a new behavior incident
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const { studentId, type, points, category, description, schoolId } = body;

    // Validate required fields
    if (!studentId || !type || !points || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate school access
    const effectiveSchoolId = schoolId || auth.user.schoolId;
    if (!effectiveSchoolId || !hasSchoolAccess(auth, effectiveSchoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify student belongs to the school
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classGroup: {
          select: { schoolId: true },
        },
      },
    });

    if (!student || student.classGroup.schoolId !== effectiveSchoolId) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get current term and year (simplified - could be made more dynamic)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let term = "1";
    if (month >= 3 && month <= 5) term = "2";
    else if (month >= 6 && month <= 8) term = "3";
    else if (month >= 9) term = "4";

    // Create the incident
    const incident = await prisma.behaviorIncident.create({
      data: {
        studentId,
        schoolId: effectiveSchoolId,
        type,
        points,
        category,
        description,
        issuedById: auth.user.id,
        term,
        year,
        date: new Date(),
        status: "Active",
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update the student's behavior balance
    await prisma.behaviorBalance.upsert({
      where: { studentId },
      create: {
        studentId,
        meritTotal: type === "Merit" ? points : 0,
        demeritTotal: type === "Demerit" ? points : 0,
        netBalance: type === "Merit" ? points : -points,
      },
      update: {
        meritTotal: type === "Merit" ? { increment: points } : undefined,
        demeritTotal: type === "Demerit" ? { increment: points } : undefined,
        netBalance: {
          increment: type === "Merit" ? points : -points,
        },
      },
    });

    // Check if student has crossed any thresholds (simplified)
    if (type === "Demerit") {
      const balance = await prisma.behaviorBalance.findUnique({
        where: { studentId },
      });

      if (balance && balance.demeritTotal >= 10) {
        // Could trigger notifications here
        // For now, just log
        console.log(`Student ${studentId} has reached ${balance.demeritTotal} demerits`);
      }
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
