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
    <div className="relative h-64 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/80 p-4 text-white shadow-2xl">
      <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" />
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="distribution" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {item.payload?.range}%
                  </p>
                  <p className="text-xl font-semibold">{item.value} learners</p>
                  <p className="text-xs text-white/60">Currently in range</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#38bdf8"
            fill="url(#distribution)"
            strokeWidth={3}
            activeDot={{ r: 6, fill: "#fb7185", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
