"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import type { Assessment } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  const palette = ["#38bdf8", "#a855f7", "#fb7185", "#34d399", "#f97316", "#fbbf24", "#0ea5e9", "#22d3ee"];
  const totalWeight = chartData.reduce((sum, current) => sum + current.value, 0);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Weight distribution</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Real-time balance of assessment influence with contextual highlights.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="relative flex h-64 flex-col items-center justify-center">
          <div className="pointer-events-none absolute inset-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/60 shadow-inner"></div>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
                      <p className="text-xs uppercase tracking-widest text-white/60">{item.payload?.name}</p>
                      <p className="text-lg font-semibold">{Number(item.value).toFixed(1)}%</p>
                      <p className="text-xs text-white/60">Curriculum influence</p>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={3}
                cornerRadius={12}
                stroke="transparent"
              >
                {chartData.map((_, index) => (
                  <Cell key={`slice-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total</p>
            <p className="text-3xl font-semibold">{totalWeight.toFixed(0)}%</p>
            <p className="text-xs text-white/60">Allocated weight</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
