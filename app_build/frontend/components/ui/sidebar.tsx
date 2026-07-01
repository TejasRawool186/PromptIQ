"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquareText,
  BarChart3,
  Brain,
  Database,
  Settings,
  Sparkles,
  ChevronLeft,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Prompts", href: "/prompts", icon: MessageSquareText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Skills", href: "/skills", icon: Brain },
  { label: "Memory Explorer", href: "/memory", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
        "bg-[rgba(8,5,20,0.85)] backdrop-blur-2xl border-r border-[rgba(139,92,246,0.1)]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-[rgba(139,92,246,0.08)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-fade-in">
            <h1 className="text-lg font-bold gradient-text leading-tight">
              PromptIQ
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wider uppercase">
              AI Governance
            </p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-brand-500/15 text-white"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-cyan" />
              )}

              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-brand-400"
                    : "text-[var(--text-muted)] group-hover:text-brand-300"
                )}
              />

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[rgba(15,10,35,0.95)] border border-[rgba(139,92,246,0.2)] text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Cognee Status */}
      <div className="px-3 pb-3">
        <div
          className={cn(
            "glass p-3 rounded-xl",
            collapsed ? "flex items-center justify-center" : ""
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-400">
                  Cognee Connected
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  Memory Engine Active
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-[rgba(139,92,246,0.08)] text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
      >
        <ChevronLeft
          className={cn(
            "w-5 h-5 transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
