import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    const provided = request.headers.get("x-revalidate-secret") ?? new URL(request.url).searchParams.get("secret");
    if (secret) {
      if (!provided || provided !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Without a configured secret, disallow external use to prevent abuse
      return NextResponse.json({ error: "Revalidation secret not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
