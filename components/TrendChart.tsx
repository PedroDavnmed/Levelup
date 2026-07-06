"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface ChartPoint {
  label: string;
  value: number;
}

// Chart chrome, mirroring the design tokens (Recharts needs literal values).
const GRID = "#1E2739"; // line
const AXIS = "#94A0B8"; // muted
const MONO = "var(--font-mono)";
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #2A3650", // line-bright
  backgroundColor: "#131A29", // surface-2
  color: "#E8EDF8", // ink
  fontSize: 12,
  fontFamily: MONO,
};

export default function TrendChart({
  data,
  type = "area",
  color = "#4D7CFF",
  height = 220,
}: {
  data: ChartPoint[];
  type?: "area" | "bar";
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "area" ? (
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} fontFamily={MONO} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} width={36} allowDecimals={false} fontFamily={MONO} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: TOOLTIP_STYLE.color }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#g-${color})`}
          />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} fontFamily={MONO} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke={AXIS} width={36} allowDecimals={false} fontFamily={MONO} />
          <Tooltip
            cursor={{ fill: "#131A29" }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: TOOLTIP_STYLE.color }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
