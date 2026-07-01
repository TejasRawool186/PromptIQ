"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface CostData {
  date?: string;
  model?: string;
  cost: number;
  savings?: number;
  prompts?: number;
}

interface CostChartProps {
  data: CostData[];
  variant?: "bar" | "area" | "stacked";
  xKey?: string;
}

export function CostChart({
  data,
  variant = "area",
  xKey = "date",
}: CostChartProps) {
  const tooltipStyle = {
    background: "rgba(15,10,35,0.95)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
          <XAxis
            dataKey={xKey}
            stroke="#6b6480"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b6480"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#a8a3b8" }}
            formatter={(value: number) => [`$${value.toFixed(3)}`, "Cost"]}
          />
          <Bar
            dataKey="cost"
            fill="#8B5CF6"
            radius={[6, 6, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (variant === "stacked") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
          <XAxis
            dataKey={xKey}
            stroke="#6b6480"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b6480"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#a8a3b8" }}
            formatter={(value: number, name: string) => [
              `$${value.toFixed(3)}`,
              name === "cost" ? "AI Cost" : "Savings",
            ]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#costGrad)"
          />
          <Area
            type="monotone"
            dataKey="savings"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#savingsGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default area
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
        <XAxis
          dataKey={xKey}
          stroke="#6b6480"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#6b6480"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#a8a3b8" }}
          formatter={(value: number) => [`$${value.toFixed(3)}`, "Cost"]}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#06B6D4"
          strokeWidth={2.5}
          fill="url(#costAreaGrad)"
          dot={{ fill: "#06B6D4", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 6, fill: "#06B6D4", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
