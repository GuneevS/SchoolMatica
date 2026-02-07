import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "avatars");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/profile/picture
 * Upload a new profile picture
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${auth.user.id}-${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Delete old profile picture if exists
    if (auth.user.profilePictureUrl) {
      const oldFilename = auth.user.profilePictureUrl.split("/").pop();
      if (oldFilename) {
        const oldFilepath = join(UPLOAD_DIR, oldFilename);
        try {
          if (existsSync(oldFilepath)) {
            await unlink(oldFilepath);
          }
        } catch {
          // Ignore errors deleting old file
        }
      }
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update user profile
    const profilePictureUrl = `/uploads/avatars/${filename}`;
    const updatedUser = await prisma.appUser.update({
      where: { id: auth.user.id },
      data: { profilePictureUrl },
      select: {
        id: true,
        profilePictureUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      profilePictureUrl: updatedUser.profilePictureUrl,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/picture
 * Remove the current profile picture
 */
export async function DELETE(request: NextRequest) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete file if exists
    if (auth.user.profilePictureUrl) {
      const filename = auth.user.profilePictureUrl.split("/").pop();
      if (filename) {
        const filepath = join(UPLOAD_DIR, filename);
        try {
          if (existsSync(filepath)) {
            await unlink(filepath);
          }
        } catch {
          // Ignore errors deleting file
        }
      }
    }

    // Clear profile picture URL in database
    await prisma.appUser.update({
      where: { id: auth.user.id },
      data: { profilePictureUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    return NextResponse.json(
      { error: "Failed to remove profile picture" },
      { status: 500 }
    );
  }
}
