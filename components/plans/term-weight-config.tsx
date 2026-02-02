"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TermWeightConfigProps {
  termCount: number;
  initialWeights?: Record<string, number>;
  onSave: (weights: Record<string, number>) => Promise<void>;
  readOnly?: boolean;
}

export function TermWeightConfig({ termCount, initialWeights = {}, onSave, readOnly = false }: TermWeightConfigProps) {
  const terms = Array.from({ length: termCount }, (_, i) => `T${i + 1}`);
  
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    terms.forEach((term) => {
      initial[term] = initialWeights[term] ?? (100 / termCount);
    });
    return initial;
  });
  
  const [saving, setSaving] = useState(false);

  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((sum, w) => sum + w, 0);
  }, [weights]);

  const isValid = Math.abs(totalWeight - 100) < 0.01;
  const hasChanges = useMemo(() => {
    return terms.some((term) => Math.abs((weights[term] ?? 0) - (initialWeights[term] ?? (100 / termCount))) > 0.01);
  }, [weights, initialWeights, terms, termCount]);

  const handleWeightChange = (term: string, value: number) => {
    setWeights((prev) => ({ ...prev, [term]: Math.max(0, Math.min(100, value)) }));
  };

  const handleAutoBalance = () => {
    const balanced: Record<string, number> = {};
    const perTerm = 100 / terms.length;
    terms.forEach((term) => {
      balanced[term] = Number(perTerm.toFixed(2));
    });
    const diff = 100 - Object.values(balanced).reduce((sum, w) => sum + w, 0);
    if (Math.abs(diff) > 0) {
      balanced[terms[0]] = Number((balanced[terms[0]] + diff).toFixed(2));
    }
    setWeights(balanced);
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave(weights);
      // Force refresh to show updated values
      window.location.reload();
    } catch (error) {
      console.error("Failed to save term weights:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset: Record<string, number> = {};
    terms.forEach((term) => {
      reset[term] = initialWeights[term] ?? (100 / termCount);
    });
    setWeights(reset);
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[hsl(var(--accent-cobalt))/0.12] via-[hsl(var(--accent-iris))/0.12] to-[hsl(var(--accent-flamingo))/0.12]">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Term Weight Configuration
              </CardTitle>
              <CardDescription className="mt-2">
                Configure how each term contributes to the final year mark. Weights must total 100%.
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Set the percentage contribution of each term to the student&apos;s final year mark.
                  For example, if Term 1 = 20% and Term 2 = 30%, then Term 1 assessments contribute
                  20% to the final mark.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-[hsl(var(--accent-iris))/0.12] to-[hsl(var(--accent-flamingo))/0.12] border-[hsl(var(--accent-iris))/0.25]">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-3xl font-bold text-[hsl(var(--accent-iris))]">{totalWeight.toFixed(2)}%</p>
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
                        <p className="text-lg font-semibold text-[hsl(var(--accent-gold))]">Invalid</p>
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
                Term weights must sum to exactly 100%. Current total: {totalWeight.toFixed(2)}%
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {terms.map((term, index) => {
              const weight = weights[term] ?? 0;
              const color = `hsl(${(index * 360) / terms.length}, 70%, 50%)`;
              
              return (
                <Card
                  key={term}
                  className="group hover:shadow-md transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: color }}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-semibold text-base">Term {index + 1}</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Contribution to final year mark
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{weight.toFixed(2)}%</p>
                          <Badge variant="outline" className="mt-1">
                            {term}
                          </Badge>
                        </div>
                      </div>

                      {!readOnly && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Slider
                                value={[weight]}
                                onValueChange={([value]) => handleWeightChange(term, value)}
                                min={0}
                                max={100}
                                step={0.5}
                                className="cursor-pointer"
                              />
                            </div>
                            <Input
                              type="number"
                              value={weight.toFixed(2)}
                              onChange={(e) => handleWeightChange(term, Number(e.target.value))}
                              className="w-24 text-center font-semibold"
                              min={0}
                              max={100}
                              step={0.5}
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      )}

                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-[hsl(var(--accent-violet))] transition-all duration-300 rounded-full"
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!readOnly && (
            <div className="flex items-center justify-between pt-4 border-t gap-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
                  Reset
                </Button>
                <Button variant="outline" onClick={handleAutoBalance} disabled={saving}>
                  Auto Balance
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !isValid || saving}
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
