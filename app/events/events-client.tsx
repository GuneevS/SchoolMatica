"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarDays,
  Plus,
  Download,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Activity,
  GraduationCap,
  Trophy,
  Music,
  BookOpen,
  PartyPopper,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SchoolEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  audience: string[];
  color: string;
  isAllDay?: boolean;
}

interface EventsPageClientProps {
  events: SchoolEvent[];
}

const eventTypeIcons: Record<string, React.ReactNode> = {
  Meeting: <Briefcase className="h-4 w-4" />,
  Sports: <Trophy className="h-4 w-4" />,
  Exam: <BookOpen className="h-4 w-4" />,
  Cultural: <Music className="h-4 w-4" />,
  Academic: <GraduationCap className="h-4 w-4" />,
  Holiday: <PartyPopper className="h-4 w-4" />,
  Other: <Calendar className="h-4 w-4" />,
};

const eventTypeColors: Record<string, string> = {
  Meeting: "bg-[hsl(var(--accent-violet))/0.12] text-[hsl(var(--accent-violet))] dark:bg-[hsl(var(--accent-violet))/0.28] dark:text-[hsl(var(--accent-violet))]",
  Sports: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Exam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Cultural: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Academic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Holiday: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  Other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const heroHighlights = [
  { label: "Smart filtering", color: "hsl(var(--accent-iris))" },
  { label: "Calendar sync", color: "hsl(var(--accent-mint))" },
  { label: "Role-based views", color: "hsl(var(--accent-violet))" },
];

export function EventsPageClient({ events }: EventsPageClientProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredEvents = events.filter((event) => {
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesAudience = audienceFilter === "all" || event.audience.includes(audienceFilter) || event.audience.includes("all");
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesAudience && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const exportToICS = (event: SchoolEvent) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SchoolMatica//Events//EN
BEGIN:VEVENT
DTSTART:${event.date.replace(/-/g, "")}T${event.startTime.replace(":", "")}00
DTEND:${event.date.replace(/-/g, "")}T${event.endTime.replace(":", "")}00
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upcomingEvents = filteredEvents.filter(
    (e) => new Date(e.date) >= new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const meetingsCount = events.filter(e => e.type === "Meeting").length;
  const sportsCount = events.filter(e => e.type === "Sports").length;
  const examsCount = events.filter(e => e.type === "Exam").length;

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="School Calendar"
        title={
          <>
            <span className="gradient-text">Events</span> & Calendar
          </>
        }
        description="View all school events, filter by relevance, and sync with your personal calendar. Stay updated on academic, sports, cultural, and administrative events."
        badges={heroHighlights}
        aside={
          <HeroMetricPanel
            title="This month"
            icon={<Activity className="h-4 w-4" />}
            metrics={[
              {
                label: "Upcoming",
                value: upcomingEvents.length.toString(),
                helper: "Events",
                accent: "highlight",
              },
              { label: "Meetings", value: meetingsCount.toString() },
              { label: "Sports", value: sportsCount.toString() },
              { label: "Exams", value: examsCount.toString() },
            ]}
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Meeting">Meetings</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Exam">Exams</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Holiday">Holidays</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="For whom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="grade-10">Grade 10</SelectItem>
                <SelectItem value="grade-11">Grade 11</SelectItem>
                <SelectItem value="grade-12">Grade 12</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
            </div>
            <Button className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {viewMode === "list" ? (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No events found</h3>
                <p className="text-sm text-muted-foreground">
                  {events.length === 0
                    ? "No events have been created yet"
                    : "Try adjusting your filters or search query"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex">
                  <div
                    className={cn(
                      "w-2 shrink-0",
                      event.color === "violet" && "bg-[hsl(var(--accent-violet))]",
                      event.color === "emerald" && "bg-emerald-500",
                      event.color === "red" && "bg-red-500",
                      event.color === "amber" && "bg-amber-500",
                      event.color === "blue" && "bg-blue-500",
                      event.color === "slate" && "bg-slate-400"
                    )}
                  />
                  <CardContent className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={eventTypeColors[event.type] || eventTypeColors.Other}>
                            {eventTypeIcons[event.type] || eventTypeIcons.Other}
                            <span className="ml-1">{event.type}</span>
                          </Badge>
                          {event.audience.includes("all") ? (
                            <Badge variant="outline">All School</Badge>
                          ) : (
                            event.audience.map((a) => (
                              <Badge key={a} variant="outline">
                                {a.replace("grade-", "Grade ")}
                              </Badge>
                            ))
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToICS(event)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentMonth.toLocaleDateString("en-ZA", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Simple calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = i - new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                const dateStr = isCurrentMonth
                  ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                  : "";
                const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] p-1 border rounded",
                      isCurrentMonth ? "bg-background" : "bg-muted/30"
                    )}
                  >
                    {isCurrentMonth && (
                      <>
                        <p className="text-sm font-medium">{dayNum}</p>
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1 rounded truncate cursor-pointer",
                                eventTypeColors[event.type] || eventTypeColors.Other
                              )}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
