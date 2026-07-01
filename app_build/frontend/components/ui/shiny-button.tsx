import React from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

export function ShinyButton({
  children,
  className,
  variant = "primary",
  ...props
}: ShinyButtonProps) {
  if (variant === "secondary") {
    return (
      <button
        className={cn(
          "relative overflow-hidden px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-white transition-all duration-300",
          "bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 shadow-lg",
          "hover:translate-y-[-2px] hover:scale-[1.02]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(
        "group relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300",
        "bg-gradient-to-b from-[#221010] via-[#0c0505] to-[#000000]",
        "border border-white/10 hover:border-[#ef4444]/45 shadow-2xl",
        "hover:translate-y-[-2px] hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {/* Sweeping shimmer streak */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      
      {/* Accent glow behind button on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-radial-gradient from-[#ef4444]/6 to-transparent blur-md" />
      
      {/* Top light highlight line */}
      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-[#ef4444]/55 transition-colors duration-300" />
      
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
