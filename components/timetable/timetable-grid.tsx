"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, LayoutGrid, List } from "lucide-react";
import type { Timetable, TimetablePeriod, TimetableSlot, ClassGroup, Subject, AssessmentPlan, Teacher } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

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
  onEmptySlotClick?: (period: TimetablePeriod) => void;
  highlightClassId?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const isBreakPeriod = (period?: TimetablePeriod | null) => {
  if (!period?.name) return false;
  const lower = period.name.toLowerCase();
  return lower.includes("break") || lower.includes("lunch");
};

function DroppableGridCell({ period, slot, isBreak, isDimmed, onSlotClick, onEmptySlotClick }: {
  period: TimetablePeriod;
  slot: TimetableSlotWithRelations | null;
  isBreak: boolean;
  isDimmed: boolean;
  onSlotClick?: (slot: TimetableSlotWithRelations) => void;
  onEmptySlotClick?: (period: TimetablePeriod) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `period-${period.id}`,
    data: { type: 'period', period },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-2 border-r last:border-0 min-h-[120px] relative group/cell transition-colors",
        isOver && !slot && !isBreak && "bg-primary/10 ring-2 ring-primary ring-inset"
      )}
    >
      {slot ? (
        <div 
          onClick={() => onSlotClick?.(slot)}
          className={cn(
            "h-full w-full rounded-lg bg-primary/5 border border-primary/10 p-3 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all hover:shadow-sm flex flex-col gap-1",
            isDimmed && "opacity-50 hover:opacity-80",
          )}
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
      ) : isBreak ? (
        <div className="h-full w-full rounded-lg border border-dashed border-amber-400/40 bg-amber-500/10 flex items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            {period.name}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onEmptySlotClick?.(period)}
          className={cn(
            "h-full w-full rounded-lg border border-dashed border-transparent flex items-center justify-center transition",
            isOver 
              ? "border-primary bg-primary/10 text-primary" 
              : onEmptySlotClick
                ? "hover:border-primary/40 hover:bg-primary/5 text-primary/80"
                : "text-muted-foreground/40"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider">
            {isOver ? "Drop here" : onEmptySlotClick ? "Add class" : "Free"}
          </span>
        </button>
      )}
    </div>
  );
}

function DroppableDayCard({ period, slot, isBreak, isDimmed, onSlotClick, onEmptySlotClick }: {
  period: TimetablePeriod;
  slot: TimetableSlotWithRelations | null;
  isBreak: boolean;
  isDimmed: boolean;
  onSlotClick?: (slot: TimetableSlotWithRelations) => void;
  onEmptySlotClick?: (period: TimetablePeriod) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `period-${period.id}`,
    data: { type: 'period', period },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-all hover:shadow-md border-l-4",
        slot && !isBreak ? "cursor-pointer border-l-primary" : "border-l-transparent border-dashed opacity-70",
        isDimmed && "opacity-50 hover:opacity-80",
        isOver && !slot && !isBreak && "bg-primary/5 border-primary ring-2 ring-primary ring-inset"
      )}
      onClick={() => {
        if (slot) {
          onSlotClick?.(slot);
        } else if (!isBreak) {
          onEmptySlotClick?.(period);
        }
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
            <div className="flex flex-col items-center justify-center min-w-[100px] py-2 bg-muted/30 rounded-lg">
                <span className="text-2xl font-bold text-foreground">{period.startTime}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Period {period.periodNumber}</span>
            </div>

        <div className="flex-1 space-y-3">
            {isBreak ? (
              <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                {period.name}
              </div>
            ) : slot ? (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-primary">
                            {slot.classGroup.subject?.name || slot.classGroup.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{slot.classGroup.name}</p>
                    </div>
                    {slot.assessmentPlan && (
                        <Badge variant="outline" className="bg-[hsl(var(--accent-iris))/0.12] text-[hsl(var(--accent-iris))] border-[hsl(var(--accent-iris))/0.3]">
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
                <p className="text-sm">
                  {isOver ? "Drop Subject Here" : onEmptySlotClick ? "Click to add a class" : "No class scheduled"}
                </p>
            </div>
            )}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimetableGrid({ timetable, onSlotClick, onEmptySlotClick, highlightClassId }: TimetableGridProps) {
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
                 <div className="w-full min-w-[600px]">
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
                                         const slot = period ? (getSlotForPeriod(period.id) ?? null) : null;
                                         
                                         const isBreak = isBreakPeriod(period);
                                         const isDimmed = Boolean(highlightClassId && slot && slot.classGroupId !== highlightClassId);

                                         return period ? (
                                             <DroppableGridCell
                                               key={dayIndex}
                                               period={period}
                                               slot={slot}
                                               isBreak={isBreak}
                                               isDimmed={isDimmed}
                                               onSlotClick={onSlotClick}
                                               onEmptySlotClick={onEmptySlotClick}
                                             />
                                         ) : (
                                             <div key={dayIndex} className="p-2 border-r last:border-0 min-h-[120px] relative group/cell">
                                                <div className="h-full w-full bg-muted/10 pattern-diagonal-lines pattern-muted/20"></div>
                                             </div>
                                         );
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
                const slot = getSlotForPeriod(period.id) ?? null;
                const isBreak = isBreakPeriod(period);
                const isDimmed = Boolean(highlightClassId && slot && slot.classGroupId !== highlightClassId);
                
                return (
                    <DroppableDayCard
                        key={period.id}
                        period={period}
                        slot={slot}
                        isBreak={isBreak}
                        isDimmed={isDimmed}
                        onSlotClick={onSlotClick}
                        onEmptySlotClick={onEmptySlotClick}
                    />
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
