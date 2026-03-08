import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAuthContext, hasSchoolAccess, isSystemAdmin } from "@/lib/auth";

const SCHOOL_COOKIE = "sm-school-id";

const selectSchema = z.object({
  schoolId: z.string(),
});

export async function POST(request: NextRequest) {
  // Authenticate the user
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = selectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // CRITICAL: Verify user has access to this school before allowing selection
  if (!isSystemAdmin(auth) && !hasSchoolAccess(auth, parsed.data.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const exists = await prisma.school.count({ where: { id: parsed.data.schoolId } });
  if (!exists) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SCHOOL_COOKIE, parsed.data.schoolId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
