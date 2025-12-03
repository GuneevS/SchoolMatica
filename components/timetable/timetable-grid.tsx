"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, LayoutGrid, List } from "lucide-react";
import type { Timetable, TimetablePeriod, TimetableSlot, ClassGroup, Subject, AssessmentPlan, Teacher } from "@prisma/client";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [selectedDay, setSelectedDay] = useState(0);

  const periodsByDay = timetable.periods.reduce((acc, period) => {
    if (!acc[period.dayOfWeek]) {
      acc[period.dayOfWeek] = [];
    }
    acc[period.dayOfWeek].push(period);
    return acc;
  }, {} as Record<number, TimetablePeriodWithSlots[]>);

  // Normalize periods for the week view (assuming standard structure)
  const periodNumbers = Array.from(new Set(timetable.periods.map(p => p.periodNumber))).sort((a, b) => a - b);

  const getPeriod = (dayIndex: number, pNum: number) => {
    return periodsByDay[dayIndex]?.find(p => p.periodNumber === pNum);
  };

  const getSlotForPeriod = (periodId: string) => {
    return timetable.slots.find((slot) => slot.periodId === periodId);
  };

  // Sort periods for day view
  Object.keys(periodsByDay).forEach((day) => {
    periodsByDay[Number(day)].sort((a, b) => a.periodNumber - b.periodNumber);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h2 className="text-lg font-semibold tracking-tight">{timetable.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="font-normal">{timetable.term}</Badge>
                    <span>{timetable.year}</span>
                    <span className="text-xs">•</span>
                    <Badge variant={timetable.status === "Active" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
                        {timetable.status}
                    </Badge>
                </div>
            </div>
        </div>
        
        <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            <Button 
                variant={viewMode === "day" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("day")}
                className="gap-2 h-8"
            >
                <List className="h-3.5 w-3.5" />
                Day
            </Button>
            <Button 
                variant={viewMode === "week" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("week")}
                className="gap-2 h-8"
            >
                <LayoutGrid className="h-3.5 w-3.5" />
                Week
            </Button>
        </div>
      </div>

      {viewMode === "week" ? (
         <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
             <div className="overflow-x-auto">
                 <div className="min-w-[800px]">
                     {/* Header Row */}
                     <div className="grid grid-cols-6 border-b bg-muted/30">
                         <div className="p-4 font-medium text-muted-foreground text-center text-sm border-r">Time</div>
                         {DAYS.map((day, i) => (
                             <div key={day} className={cn("p-4 font-medium text-center text-sm border-r last:border-0", selectedDay === i && "bg-primary/5 text-primary")}>
                                 {day}
                             </div>
                         ))}
                     </div>
                     
                     {/* Grid Body */}
                     <div className="divide-y">
                         {periodNumbers.map((pNum) => {
                             // Get time from first available period of this number
                             const referencePeriod = timetable.periods.find(p => p.periodNumber === pNum);
                             
                             return (
                                 <div key={pNum} className="grid grid-cols-6 hover:bg-muted/5 transition-colors group/row">
                                     {/* Time Column */}
                                     <div className="p-3 border-r text-xs text-muted-foreground flex flex-col justify-center items-center bg-muted/10">
                                         <span className="font-mono">{referencePeriod?.startTime}</span>
                                         <div className="h-8 w-px bg-border/50 my-1"></div>
                                         <span className="font-mono text-muted-foreground/70">{referencePeriod?.endTime}</span>
                                     </div>
                                     
                                     {/* Days Columns */}
                                     {DAYS.map((_, dayIndex) => {
                                         const period = getPeriod(dayIndex, pNum);
                                         const slot = period ? getSlotForPeriod(period.id) : null;
                                         
                                         return (
                                             <div key={dayIndex} className="p-2 border-r last:border-0 min-h-[120px] relative group/cell">
                                                 {slot ? (
                                                     <div 
                                                       onClick={() => onSlotClick?.(slot)}
                                                        className="h-full w-full rounded-lg bg-primary/5 border border-primary/10 p-3 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all hover:shadow-sm flex flex-col gap-1"
                                                     >
                                                         <div className="flex items-start justify-between">
                                                            <span className="font-semibold text-sm text-primary line-clamp-1">
                                                                {slot.classGroup.subject?.name || slot.classGroup.name}
                                                            </span>
                                                            {slot.assessmentPlan && (
                                                                <div className="h-1.5 w-1.5 rounded-full bg-accent-mint animate-pulse" title="Assessment Scheduled" />
                                                            )}
                                                         </div>
                                                         
                                                         <div className="mt-auto space-y-1">
                                                             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <User className="h-3 w-3" />
                                                                <span className="line-clamp-1">
                                                                    {slot.teacher ? `${slot.teacher.firstName[0]}. ${slot.teacher.lastName}` : 'No Teacher'}
                                                                </span>
                                                             </div>
                                                             {slot.room && (
                                                                 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>{slot.room}</span>
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     period ? (
                                                         <div className="h-full w-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                             <span className="text-xs text-muted-foreground/40 font-medium uppercase tracking-wider">Free</span>
                                                         </div>
                                                     ) : (
                                                         <div className="h-full w-full bg-muted/10 pattern-diagonal-lines pattern-muted/20"></div>
                                                     )
                                                 )}
                                             </div>
                                         )
                                     })}
                                 </div>
                             )
                         })}
                     </div>
                 </div>
             </div>
         </div>
      ) : (
         // Day View
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {DAYS.map((day, index) => (
                <Button
                    key={day}
                    variant={selectedDay === index ? "default" : "outline"}
                    onClick={() => setSelectedDay(index)}
                    className="flex-shrink-0 rounded-full px-6"
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
                    className={cn(
                        "transition-all hover:shadow-md border-l-4",
                        slot ? "cursor-pointer border-l-primary" : "border-l-transparent border-dashed opacity-70"
                    )}
                    onClick={() => slot && onSlotClick?.(slot)}
                    >
                    <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="flex flex-col items-center justify-center min-w-[100px] py-2 bg-muted/30 rounded-lg">
                                <span className="text-2xl font-bold text-foreground">{period.startTime}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Period {period.periodNumber}</span>
                            </div>

                        <div className="flex-1 space-y-3">
                            {slot ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-primary">
                                            {slot.classGroup.subject?.name || slot.classGroup.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{slot.classGroup.name}</p>
                                    </div>
                                    {slot.assessmentPlan && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            Assessment
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 pt-2">
                                    {slot.teacher && (
                                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                        {slot.teacher.firstName} {slot.teacher.lastName}
                                        </span>
                                    </div>
                                    )}

                                    {slot.room && (
                                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{slot.room}</span>
                                    </div>
                                    )}
                                </div>

                                {slot.notes && (
                                <p className="text-sm text-muted-foreground italic bg-yellow-50/50 p-2 rounded border border-yellow-100/50">
                                    {slot.notes}
                                </p>
                                )}
                            </div>
                            ) : (
                            <div className="py-4 text-muted-foreground">
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
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">
                    No periods scheduled for {DAYS[selectedDay]}
                    </p>
                </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
}
