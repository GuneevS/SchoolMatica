"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { generateDemoAssessmentPlanData } from "@/lib/demo/demo-data-generator";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface InteractiveAssessmentPlannerDemoProps {
  onInteraction?: () => void;
}

export function InteractiveAssessmentPlannerDemo({ onInteraction }: InteractiveAssessmentPlannerDemoProps) {
  const initialData = useMemo(() => generateDemoAssessmentPlanData(), []);

  const [termWeights, setTermWeights] = useState(initialData.termWeights);
  const [assessments, setAssessments] = useState(initialData.assessments);
  const [selectedTerm, setSelectedTerm] = useState("T1");

  // Calculate term totals
  const termTotals = useMemo(() => {
    const totals = { T1: 0, T2: 0, T3: 0, T4: 0 };
    assessments.forEach((a) => {
      totals[a.term as keyof typeof totals] += a.weightPercent;
    });
    return totals;
  }, [assessments]);

  // Check CAPS compliance
  const isTermCompliant = (term: string) => {
    const total = termTotals[term as keyof typeof termTotals];
    return Math.abs(total - 100) < 0.01;
  };

  // Check overall weight sum
  const totalTermWeights = Object.values(termWeights).reduce((sum, w) => sum + w, 0);
  const isWeightsValid = Math.abs(totalTermWeights - 100) < 0.01;

  // Prepare chart data
  const chartData = Object.entries(termWeights).map(([term, weight]) => ({
    name: `Term ${term.substring(1)}`,
    value: weight,
    compliance: isTermCompliant(term.toUpperCase()),
  }));

  // Handle weight change
  const handleWeightChange = (term: string, value: number[]) => {
    if (onInteraction) onInteraction();
    setTermWeights({ ...termWeights, [term]: value[0] });
  };

  // Filter assessments by term
  const termAssessments = assessments.filter((a) => a.term === selectedTerm);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Grade 10 Mathematics - 2024</h3>
          <p className="text-sm text-muted-foreground">Configure term weights and assessment structure</p>
        </div>
        <Badge variant={isWeightsValid ? "default" : "destructive"}>
          {isWeightsValid ? "CAPS Compliant" : "Review Needed"}
        </Badge>
      </div>

      {/* Term Weights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Term Weight Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sliders */}
            <div className="space-y-4">
              {Object.entries(termWeights).map(([term, weight]) => (
                <div key={term} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Term {term.substring(1)}</label>
                    <span className="text-sm font-semibold">{weight.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[weight]}
                    onValueChange={(value) => handleWeightChange(term, value)}
                    max={100}
                    step={0.1}
                    className="cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isTermCompliant(term.toUpperCase()) ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>Assessments sum to 100%</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <span>Current: {termTotals[term.toUpperCase() as keyof typeof termTotals]}%</span>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Total Warning */}
              {!isWeightsValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Term weights must sum to 100%. Current: {totalTermWeights.toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.compliance ? COLORS[index % COLORS.length] : "#ef4444"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments by Term */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTerm} onValueChange={setSelectedTerm}>
            <TabsList className="grid grid-cols-4 w-full">
              {["T1", "T2", "T3", "T4"].map((term) => (
                <TabsTrigger key={term} value={term} className="relative">
                  Term {term.substring(1)}
                  {!isTermCompliant(term) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {["T1", "T2", "T3", "T4"].map((term) => (
              <TabsContent key={term} value={term} className="space-y-3 mt-4">
                {assessments
                  .filter((a) => a.term === term)
                  .map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assessment.taskName}</h4>
                          <Badge variant="outline">{assessment.type}</Badge>
                          {assessment.type === "PAT" && (
                            <Badge variant="secondary">CAPS Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total: {assessment.totalMark} marks • Due: {assessment.dueDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{assessment.weightPercent}%</div>
                        <Badge variant={assessment.status === "Locked" ? "default" : "secondary"} className="text-xs">
                          {assessment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                {/* Term Summary */}
                <div className={cn(
                  "p-3 rounded-lg border-2",
                  isTermCompliant(term)
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isTermCompliant(term) ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-900 dark:text-green-100">
                            CAPS Compliant
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <span className="font-medium text-orange-900 dark:text-orange-100">
                            Review Needed
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Weight</p>
                      <p className="text-lg font-bold">
                        {termTotals[term as keyof typeof termTotals].toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Demo Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>Demo Features:</strong> Adjust term weights with sliders, view real-time pie chart updates, see CAPS compliance indicators. All assessments must sum to 100% per term!
        </p>
      </div>
    </div>
  );
}
