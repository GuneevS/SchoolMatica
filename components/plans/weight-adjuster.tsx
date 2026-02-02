"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Scale, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { normaliseWeights } from "@/lib/calculations";
import type { Assessment } from "@prisma/client";

interface Props {
  assessments: Assessment[];
  onSave: (updates: { id: string; rawWeight: number }[]) => Promise<void>;
  readOnly?: boolean;
}

export function WeightAdjuster({ assessments, onSave, readOnly = false }: Props) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(assessments.map((a) => [a.id, a.rawWeight]))
  );
  const [saving, setSaving] = useState(false);

  // Calculate normalized weights in real-time
  const normalized = useMemo(() => {
    const withWeights = assessments.map((a) => ({
      ...a,
      rawWeight: weights[a.id] ?? a.rawWeight,
    }));
    return normaliseWeights(withWeights);
  }, [assessments, weights]);

  const totalRaw = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const totalPercent = normalized.map(a => a.weightPercent || 0).reduce((sum, w) => sum + w, 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;

  const handleWeightChange = (id: string, value: number) => {
    setWeights((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = assessments.map((a) => ({
        id: a.id,
        rawWeight: weights[a.id] ?? a.rawWeight,
      }));
      await onSave(updates);
      // Force refresh to show updated values
      window.location.reload();
    } catch (error) {
      console.error("Failed to save assessment weights:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(Object.fromEntries(assessments.map((a) => [a.id, a.rawWeight])));
  };

  const hasChanges = assessments.some((a) => weights[a.id] !== a.rawWeight);

  return (
    <TooltipProvider>
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-cobalt))/0.12] via-[hsl(var(--accent-iris))/0.12] to-[hsl(var(--accent-flamingo))/0.12]">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Assessment Weight Distribution
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-auto">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Adjust the raw weights for each assessment. The system automatically normalizes them to
                  percentages that sum to 100%. Higher raw weights = higher contribution to final mark.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-[hsl(var(--accent-cobalt))/0.12] to-[hsl(var(--accent-iris))/0.12] border-[hsl(var(--accent-cobalt))/0.25]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Raw Weight</p>
                  <p className="text-3xl font-bold text-[hsl(var(--accent-cobalt))]">{totalRaw.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[hsl(var(--accent-iris))/0.12] to-[hsl(var(--accent-flamingo))/0.12] border-[hsl(var(--accent-iris))/0.25]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Normalized Total</p>
                  <p className="text-3xl font-bold text-[hsl(var(--accent-iris))]">{totalPercent.toFixed(2)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[hsl(var(--accent-mint))/0.12] to-[hsl(var(--accent-iris))/0.12] border-[hsl(var(--accent-mint))/0.25]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {isValid ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-[hsl(var(--accent-mint))]" />
                        <p className="text-lg font-semibold text-[hsl(var(--accent-mint))]">Valid</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-6 w-6 text-[hsl(var(--accent-gold))]" />
                        <p className="text-lg font-semibold text-[hsl(var(--accent-gold))]">Adjusting</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isValid && (
            <Alert className="bg-[hsl(var(--accent-gold))/0.12] border-[hsl(var(--accent-gold))/0.3]">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--accent-gold))]" />
              <AlertDescription className="text-[hsl(var(--accent-gold))]">
                Weights are being automatically normalized. The system ensures all percentages sum to exactly 100%.
              </AlertDescription>
            </Alert>
          )}

          {/* Weight Adjusters */}
          <div className="space-y-4">
            {normalized.map((assessment, index) => {
              const rawWeight = weights[assessment.id] ?? assessment.rawWeight;
              const contribution = (assessment.weightPercent / 100) * totalPercent;
              
              return (
                <Card
                  key={assessment.id}
                  className="group hover:shadow-md transition-all duration-200 border-l-4"
                  style={{
                    borderLeftColor: `hsl(${(index * 360) / normalized.length}, 70%, 50%)`,
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-semibold text-base">{assessment.taskName}</Label>
                            {assessment.isPatComponent && (
                              <span className="text-xs bg-[hsl(var(--accent-iris))/0.15] text-[hsl(var(--accent-iris))] px-2 py-0.5 rounded-full font-medium">
                                PAT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Term {assessment.term} • {assessment.totalMark} marks
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {assessment.weightPercent.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground">normalized</p>
                        </div>
                      </div>

                      {/* Slider */}
                      {!readOnly && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Slider
                                value={[rawWeight]}
                                onValueChange={([value]) => handleWeightChange(assessment.id, value)}
                                min={0}
                                max={100}
                                step={1}
                                className="cursor-pointer"
                              />
                            </div>
                            <Input
                              type="number"
                              value={rawWeight}
                              onChange={(e) => handleWeightChange(assessment.id, Number(e.target.value))}
                              className="w-20 text-center"
                              min={0}
                              step={1}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Raw weight: {rawWeight}</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Contributes {contribution.toFixed(2)}% to total
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Visual Bar */}
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-[hsl(var(--accent-violet))] transition-all duration-300 rounded-full"
                          style={{ width: `${assessment.weightPercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
                Reset to Original
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="bg-gradient-to-r from-primary to-[hsl(var(--accent-violet))] hover:from-primary/90 hover:to-[hsl(var(--accent-violet))]/90"
              >
                {saving ? "Saving..." : "Save Weights"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

