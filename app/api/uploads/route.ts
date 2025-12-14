import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { authorizeWithSchool } from "@/lib/auth";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const maxUploadBytes = 10 * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "assessmentDocument:upload");
  if ("error" in authResult) {
    return authResult.error;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }

  const ext = path.extname(file.name).toLowerCase() || "";
  if (!allowedExtensions.has(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.type && !allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "MIME type not allowed" }, { status: 400 });
  }

  await mkdir(uploadsDir, { recursive: true });
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

