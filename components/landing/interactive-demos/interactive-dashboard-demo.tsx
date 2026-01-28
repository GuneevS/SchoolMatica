"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Target,
  Award,
  Info,
  RefreshCw,
} from "lucide-react";
import { generateDemoDashboardData, type DemoClassPerformance } from "@/lib/demo/demo-data-generator";
import { cn } from "@/lib/utils";

// Animated number component for stats
function AnimatedValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * value);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{displayValue}{suffix}</>;
}

interface InteractiveDashboardDemoProps {
  onInteraction?: () => void;
}

export function InteractiveDashboardDemo({ onInteraction }: InteractiveDashboardDemoProps) {
  const demoClasses = useMemo(() => generateDemoDashboardData(), []);

  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [highlightAtRisk, setHighlightAtRisk] = useState(false);

  // Filter data based on selection
  const displayData = useMemo(() => {
    if (selectedClass === "all") return demoClasses;
    return demoClasses.filter((c) => c.className === selectedClass);
  }, [demoClasses, selectedClass]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalStudents = displayData.reduce((sum, c) => sum + c.studentCount, 0);
    const totalAtRisk = displayData.reduce((sum, c) => sum + c.atRiskCount, 0);
    const totalExcellent = displayData.reduce((sum, c) => sum + c.excellentCount, 0);
    const avgPercentage = displayData.reduce((sum, c) => sum + c.averagePercentage, 0) / displayData.length;

    return {
      totalStudents,
      totalAtRisk,
      totalExcellent,
      avgPercentage: Math.round(avgPercentage),
      atRiskPercent: Math.round((totalAtRisk / totalStudents) * 100),
      excellentPercent: Math.round((totalExcellent / totalStudents) * 100),
    };
  }, [displayData]);

  // Prepare chart data
  const chartData = displayData.map((classData) => ({
    name: classData.className.replace("Grade ", "G"),
    average: classData.averagePercentage,
    atRisk: classData.atRiskCount,
    excellent: classData.excellentCount,
    studentCount: classData.studentCount,
  }));

  // Handle class selection
  const handleClassSelect = (value: string) => {
    if (onInteraction) onInteraction();
    setSelectedClass(value);
  };

  // Get bar color based on performance
  const getBarColor = (average: number) => {
    if (average >= 75) return "#10b981"; // green
    if (average >= 60) return "#3b82f6"; // blue
    if (average >= 50) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Performance Dashboard</h3>
          <p className="text-sm text-muted-foreground">Real-time class analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClass} onValueChange={handleClassSelect}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {demoClasses.map((c) => (
                <SelectItem key={c.className} value={c.className}>
                  {c.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Students */}
        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Students</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  <AnimatedValue value={overallStats.totalStudents} />
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 md:mt-2 hidden md:block">
              Across {displayData.length} class{displayData.length !== 1 ? "es" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Average Performance */}
        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Average</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  <AnimatedValue value={overallStats.avgPercentage} suffix="%" />
                </h3>
              </div>
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors",
                overallStats.avgPercentage >= 60
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-orange-100 dark:bg-orange-900/30"
              )}>
                <Target className={cn(
                  "w-5 h-5 md:w-6 md:h-6 transition-colors",
                  overallStats.avgPercentage >= 60
                    ? "text-green-600 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                )} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1 md:mt-2 text-xs">
              {overallStats.avgPercentage >= 60 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 hidden sm:inline">Above target</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-orange-600" />
                  <span className="text-orange-600 hidden sm:inline">Below target</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Excellent Performers */}
        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Excellent</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  <AnimatedValue value={overallStats.totalExcellent} />
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-1 md:mt-2">
              {overallStats.excellentPercent}%
            </p>
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">At Risk</p>
                <h3 className="text-xl md:text-2xl font-bold">
                  <AnimatedValue value={overallStats.totalAtRisk} />
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-1 md:mt-2">
              {overallStats.atRiskPercent}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: "Average %", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <Card className="shadow-lg">
                        <CardContent className="p-3 space-y-1">
                          <p className="font-semibold text-sm">{data.name}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Average</p>
                              <p className="font-bold">{data.average}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Students</p>
                              <p className="font-bold">{data.studentCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Excellent</p>
                              <p className="font-bold text-green-600">{data.excellent}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">At Risk</p>
                              <p className="font-bold text-red-600">{data.atRisk}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }}
                />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label="Pass Line" />
                <ReferenceLine y={75} stroke="#10b981" strokeDasharray="3 3" label="Target" />
                <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Class Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Class</th>
                  <th className="text-center p-3 font-semibold">Students</th>
                  <th className="text-center p-3 font-semibold">Average</th>
                  <th className="text-center p-3 font-semibold">Excellent</th>
                  <th className="text-center p-3 font-semibold">Moderate</th>
                  <th className="text-center p-3 font-semibold">At Risk</th>
                  <th className="text-center p-3 font-semibold">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((classData) => (
                  <tr key={classData.className} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{classData.className}</td>
                    <td className="text-center p-3">{classData.studentCount}</td>
                    <td className="text-center p-3">
                      <Badge variant={classData.averagePercentage >= 60 ? "default" : "secondary"}>
                        {classData.averagePercentage}%
                      </Badge>
                    </td>
                    <td className="text-center p-3 text-green-600 font-semibold">
                      {classData.excellentCount}
                    </td>
                    <td className="text-center p-3 text-blue-600 font-semibold">
                      {classData.moderateCount}
                    </td>
                    <td className="text-center p-3 text-red-600 font-semibold">
                      {classData.atRiskCount}
                    </td>
                    <td className="text-center p-3">
                      <Badge variant={classData.passingCount / classData.studentCount >= 0.7 ? "default" : "destructive"}>
                        {Math.round((classData.passingCount / classData.studentCount) * 100)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Demo Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>Demo Features:</strong> Filter by class, hover bars for detailed tooltips, see pass/fail thresholds, track at-risk students. All data updates in real-time!
        </p>
      </div>
    </div>
  );
}
