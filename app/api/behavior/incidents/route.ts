import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { notifyParentsOfBehaviorIncident } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/domain/audit";

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
    const updatedBalance = await prisma.behaviorBalance.upsert({
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

    // Record audit log
    const actorRole = auth.user.roleAssignments[0]?.role?.name || "Unknown";
    await recordAuditLog({
      schoolId: effectiveSchoolId,
      entityType: "BehaviorIncident",
      entityId: incident.id,
      action: "INCIDENT_CREATED",
      actorRole,
      actorName: auth.user.displayName || "System",
      metadata: {
        type: incident.type,
        category: incident.category,
        points: incident.points,
        studentId: incident.studentId,
        studentName: `${incident.student.firstName} ${incident.student.lastName}`,
      },
    });

    // Trigger parent notifications
    try {
      await notifyParentsOfBehaviorIncident(
        studentId,
        type as "Merit" | "Demerit",
        points,
        description
      );
    } catch (notifError) {
      // Log error but don't fail the incident creation
      console.error("Failed to send parent notification:", notifError);
    }

    // Check if student has crossed any thresholds
    const policies = await prisma.behaviorPolicy.findMany({
      where: {
        schoolId: effectiveSchoolId,
        type,
        isActive: true,
      },
    });

    for (const policy of policies) {
      const thresholds = (policy.thresholds as any) || [];
      
      if (Array.isArray(thresholds)) {
        for (const threshold of thresholds) {
          const relevantTotal = type === "Merit" 
            ? updatedBalance.meritTotal 
            : updatedBalance.demeritTotal;

          // Check if threshold is crossed
          if (relevantTotal >= threshold.value) {
            // Check if trigger already exists for this threshold
            const existingTrigger = await prisma.behaviorThresholdTrigger.findFirst({
              where: {
                studentId,
                type,
                thresholdValue: threshold.value,
                status: "Active",
              },
            });

            if (!existingTrigger) {
              // Create threshold trigger
              await prisma.behaviorThresholdTrigger.create({
                data: {
                  studentId,
                  schoolId: effectiveSchoolId,
                  type,
                  thresholdValue: threshold.value,
                  thresholdName: threshold.name || `${threshold.value} ${type}s`,
                  action: threshold.action || "NOTIFY_PARENT",
                  status: "Active",
                },
              });

              // Log threshold crossing
              await recordAuditLog({
                schoolId: effectiveSchoolId,
                entityType: "BehaviorThresholdTrigger",
                entityId: studentId,
                action: "THRESHOLD_CROSSED",
                actorRole: "System",
                actorName: "Automated Threshold Check",
                metadata: {
                  type,
                  thresholdValue: threshold.value,
                  thresholdName: threshold.name,
                  currentTotal: relevantTotal,
                  studentId,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ incident, balance: updatedBalance });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
