import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStudentSba, getBandsForPhase, mapPercentToLevel } from "@/lib/calculations";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { auditReportGeneration } from "@/lib/audit";

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "report:generate");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  try {
    const body = await request.json();
    const {
      classGroupId,
      term,
      year,
      studentIds,
      teacherComment,
      conductGrade,
      effortGrade,
    } = body;

    if (!classGroupId || !term || !year || !studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get class group with assessment plan and school's grading config
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
        school: {
          include: { gradingConfig: true },
        },
        gradeLevel: true,
        assessmentPlans: {
          include: {
            assessments: {
              include: {
                marks: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!classGroup) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify school access
    if (!hasSchoolAccess(auth, classGroup.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const assessmentPlan = classGroup.assessmentPlans[0];
    const assessments = assessmentPlan?.assessments ?? [];

    // Get grading bands from school's config - FIX: use actual config instead of hardcoded values
    const phase = classGroup.gradeLevel?.name ?? "default";
    const gradingBands = getBandsForPhase(classGroup.school.gradingConfig, phase);

    // Generate report cards for each student
    const reportCards = [];
    for (const studentId of studentIds) {
      // Calculate SBA for student
      const sbaResult = calculateStudentSba({
        assessments,
        studentId,
      });

      // Use school's grading config to determine level - FIX: dynamic grading
      const levelResult = mapPercentToLevel(sbaResult.sbaPercent, gradingBands);
      const achievementLevel = levelResult.level;

      // Map level to letter grade (using descriptor or fallback)
      const overallGrade = getLetterGrade(sbaResult.sbaPercent, gradingBands);

      // Create or update report card
      const reportCard = await prisma.reportCard.upsert({
        where: {
          studentId_term_year: {
            studentId,
            term,
            year,
          },
        },
        update: {
          overallGrade,
          overallPercentage: sbaResult.sbaPercent,
          achievementLevel,
          teacherComment: teacherComment || undefined,
          conductGrade: conductGrade || undefined,
          effortGrade: effortGrade || undefined,
          status: "Draft",
          generatedAt: new Date(),
        },
        create: {
          studentId,
          classGroupId,
          term,
          year,
          overallGrade,
          overallPercentage: sbaResult.sbaPercent,
          achievementLevel,
          teacherComment: teacherComment || null,
          conductGrade: conductGrade || null,
          effortGrade: effortGrade || null,
          status: "Draft",
          generatedAt: new Date(),
        },
      });

      reportCards.push(reportCard);
    }

    // Audit the report generation
    await auditReportGeneration(auth, "report_card", classGroup.schoolId, {
      classGroupId,
      term,
      year,
      studentCount: studentIds.length,
    });

    return NextResponse.json({
      success: true,
      count: reportCards.length,
      reportCards,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}

/**
 * Convert percentage to letter grade based on grading bands.
 * Falls back to standard A-E scale if no bands configured.
 */
function getLetterGrade(percent: number, bands: { minPercent: number; level: number; descriptor: string }[]): string {
  if (bands.length === 0) {
    // Fallback to standard scale
    if (percent >= 80) return "A";
    if (percent >= 70) return "B";
    if (percent >= 60) return "C";
    if (percent >= 50) return "D";
    return "E";
  }

  // Use the descriptor from the matched band, or derive from level
  const matched = mapPercentToLevel(percent, bands);
  
  // Try to use descriptor first letter if it looks like a grade
  const descriptor = matched.descriptor;
  if (descriptor && /^[A-F]$/i.test(descriptor.charAt(0))) {
    return descriptor.charAt(0).toUpperCase();
  }
  
  // Otherwise map level to grade (7=A, 6=B, 5=C, 4=D, 1-3=E)
  const level = matched.level;
  if (level >= 7) return "A";
  if (level >= 6) return "B";
  if (level >= 5) return "C";
  if (level >= 4) return "D";
  return "E";
}
