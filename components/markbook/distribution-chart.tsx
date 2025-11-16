"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { MarkbookPayload } from "@/lib/markbook";

interface Props {
  payload: MarkbookPayload;
}

export function DistributionChart({ payload }: Props) {
  const bins = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const data = bins.map((start, index) => {
    const end = bins[index + 1] ?? 100;
    const count = payload.rows.filter((row) => row.sbaPercent >= start && row.sbaPercent < end).length;
    return {
      range: `${start}-${end}`,
      count,
    };
  });

  if (!payload.rows.length) {
    return <p className="text-sm text-muted-foreground">No marks captured yet.</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="range" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#93c5fd" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
