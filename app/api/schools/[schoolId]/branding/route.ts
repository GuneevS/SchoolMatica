import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const colorSchema = z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/);

const brandingSchema = z.object({
  logoUrl: z.string().max(150000).optional().nullable(),
  primary: colorSchema.optional().nullable(),
  secondary: colorSchema.optional().nullable(),
  accent: colorSchema.optional().nullable(),
});

interface Params {
  params: Promise<{ schoolId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const result = await authorizeWithSchool(request, "school:read", schoolId);
  if ("error" in result) {
    return result.error;
  }
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, branding: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: school.id,
      name: school.name,
      branding: school.branding ?? null,
    });
  } catch (error) {
    return handleApiError("GET schools/[schoolId]/branding", error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const result = await authorizeWithSchool(request, "school:update", schoolId);
  if ("error" in result) {
    return result.error;
  }
  try {
    const json = await request.json();
    const parsed = brandingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const logoUrl = parsed.data.logoUrl?.trim();

    const branding = {
      logoUrl: logoUrl ? logoUrl : null,
      primary: parsed.data.primary ?? null,
      secondary: parsed.data.secondary ?? null,
      accent: parsed.data.accent ?? null,
    };

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: { branding },
      select: { id: true, branding: true },
    });

    return NextResponse.json(school);
  } catch (error) {
    return handleApiError("PATCH schools/[schoolId]/branding", error);
  }
}
