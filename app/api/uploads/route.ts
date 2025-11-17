import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
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

