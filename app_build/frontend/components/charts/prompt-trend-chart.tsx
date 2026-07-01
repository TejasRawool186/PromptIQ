"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface PromptTrendData {
  date: string;
  prompts: number;
  avgComplexity?: number;
}

interface PromptTrendChartProps {
  data: PromptTrendData[];
  variant?: "line" | "area";
}

export function PromptTrendChart({
  data,
  variant = "area",
}: PromptTrendChartProps) {
  if (variant === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
          <XAxis
            dataKey="date"
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
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,10,35,0.95)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: "#a8a3b8" }}
          />
          <Line
            type="monotone"
            dataKey="prompts"
            stroke="#8B5CF6"
            strokeWidth={2.5}
            dot={{ fill: "#8B5CF6", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
          />
          {data[0]?.avgComplexity !== undefined && (
            <Line
              type="monotone"
              dataKey="avgComplexity"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="promptGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
        <XAxis
          dataKey="date"
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
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15,10,35,0.95)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          labelStyle={{ color: "#a8a3b8" }}
        />
        <Area
          type="monotone"
          dataKey="prompts"
          stroke="#8B5CF6"
          strokeWidth={2.5}
          fill="url(#promptGradient)"
          dot={{ fill: "#8B5CF6", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
