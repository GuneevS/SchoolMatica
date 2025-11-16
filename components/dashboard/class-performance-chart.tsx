"use client";

import { ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface Item {
  id: string;
  name: string;
  averageSba: number | null;
  atRiskCount: number;
}

interface Props {
  data: Item[];
}

export function ClassPerformanceChart({ data }: Props) {
  const chartData = data
    .filter((item) => item.averageSba !== null)
    .map((item) => ({
      name: item.name,
      avg: Number(item.averageSba?.toFixed(2) ?? 0),
      atRisk: item.atRiskCount,
    }));

  if (!chartData.length) {
    return <p className="text-sm text-muted-foreground">Capture marks to view performance trends.</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Bar dataKey="avg" name="Average SBA %" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
