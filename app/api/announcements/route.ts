import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  audience: z.array(z.string()).default(["all"]),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isPinned: z.boolean().default(false),
  schoolId: z.string().optional(),
});

/**
 * GET /api/announcements
 * Get school announcements
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const status = searchParams.get("status") || "Published";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      schoolId,
      status,
    };

    // Only show published announcements that haven't expired
    if (status === "Published") {
      where.OR = [
        { publishAt: null },
        { publishAt: { lte: now } },
      ];
      where.AND = [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    // Format announcements
    const formattedAnnouncements = announcements.map((a: {
      id: string;
      title: string;
      content: string;
      priority: string;
      audience: unknown;
      isPinned: boolean;
      status: string;
      publishAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      createdBy: { displayName: string | null; name: string | null };
    }) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      audience: parseAudience(a.audience),
      isPinned: a.isPinned,
      status: a.status,
      publishAt: a.publishAt?.toISOString(),
      expiresAt: a.expiresAt?.toISOString(),
      createdAt: a.createdAt.toISOString(),
      author: a.createdBy.displayName || a.createdBy.name || "Staff",
    }));

    return NextResponse.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Create a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "school:manage");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const effectiveSchoolId = data.schoolId || auth.user.schoolId;

    if (!effectiveSchoolId || !hasSchoolAccess(auth, effectiveSchoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: effectiveSchoolId,
        title: data.title,
        content: data.content,
        priority: data.priority,
        audience: JSON.stringify(data.audience),
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isPinned: data.isPinned,
        status: "Published",
        createdById: auth.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

function parseAudience(value: unknown): string[] {
  if (!value) return ["all"];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : ["all"];
    } catch {
      return ["all"];
    }
  }
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string");
  }
  return ["all"];
}
