import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCurriculumTemplates, createCurriculumTemplate } from "@/lib/domain/templates";

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
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const templates = await listCurriculumTemplates(schoolId);
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const template = await createCurriculumTemplate(parsed.data);
  return NextResponse.json(template, { status: 201 });
}

