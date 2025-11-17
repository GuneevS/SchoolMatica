import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SCHOOL_COOKIE = "sm-school-id";

export async function POST(request: NextRequest) {
  const { schoolId } = await request.json();
  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }
  const exists = await prisma.school.count({ where: { id: schoolId } });
  if (!exists) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(SCHOOL_COOKIE, schoolId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return response;
}

