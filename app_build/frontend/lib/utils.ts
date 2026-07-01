import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const categoryColors: Record<string, string> = {
  code_generation: "bg-accent-purple/20 text-purple-300 border-purple-500/30",
  debugging: "bg-accent-rose/20 text-rose-300 border-rose-500/30",
  refactoring: "bg-accent-cyan/20 text-cyan-300 border-cyan-500/30",
  documentation: "bg-accent-emerald/20 text-emerald-300 border-emerald-500/30",
  architecture: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  learning: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  boilerplate: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const skillDomainColors: Record<string, string> = {
  frontend: "#8B5CF6",
  backend: "#ef4444",
  database: "#10B981",
  devops: "#F59E0B",
  testing: "#F43F5E",
  security: "#EF4444",
  ml_ai: "#EC4899",
};
