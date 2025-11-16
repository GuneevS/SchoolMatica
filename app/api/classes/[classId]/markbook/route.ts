import { NextResponse } from "next/server";
import { getClassMarkbookPayload } from "@/lib/markbook";

interface Params {
  params: Promise<{ classId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const { classId } = await params;
  const payload = await getClassMarkbookPayload(classId);
  if (!payload) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}
