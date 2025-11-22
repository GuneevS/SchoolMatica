"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, BookOpen } from "lucide-react";
import type { Timetable, TimetablePeriod, TimetableSlot, ClassGroup, Teacher, Subject, AssessmentPlan } from "@prisma/client";

type TimetableSlotWithRelations = TimetableSlot & {
  classGroup: ClassGroup & { subject: Subject | null };
  teacher: Teacher | null;
  period: TimetablePeriod;
  assessmentPlan: AssessmentPlan | null;
};

type TimetablePeriodWithSlots = TimetablePeriod & {
  slots: TimetableSlotWithRelations[];
};

interface TimetableGridProps {
  timetable: Timetable & {
    periods: TimetablePeriodWithSlots[];
    slots: TimetableSlotWithRelations[];
  };
  onSlotClick?: (slot: TimetableSlotWithRelations) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function TimetableGrid({ timetable, onSlotClick }: TimetableGridProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  const periodsByDay = timetable.periods.reduce((acc, period) => {
    if (!acc[period.dayOfWeek]) {
      acc[period.dayOfWeek] = [];
    }
    acc[period.dayOfWeek].push(period);
    return acc;
  }, {} as Record<number, TimetablePeriodWithSlots[]>);

  Object.keys(periodsByDay).forEach((day) => {
    periodsByDay[Number(day)].sort((a, b) => a.periodNumber - b.periodNumber);
  });

  const getSlotForPeriod = (periodId: string) => {
    return timetable.slots.find((slot) => slot.periodId === periodId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {timetable.name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{timetable.term}</Badge>
              <Badge variant="outline">{timetable.year}</Badge>
              <Badge>{timetable.status}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day, index) => (
          <Button
            key={day}
            variant={selectedDay === index ? "default" : "outline"}
            onClick={() => setSelectedDay(index)}
            className="flex-shrink-0"
          >
            {day}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {periodsByDay[selectedDay]?.map((period) => {
          const slot = getSlotForPeriod(period.id);
          
          return (
            <Card
              key={period.id}
              className={`transition-all hover:shadow-md ${slot ? "cursor-pointer border-l-4 border-l-primary" : "border-dashed"}`}
              onClick={() => slot && onSlotClick?.(slot)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        Period {period.periodNumber}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {period.startTime} - {period.endTime}
                      </div>
                    </div>

                    {slot ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold text-lg">
                              {slot.classGroup.name}
                            </p>
                            {slot.classGroup.subject && (
                              <p className="text-sm text-muted-foreground">
                                {slot.classGroup.subject.name}
                              </p>
                            )}
                          </div>
                        </div>

                        {slot.teacher && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {slot.teacher.firstName} {slot.teacher.lastName}
                            </span>
                          </div>
                        )}

                        {slot.room && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.room}</span>
                          </div>
                        )}

                        {slot.assessmentPlan && (
                          <Badge variant="outline" className="bg-purple-50">
                            Linked to Assessment Plan
                          </Badge>
                        )}

                        {slot.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No class scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!periodsByDay[selectedDay] || periodsByDay[selectedDay].length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No periods scheduled for {DAYS[selectedDay]}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
