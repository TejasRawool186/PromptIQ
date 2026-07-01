import React from "react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: React.ReactNode;
  className?: string;
  url?: string;
  glow?: boolean;
}

export function BrowserFrame({
  children,
  className,
  url = "promptiq.dev/dashboard",
  glow = true,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/5 bg-[#08090b]/95 shadow-[0_30px_80px_rgba(0,0,0,0.85)] overflow-hidden",
        "transition-all duration-500 ease-out hover:border-white/10 hover:shadow-[0_45px_100px_rgba(0,0,0,0.95)]",
        className
      )}
    >
      {/* Browser chrome header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c0d12] border-b border-white/5 select-none">
        {/* Windows / macOS mock buttons */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-red-500/20 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-yellow-500/20 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-green-500/20 transition-colors" />
        </div>
        
        {/* Mock Address Bar */}
        <div className="flex-1 max-w-sm mx-auto px-4 py-1 rounded-lg bg-white/[0.015] border border-white/5 text-[10px] text-[var(--text-muted)] font-mono text-center tracking-wide flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]/60 animate-pulse" />
          {url}
        </div>
        
        {/* Right side spacer */}
        <div className="w-12" />
      </div>
      
      {/* Client view area */}
      <div className="relative bg-[#020202]">
        {children}
      </div>
      
      {/* Soft backing cyan spotlight reflection */}
      {glow && (
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#ef4444]/3 blur-3xl pointer-events-none z-0" />
      )}
    </div>
  );
}
