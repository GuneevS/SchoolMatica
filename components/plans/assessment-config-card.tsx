"use client";

import { useState } from "react";
import type { Assessment } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, GripVertical, Trash2, Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AssessmentConfigCardProps {
  assessment: Assessment;
  onUpdate: (data: Partial<Assessment>) => void;
  onDelete: () => void;
  canEdit: boolean;
  dragHandleProps?: any;
  showExample?: boolean;
}

export function AssessmentConfigCard({
  assessment,
  onUpdate,
  onDelete,
  canEdit,
  dragHandleProps,
  showExample = false,
}: AssessmentConfigCardProps) {
  const [localData, setLocalData] = useState({
    taskName: assessment.taskName,
    totalMark: assessment.totalMark,
    rawWeight: assessment.rawWeight,
    term: assessment.term,
  });

  // Calculate example contribution
  const exampleMark = Math.floor(assessment.totalMark * 0.75); // 75% example
  const examplePercent = (exampleMark / assessment.totalMark) * 100;
  const exampleContribution = (examplePercent * assessment.weightPercent) / 100;

  const handleBlur = (field: keyof typeof localData) => {
    if (localData[field] !== assessment[field]) {
      onUpdate({ [field]: localData[field] });
    }
  };

  return (
    <Card className="relative group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {canEdit && dragHandleProps && (
            <button
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={localData.taskName}
                onChange={(e) => setLocalData({ ...localData, taskName: e.target.value })}
                onBlur={() => handleBlur("taskName")}
                disabled={!canEdit}
                className="font-semibold text-lg h-auto py-1 px-2 border-0 focus-visible:ring-1"
                placeholder="Assessment name"
              />
              <Badge variant="outline">{assessment.term}</Badge>
              <Badge variant="secondary">{assessment.weightPercent.toFixed(1)}%</Badge>
            </div>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Marks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs font-medium">
              Total Marks
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The maximum marks for this assessment (e.g., 5, 10, 50, 100)</p>
                    <p className="text-xs text-muted-foreground mt-1">This is independent of the weight!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={localData.totalMark}
              onChange={(e) => setLocalData({ ...localData, totalMark: Number(e.target.value) })}
              onBlur={() => handleBlur("totalMark")}
              disabled={!canEdit}
              min="1"
              className="text-center font-bold text-primary"
            />
            <p className="text-xs text-muted-foreground text-center">marks</p>
          </div>

          {/* Term */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Term</Label>
            <Select
              value={localData.term}
              onValueChange={(value) => {
                setLocalData({ ...localData, term: value as Assessment["term"] });
                onUpdate({ term: value as Assessment["term"] });
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["T1", "T2", "T3", "T4"] as const).map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground text-center">period</p>
          </div>

          {/* Raw Weight */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs font-medium">
              Weight Value
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The importance/weight of this assessment</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher values = more contribution to final grade
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={localData.rawWeight}
              onChange={(e) => setLocalData({ ...localData, rawWeight: Number(e.target.value) })}
              onBlur={() => handleBlur("rawWeight")}
              disabled={!canEdit}
              min="0"
              step="0.5"
              className="text-center font-bold text-emerald-600"
            />
            <p className="text-xs text-muted-foreground text-center">→ {assessment.weightPercent.toFixed(1)}%</p>
          </div>
        </div>

        {/* Visual Example */}
        {showExample && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Calculator className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Example Calculation:</p>
              <div className="space-y-0.5 text-blue-800 dark:text-blue-200">
                <p>• Student scores: <strong>{exampleMark}/{assessment.totalMark}</strong> marks</p>
                <p>• Percentage: <strong>{examplePercent.toFixed(1)}%</strong></p>
                <p>• Weight: <strong>{assessment.weightPercent.toFixed(1)}%</strong> of term</p>
                <p className="text-blue-600 dark:text-blue-300">
                  → Contributes: <strong>{exampleContribution.toFixed(2)}%</strong> to final grade
                </p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 italic mt-2">
                💡 A quiz out of 5 can be worth 90% if you set the weight high!
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Contribution Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Contribution to Term</span>
            <span className="font-semibold text-primary">{assessment.weightPercent.toFixed(1)}%</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(assessment.weightPercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
