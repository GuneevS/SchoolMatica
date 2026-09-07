import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cloneTemplateToPlan } from "@/lib/assessment-service";
import { authorizeWithSchool, hasSchoolAccess, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(3),
  year: z.number().min(2000),
  termCount: z.number().min(1).max(4),
  classGroupId: z.string(),
  templateId: z.string().optional(),
  useTemplateAssessments: z.boolean().optional(),
  termWeights: z
    .record(z.string(), z.number().min(0))
    .optional()
    .refine((value) => {
      if (!value) return true;
      const total = Object.values(value).reduce((sum, item) => sum + item, 0);
      return total === 0 || Math.abs(total - 100) < 0.01;
    }, "Term weights must sum to approximately 100%"),
});

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "assessmentPlan:read");
  if ("error" in result) {
    return result.error;
  }

  try {
    
    const { auth } = result;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    
    // Build where clause based on user permissions
    let whereClause: Prisma.AssessmentPlanWhereInput = {};
    
    if (classId) {
      // Verify the class belongs to an accessible school
      const classGroup = await prisma.classGroup.findUnique({
        where: { id: classId },
        select: { schoolId: true },
      });
      
      if (!classGroup) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      
      if (!hasSchoolAccess(auth, classGroup.schoolId)) {
        return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
      }
      
      whereClause = { classGroupId: classId };
    } else if (!isSystemAdmin(auth)) {
      // Non-admins can only see plans from classes in their schools
      const userSchoolIds = getUserSchoolIds(auth);
      whereClause = {
        classGroup: {
          schoolId: { in: userSchoolIds },
        },
      };
    }
    
    const plans = await prisma.assessmentPlan.findMany({
      where: whereClause,
      include: {
        classGroup: { include: { subject: true } },
        template: true,
        documents: true,
        assessments: { orderBy: { sequence: "asc" } },
        _count: { select: { assessments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(plans);

  } catch (error) {
    return handleApiError("GET assessment-plans", error);
  }
}

export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "assessmentPlan:create");
  if ("error" in result) {
    return result.error;
  }

  try {
    
    const { auth } = result;
    
    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { name, year, termCount, classGroupId, templateId, useTemplateAssessments, termWeights } = parsed.data;
    
    // Verify the class belongs to an accessible school
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      select: { schoolId: true },
    });
    
    if (!classGroup) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    if (!hasSchoolAccess(auth, classGroup.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    if (templateId && useTemplateAssessments !== false) {
      const plan = await cloneTemplateToPlan({
        templateId,
        classGroupId,
        year,
        name,
      });
      if (termWeights) {
        const updated = await prisma.assessmentPlan.update({
          where: { id: plan.id },
          data: { termWeights },
        });
        return NextResponse.json(updated, { status: 201 });
      }
      return NextResponse.json(plan, { status: 201 });
    }

    const plan = await prisma.assessmentPlan.create({
      data: {
        name,
        year,
        termCount,
        status: "Draft",
        classGroupId,
        termWeights: termWeights ?? undefined,
      },
    });
    return NextResponse.json(plan, { status: 201 });

  } catch (error) {
    return handleApiError("POST assessment-plans", error);
  }
}
