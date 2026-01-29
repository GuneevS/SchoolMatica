import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EventsPageClient } from "./events-client";

export default async function EventsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const schoolId = auth.user.schoolId;
  if (!schoolId) redirect("/login");

  // Fetch school events
  const events = await prisma.schoolEvent.findMany({
    where: {
      schoolId,
      status: { not: "Cancelled" },
    },
    orderBy: { startDate: "asc" },
  });

  // Transform data for the client component
  const transformedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    type: event.eventType,
    date: event.startDate.toISOString().split("T")[0],
    startTime: event.startTime || "00:00",
    endTime: event.endTime || "23:59",
    location: event.location || "",
    description: event.description || "",
    audience: (event.audience as string[]) || ["all"],
    color: getEventColor(event.eventType),
    isAllDay: event.isAllDay,
  }));

  return <EventsPageClient events={transformedEvents} />;
}

function getEventColor(eventType: string): string {
  const colors: Record<string, string> = {
    Meeting: "violet",
    Sports: "emerald",
    Exam: "red",
    Cultural: "amber",
    Academic: "blue",
    Holiday: "slate",
    Other: "slate",
  };
  return colors[eventType] || "slate";
}
