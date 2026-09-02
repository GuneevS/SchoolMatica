"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "Meeting", label: "Meeting", color: "bg-[hsl(var(--accent-violet))/0.15] text-[hsl(var(--accent-violet))]" },
  { value: "Sports", label: "Sports Day / Match", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "Exam", label: "Exam / Assessment", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { value: "Cultural", label: "Cultural / Arts", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "Academic", label: "Academic", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "Holiday", label: "Holiday / Closure", color: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200" },
  { value: "Other", label: "Other", color: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Entire School" },
  { value: "teachers", label: "Teachers Only" },
  { value: "parents", label: "Parents Only" },
  { value: "grade-r", label: "Grade R" },
  { value: "grade-1", label: "Grade 1" },
  { value: "grade-2", label: "Grade 2" },
  { value: "grade-3", label: "Grade 3" },
  { value: "grade-4", label: "Grade 4" },
  { value: "grade-5", label: "Grade 5" },
  { value: "grade-6", label: "Grade 6" },
  { value: "grade-7", label: "Grade 7" },
  { value: "grade-8", label: "Grade 8" },
  { value: "grade-9", label: "Grade 9" },
  { value: "grade-10", label: "Grade 10" },
  { value: "grade-11", label: "Grade 11" },
  { value: "grade-12", label: "Grade 12" },
];

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export function CreateEventDialog({ open, onOpenChange, schoolId }: CreateEventDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Meeting");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("15:00");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<string[]>(["all"]);

  function toggleAudience(value: string) {
    if (value === "all") {
      setSelectedAudience(["all"]);
      return;
    }
    setSelectedAudience((prev) => {
      const without = prev.filter((a) => a !== "all");
      if (without.includes(value)) {
        const result = without.filter((a) => a !== value);
        return result.length === 0 ? ["all"] : result;
      }
      return [...without, value];
    });
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setEventType("Meeting");
    setStartDate("");
    setEndDate("");
    setStartTime("08:00");
    setEndTime("15:00");
    setLocation("");
    setIsAllDay(false);
    setSelectedAudience(["all"]);
    setError(null);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Event title is required");
      return;
    }
    if (!startDate) {
      setError("Start date is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type: eventType,
          startDate,
          endDate: endDate || startDate,
          startTime: isAllDay ? undefined : startTime,
          endTime: isAllDay ? undefined : endTime,
          location: location.trim() || undefined,
          audience: selectedAudience,
          isAllDay,
          schoolId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to create event"
        );
      }

      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedType = EVENT_TYPES.find((t) => t.value === eventType);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[hsl(var(--accent-iris))]" />
            Create School Event
          </DialogTitle>
          <DialogDescription>
            Add a new event to the school calendar. Parents, teachers, and students will be notified based on the audience you select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title *</Label>
            <Input
              id="event-title"
              placeholder="e.g. Grade 12 Trial Exams, Staff Meeting, Inter-House Athletics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", type.color)}>{type.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <Badge className={cn("text-xs", selectedType.color)}>{selectedType.label}</Badge>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-start-date">Start Date *</Label>
              <Input
                id="event-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-date">End Date</Label>
              <Input
                id="event-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="all-day"
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label htmlFor="all-day" className="text-sm">All-day event</Label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start-time">Start Time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end-time">End Time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location" className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <Input
              id="event-location"
              placeholder="e.g. School Hall, Sports Field, Staff Room"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              placeholder="Add details about this event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label>Audience</Label>
            <p className="text-xs text-muted-foreground">
              Who should see this event? Select one or more groups.
            </p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedAudience.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:shadow-sm"
                  onClick={() => toggleAudience(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
