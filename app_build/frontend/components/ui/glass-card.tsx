import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  hoverEffect = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6",
        hoverEffect && "transition-all duration-300 ease-out hover:border-white/10 hover:bg-white/[0.035] hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {children}
    </div>
  );
}
