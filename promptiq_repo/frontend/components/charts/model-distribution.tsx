"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ModelData {
  model: string;
  count: number;
  percentage: number;
  color: string;
}

interface ModelDistributionProps {
  data: ModelData[];
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function ModelDistribution({
  data,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90,
}: ModelDistributionProps) {
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius: or,
    percentage,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percentage: number;
  }) => {
    if (percentage < 8) return null;
    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-[var(--text-secondary)]">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="count"
          nameKey="model"
          label={renderCustomLabel}
          labelLine={false}
          stroke="rgba(5,2,8,0.5)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.3))" }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(15,10,35,0.95)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          labelStyle={{ color: "#a8a3b8" }}
          formatter={(value: number, name: string) => [
            `${value} prompts`,
            name,
          ]}
        />
        {showLegend && <Legend content={renderLegend} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
