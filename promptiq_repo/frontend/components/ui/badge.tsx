"use client";

import React from "react";
import { cn, categoryColors } from "@/lib/utils";

interface BadgeProps {
  category: string;
  className?: string;
  size?: "sm" | "md";
}

const formatCategory = (cat: string) =>
  cat
    .replace(/_/g, " ")
    .replace(/\bml ai\b/gi, "ML/AI")
    .replace(/\b\w/g, (l) => l.toUpperCase());

export function Badge({ category, className, size = "sm" }: BadgeProps) {
  const colorClass =
    categoryColors[category] ||
    "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorClass,
        className
      )}
    >
      {formatCategory(category)}
    </span>
  );
}

interface StatusBadgeProps {
  status: "online" | "offline" | "warning";
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = {
    online: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      label: label || "Online",
    },
    offline: {
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      dot: "bg-rose-400",
      label: label || "Offline",
    },
    warning: {
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      dot: "bg-amber-400",
      label: label || "Warning",
    },
  };

  const c = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full animate-pulse", c.dot)} />
      {c.label}
    </span>
  );
}
