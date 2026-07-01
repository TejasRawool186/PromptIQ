"use client";

import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillData {
  domain: string;
  score: number;
  fullMark?: number;
}

interface SkillRadarProps {
  data: SkillData[];
  color?: string;
  secondaryData?: SkillData[];
  secondaryColor?: string;
}

export function SkillRadar({
  data,
  color = "#8B5CF6",
  secondaryData,
  secondaryColor = "#06B6D4",
}: SkillRadarProps) {
  const formatDomain = (domain: string) =>
    domain
      .replace(/_/g, " ")
      .replace(/\bml ai\b/gi, "ML/AI")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  const chartData = data.map((d) => ({
    ...d,
    domain: formatDomain(d.domain),
    fullMark: d.fullMark || 100,
    ...(secondaryData
      ? {
          secondary:
            secondaryData.find((s) => s.domain === d.domain)?.score || 0,
        }
      : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(139,92,246,0.15)" />
        <PolarAngleAxis
          dataKey="domain"
          stroke="#a8a3b8"
          fontSize={12}
          tick={{ fill: "#a8a3b8", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          stroke="rgba(139,92,246,0.1)"
          fontSize={10}
          tick={{ fill: "#6b6480" }}
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
        <Radar
          name="Skills"
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
        />
        {secondaryData && (
          <Radar
            name="Previous"
            dataKey="secondary"
            stroke={secondaryColor}
            fill={secondaryColor}
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
