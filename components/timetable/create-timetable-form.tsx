"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClassGroup, Subject, Teacher } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ClassWithSubject = ClassGroup & { subject: Subject | null };

interface Props {
  schoolId: string;
  classes: ClassWithSubject[];
  teachers: Teacher[];
}

export function CreateTimetableForm({ schoolId, classes, teachers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: "",
    year: currentYear,
    term: "T1",
    startDate: "",
    endDate: "",
    cycleType: "Weekly" as "Weekly" | "Rotating" | "Custom",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      // Convert dates to ISO datetime strings
      const startDateTime = formData.startDate ? new Date(formData.startDate + "T00:00:00").toISOString() : new Date().toISOString();
      const endDateTime = formData.endDate ? new Date(formData.endDate + "T23:59:59").toISOString() : new Date().toISOString();
      
      const res = await fetch("/api/timetables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          schoolId,
          year: formData.year,
          term: formData.term,
          startDate: startDateTime,
          endDate: endDateTime,
          cycleType: formData.cycleType,
        }),
      });

      if (res.ok) {
        const timetable = await res.json();
        router.push(`/timetables/${timetable.id}`);
      } else {
        const error = await res.json();
        console.error("Failed to create timetable:", error);
        alert("Failed to create timetable. Please check all fields.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Timetable Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Term 1 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || currentYear })}
                min="2000"
                max="2099"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={formData.term}
                onValueChange={(value) => setFormData({ ...formData, term: value })}
              >
                <SelectTrigger id="term">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Term 1</SelectItem>
                  <SelectItem value="T2">Term 2</SelectItem>
                  <SelectItem value="T3">Term 3</SelectItem>
                  <SelectItem value="T4">Term 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleType">Cycle Type</Label>
              <Select
                value={formData.cycleType}
                onValueChange={(value) => setFormData({ ...formData, cycleType: value as "Weekly" | "Rotating" | "Custom" })}
              >
                <SelectTrigger id="cycleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Rotating">Rotating</SelectItem>
                  <SelectItem value="Custom">Custom Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Timetable"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
