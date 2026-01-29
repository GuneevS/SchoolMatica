"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  Plus,
  Trash2,
  Save,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationThreshold {
  id: string;
  points: number;
  name: string;
  description: string;
  notifyParent: boolean;
  notifyHOD: boolean;
  notifyPrincipal: boolean;
  sendEmail: boolean;
  action: string;
  color: string;
}

interface ThresholdConfigProps {
  schoolId: string;
  initialThresholds?: NotificationThreshold[];
  onSave?: (thresholds: NotificationThreshold[]) => Promise<void>;
}

const defaultThresholds: NotificationThreshold[] = [
  {
    id: "1",
    points: 5,
    name: "First Warning",
    description: "Initial warning level - student needs attention",
    notifyParent: true,
    notifyHOD: false,
    notifyPrincipal: false,
    sendEmail: true,
    action: "warning",
    color: "amber",
  },
  {
    id: "2",
    points: 10,
    name: "Serious Concern",
    description: "Student behaviour requires intervention",
    notifyParent: true,
    notifyHOD: true,
    notifyPrincipal: false,
    sendEmail: true,
    action: "detention",
    color: "orange",
  },
  {
    id: "3",
    points: 15,
    name: "Critical Level",
    description: "Immediate disciplinary action required",
    notifyParent: true,
    notifyHOD: true,
    notifyPrincipal: true,
    sendEmail: true,
    action: "suspension_warning",
    color: "red",
  },
  {
    id: "4",
    points: 20,
    name: "Maximum Level",
    description: "Disciplinary hearing may be required",
    notifyParent: true,
    notifyHOD: true,
    notifyPrincipal: true,
    sendEmail: true,
    action: "hearing",
    color: "red",
  },
];

const actionOptions = [
  { value: "warning", label: "Written Warning" },
  { value: "parent_meeting", label: "Parent Meeting Required" },
  { value: "detention", label: "Detention" },
  { value: "community_service", label: "Community Service" },
  { value: "suspension_warning", label: "Suspension Warning" },
  { value: "hearing", label: "Disciplinary Hearing" },
];

const colorOptions = [
  { value: "amber", label: "Amber (Warning)", className: "bg-amber-500" },
  { value: "orange", label: "Orange (Serious)", className: "bg-orange-500" },
  { value: "red", label: "Red (Critical)", className: "bg-red-500" },
];

