import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getAuthContext } from "@/lib/auth";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  await mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const fileName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    fileName,
    mimeType: file.type,
    url: `/uploads/${fileName}`,
    storageKey: fileName,
  });
}

