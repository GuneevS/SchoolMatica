"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useThemeStore } from "@/lib/stores/theme-store";

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
  const mode = useThemeStore((state) => state.mode);
  const isDark = mode === "dark";
  const axisColor = isDark ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.65)";
  const gridColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)";
  const cursorFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)";

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
    <Card
      className="h-72 border border-[hsl(var(--border-strong))/0.6] p-4 text-foreground shadow-ambient"
      style={{ backgroundImage: "var(--chart-surface-bg)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Performance pulse</p>
          <h3 className="text-lg font-semibold">Class progression</h3>
        </div>
        <div className="rounded-full border border-[hsl(var(--border))/0.4] bg-[color-mix(in srgb,hsl(var(--surface-strong)) 70%,transparent)] px-3 py-1 text-xs text-foreground/80">
          Live
        </div>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ left: 12, right: 12, top: 20 }}>
            <defs>
              <linearGradient id="chartPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.95} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: axisColor }}
              interval={0}
              height={60}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: axisColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <Tooltip
              cursor={{ fill: cursorFill }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                return (
                  <div className="rounded-2xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-strong))/0.95] px-4 py-3 text-sm text-foreground shadow-ambient-sm backdrop-blur">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground/80">{item.payload.name}</p>
                    <p className="text-lg font-semibold text-foreground">{item.payload.avg.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground/80">{item.payload.atRisk} at risk</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={50} stroke="rgba(244,63,94,0.4)" strokeDasharray="4 4" />
            <Bar dataKey="avg" name="Average SBA %" fill="url(#chartPrimary)" radius={[12, 12, 12, 12]}>
              <LabelList
                dataKey="avg"
                position="top"
                formatter={(value) => `${Number(value ?? 0).toFixed(0)}%`}
                fill="hsl(var(--foreground))"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
