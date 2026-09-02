import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { authorizeWithSchool, hasSchoolAccess, getPrimarySchoolId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export async function POST(request: NextRequest) {
  // Require assessmentDocument:upload permission for file uploads
  const result = await authorizeWithSchool(request, "assessmentDocument:upload");
  if ("error" in result) {
    return result.error;
  }

  try {
    const { auth } = result;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Get schoolId from form data, fallback to user's primary school
    const schoolIdFromForm = formData.get("schoolId");
    const schoolId = typeof schoolIdFromForm === "string"
      ? schoolIdFromForm
      : await getPrimarySchoolId(auth);

    if (!schoolId) {
      return NextResponse.json({ error: "School context required" }, { status: 400 });
    }

    // Verify user has access to the specified school
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
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
      schoolId, // Include schoolId for tracking which school owns this file
    });

  } catch (error) {
    return handleApiError("POST uploads", error);
  }
}

