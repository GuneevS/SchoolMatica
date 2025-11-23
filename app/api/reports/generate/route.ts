import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStudentSba } from "@/lib/calculations";

export async function POST(request: NextRequest) {
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

    // Get class group with assessment plan
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
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

    const assessmentPlan = classGroup.assessmentPlans[0];
    const assessments = assessmentPlan?.assessments ?? [];

    // Generate report cards for each student
    const reportCards = [];
    for (const studentId of studentIds) {
      // Calculate SBA for student
      const sbaResult = calculateStudentSba({
        assessments,
        studentId,
      });

      // Determine achievement level (1-7 scale)
      const achievementLevel = 
        sbaResult.sbaPercent >= 80 ? 7 :
        sbaResult.sbaPercent >= 70 ? 6 :
        sbaResult.sbaPercent >= 60 ? 5 :
        sbaResult.sbaPercent >= 50 ? 4 :
        sbaResult.sbaPercent >= 40 ? 3 :
        sbaResult.sbaPercent >= 30 ? 2 : 1;

      // Determine overall grade (A-E scale)
      const overallGrade =
        sbaResult.sbaPercent >= 80 ? "A" :
        sbaResult.sbaPercent >= 70 ? "B" :
        sbaResult.sbaPercent >= 60 ? "C" :
        sbaResult.sbaPercent >= 50 ? "D" : "E";

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
