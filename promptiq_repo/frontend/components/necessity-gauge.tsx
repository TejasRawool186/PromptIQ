"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NecessityGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score <= 30) return "#10B981"; // Green — developer can self-solve
  if (score <= 70) return "#F59E0B"; // Amber — AI helps but learn
  return "#F43F5E"; // Rose — AI is the right tool
}

function getScoreLabel(score: number): string {
  if (score <= 30) return "Self-Solve";
  if (score <= 70) return "AI-Assisted";
  return "AI Required";
}

export function NecessityGauge({
  score,
  size = "md",
  showLabel = true,
}: NecessityGaugeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  const dimensions = {
    sm: { width: 64, strokeWidth: 4, fontSize: 14, radius: 24 },
    md: { width: 100, strokeWidth: 6, fontSize: 20, radius: 38 },
    lg: { width: 140, strokeWidth: 8, fontSize: 28, radius: 54 },
  };

  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;
  const center = d.width / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: d.width, height: d.width }}>
        <svg
          width={d.width}
          height={d.width}
          viewBox={`0 0 ${d.width} ${d.width}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={d.radius}
            fill="none"
            stroke="rgba(139,92,246,0.1)"
            strokeWidth={d.strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={d.radius}
            fill="none"
            stroke={color}
            strokeWidth={d.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold"
            style={{ fontSize: d.fontSize, color }}
          >
            {clampedScore}
          </span>
        </div>
      </div>
      {showLabel && size !== "sm" && (
        <p
          className={cn(
            "mt-1 font-medium text-center",
            size === "lg" ? "text-sm" : "text-xs"
          )}
          style={{ color }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
