"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

/** 30-day student attendance rate (single series — the title names it). */
export function AttendanceChart({
  data,
}: {
  data: { date: string; rate: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => {
              if (!d) return "";
              const date = new Date(d);
              return isNaN(date.getTime()) ? String(d) : format(date, "d MMM");
            }}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={
              <ChartTooltip formatter={(v) => `${v}%`} />
            }
            labelFormatter={(d) => {
              if (!d) return "";
              const date = new Date(d);
              return isNaN(date.getTime()) ? String(d) : format(date, "d MMM yyyy");
            }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            name="Attendance"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#attendance-fill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
