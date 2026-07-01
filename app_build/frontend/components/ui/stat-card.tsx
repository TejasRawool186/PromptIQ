"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  accentColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  accentColor = "#8B5CF6",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 relative overflow-hidden group",
        className
      )}
    >
      {/* Accent glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: accentColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full",
                trend.positive !== false
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              )}
            >
              <svg
                className={cn(
                  "w-3.5 h-3.5",
                  trend.positive === false && "rotate-180"
                )}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M6 2L10 7H2L6 2Z"
                  fill="currentColor"
                />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>

        {trend && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
