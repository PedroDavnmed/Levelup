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

export default function TrendChart({
  data,
  type = "area",
  color = "#5b7cfa",
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
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#9aa3b2" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#9aa3b2" width={36} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e7e9ee", fontSize: 12 }}
          />
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
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#9aa3b2" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#9aa3b2" width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#f3f5f9" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e7e9ee", fontSize: 12 }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
