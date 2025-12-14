import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";

const allowedPrefixes = [
  "/dashboard",
  "/assessment-plans",
  "/classes",
  "/registrations",
  "/timetables",
  "/reports",
  "/students",
  "/teachers",
  "/schools",
  "/settings",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const isValidPath =
      path.startsWith("/") &&
      !path.includes("..") &&
      !path.includes("//") &&
      allowedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    if (!isValidPath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