export function ThresholdConfig({ schoolId, initialThresholds, onSave }: ThresholdConfigProps) {
  const [thresholds, setThresholds] = useState<NotificationThreshold[]>(
    initialThresholds || defaultThresholds
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addThreshold = () => {
    const maxPoints = Math.max(...thresholds.map((t) => t.points), 0);
    const newThreshold: NotificationThreshold = {
      id: Date.now().toString(),
      points: maxPoints + 5,
      name: "New Threshold",
      description: "",
      notifyParent: true,
      notifyHOD: false,
      notifyPrincipal: false,
      sendEmail: true,
      action: "warning",
      color: "amber",
    };
    setThresholds([...thresholds, newThreshold]);
    setEditingId(newThreshold.id);
  };

  const removeThreshold = (id: string) => {
    setThresholds(thresholds.filter((t) => t.id !== id));
  };

  const updateThreshold = (id: string, updates: Partial<NotificationThreshold>) => {
    setThresholds(
      thresholds.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(thresholds);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Sort thresholds by points
  const sortedThresholds = [...thresholds].sort((a, b) => a.points - b.points);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Demerit Notification Thresholds
            </CardTitle>
            <CardDescription>
              Configure automatic notifications when students reach demerit point levels
            </CardDescription>
          </div>
          <Button onClick={addThreshold} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Threshold
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual threshold timeline */}
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full" />
          <div className="flex justify-between mt-2">
            {sortedThresholds.map((threshold) => (
              <div
                key={threshold.id}
                className="flex flex-col items-center"
                style={{
                  position: "absolute",
                  left: `${Math.min((threshold.points / 25) * 100, 100)}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 border-white shadow-md -mt-3",
                  threshold.color === "amber" && "bg-amber-500",
                  threshold.color === "orange" && "bg-orange-500",
                  threshold.color === "red" && "bg-red-500"
                )} />
                <span className="text-xs font-medium mt-1">{threshold.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold cards */}
        <div className="space-y-4 mt-8">
          {sortedThresholds.map((threshold) => (
            <div
              key={threshold.id}
              className={cn(
                "p-4 border rounded-lg transition-all",
                editingId === threshold.id ? "border-primary shadow-md" : "hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                    threshold.color === "amber" && "bg-amber-500",
                    threshold.color === "orange" && "bg-orange-500",
                    threshold.color === "red" && "bg-red-500"
                  )}>
                    {threshold.points}
                  </div>
                  <div>
                    <p className="font-semibold">{threshold.name}</p>
                    <p className="text-sm text-muted-foreground">{threshold.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === threshold.id ? null : threshold.id)}
                  >
                    {editingId === threshold.id ? "Close" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeThreshold(threshold.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notification indicators */}
              <div className="flex gap-2 mt-3">
                {threshold.notifyParent && (
                  <Badge variant="outline" className="text-xs">Parent</Badge>
                )}
                {threshold.notifyHOD && (
                  <Badge variant="outline" className="text-xs">HOD</Badge>
                )}
                {threshold.notifyPrincipal && (
                  <Badge variant="outline" className="text-xs">Principal</Badge>
                )}
                {threshold.sendEmail && (
                  <Badge variant="outline" className="text-xs">Email</Badge>
                )}
                <Badge className={cn(
                  "text-xs",
                  threshold.color === "amber" && "bg-amber-500",
                  threshold.color === "orange" && "bg-orange-500",
                  threshold.color === "red" && "bg-red-500"
                )}>
                  {actionOptions.find((a) => a.value === threshold.action)?.label || threshold.action}
                </Badge>
              </div>

              {/* Edit form */}
              {editingId === threshold.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`points-${threshold.id}`}>Points Threshold</Label>
                      <Input
                        id={`points-${threshold.id}`}
                        type="number"
                        min={1}
                        max={100}
                        value={threshold.points}
                        onChange={(e) => updateThreshold(threshold.id, { points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`name-${threshold.id}`}>Threshold Name</Label>
                      <Input
                        id={`name-${threshold.id}`}
                        value={threshold.name}
                        onChange={(e) => updateThreshold(threshold.id, { name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`desc-${threshold.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${threshold.id}`}
                      value={threshold.description}
                      onChange={(e) => updateThreshold(threshold.id, { description: e.target.value })}
                      placeholder="Describe what happens at this threshold..."
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`action-${threshold.id}`}>Action</Label>
                      <Select
                        value={threshold.action}
                        onValueChange={(value) => updateThreshold(threshold.id, { action: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`color-${threshold.id}`}>Severity Color</Label>
                      <Select
                        value={threshold.color}
                        onValueChange={(value) => updateThreshold(threshold.id, { color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", opt.className)} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Notification Recipients</Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`parent-${threshold.id}`}
                          checked={threshold.notifyParent}
                          onCheckedChange={(checked) => updateThreshold(threshold.id, { notifyParent: checked === true })}
                        />
                        <Label htmlFor={`parent-${threshold.id}`} className="cursor-pointer">
                          Notify Parent
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`hod-${threshold.id}`}
                          checked={threshold.notifyHOD}
                          onCheckedChange={(checked) => updateThreshold(threshold.id, { notifyHOD: checked === true })}
                        />
                        <Label htmlFor={`hod-${threshold.id}`} className="cursor-pointer">
                          Notify HOD
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`principal-${threshold.id}`}
                          checked={threshold.notifyPrincipal}
                          onCheckedChange={(checked) => updateThreshold(threshold.id, { notifyPrincipal: checked === true })}
                        />
                        <Label htmlFor={`principal-${threshold.id}`} className="cursor-pointer">
                          Notify Principal
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`email-${threshold.id}`}
                          checked={threshold.sendEmail}
                          onCheckedChange={(checked) => updateThreshold(threshold.id, { sendEmail: checked === true })}
                        />
                        <Label htmlFor={`email-${threshold.id}`} className="cursor-pointer">
                          Send Email
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
