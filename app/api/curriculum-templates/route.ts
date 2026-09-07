import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCurriculumTemplates, createCurriculumTemplate } from "@/lib/domain/templates";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin, getUserSchoolIds } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const createSchema = z.object({
  schoolId: z.string().optional(),
  name: z.string().min(3),
  subjectName: z.string().min(3),
  subjectCode: z.string().min(2),
  phase: z.string().min(2),
  grade: z.number().min(1),
  defaultTermCount: z.number().min(1).max(4),
  createdByRole: z.enum(["Teacher", "HOD", "SMT"]),
  assessments: z
    .array(
      z.object({
        taskName: z.string().min(2),
        term: z.enum(["T1", "T2", "T3", "T4"]),
        totalMark: z.number().min(1),
        rawWeight: z.number().min(0),
        type: z.string().optional(),
        isPatComponent: z.boolean().optional(),
      }),
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "template:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") ?? undefined;

    // Validate school access if schoolId is provided
    if (schoolId && !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // For non-admins, filter to their accessible schools
    let effectiveSchoolId = schoolId;
    if (!isSystemAdmin(auth) && !schoolId) {
      const userSchoolIds = getUserSchoolIds(auth);
      // listCurriculumTemplates doesn't support multiple school IDs, so we pass the first one
      effectiveSchoolId = userSchoolIds[0];
    }

    const templates = await listCurriculumTemplates(effectiveSchoolId);
    return NextResponse.json(templates);

  } catch (error) {
    return handleApiError("GET curriculum-templates", error);
  }
}

export async function POST(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "template:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  try {    const { auth } = authResult;

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    // Verify user has access to the school if specified
    if (parsed.data.schoolId && !hasSchoolAccess(auth, parsed.data.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const template = await createCurriculumTemplate(parsed.data);
    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    return handleApiError("POST curriculum-templates", error);
  }
}

