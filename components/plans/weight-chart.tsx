"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Assessment } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  assessments: Assessment[];
}

export function WeightChart({ assessments }: Props) {
  if (!assessments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weight distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add assessments to view weights.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = assessments.map((assessment) => ({
    name: assessment.taskName,
    value: Number(assessment.weightPercent.toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Pie data={chartData} dataKey="value" nameKey="name" fill="#2563eb" label />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
