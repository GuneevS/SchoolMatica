import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reorderAssessments } from "@/lib/assessment-service";

interface Params {
  params: Promise<{ planId: string }>;
}

const schema = z.object({
  orderedAssessmentIds: z.array(z.string()).min(1),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { planId } = await params;
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  try {
    await reorderAssessments(planId, parsed.data.orderedAssessmentIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

