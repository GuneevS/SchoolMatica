import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default("Other"),
  startDate: z.string(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  audience: z.array(z.string()).default(["all"]),
  isAllDay: z.boolean().default(false),
  color: z.string().optional(),
  schoolId: z.string().optional(),
});

/**
 * GET /api/events
 * Get school events with optional date filtering
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "student:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      schoolId,
    };

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (type && type !== "all") {
      where.type = type;
    }

    const events = await prisma.schoolEvent.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: limit,
    });

    // Format events for frontend
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.startDate.toISOString().split("T")[0],
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "17:00",
      location: event.location || "School",
      description: event.description || "",
      audience: parseAudience(event.audience),
      color: event.color || getEventColor(event.type),
      isAllDay: event.isAllDay,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new school event
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "school:manage");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const effectiveSchoolId = data.schoolId || auth.user.schoolId;

    if (!effectiveSchoolId || !hasSchoolAccess(auth, effectiveSchoolId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const event = await prisma.schoolEvent.create({
      data: {
        schoolId: effectiveSchoolId,
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : new Date(data.startDate),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        audience: JSON.stringify(data.audience),
        isAllDay: data.isAllDay,
        color: data.color || getEventColor(data.type),
        createdById: auth.user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
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

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    Meeting: "#8B5CF6",
    Sports: "#10B981",
    Exam: "#EF4444",
    Cultural: "#F59E0B",
    Academic: "#3B82F6",
    Holiday: "#6B7280",
    Other: "#6B7280",
  };
  return colors[type] || colors.Other;
}
