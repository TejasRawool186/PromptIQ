"use client";

import React, { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NecessityGauge } from "@/components/necessity-gauge";
import {
  ChevronDown,
  Clock,
  Coins,
  Cpu,
  Lightbulb,
  Layers,
} from "lucide-react";

interface PromptCardProps {
  prompt: {
    id: string;
    prompt_text: string;
    category: string;
    skill_domain: string;
    complexity_score: number;
    necessity_score: number;
    model_used: string;
    recommended_model: string;
    estimated_cost: number;
    estimated_manual_time_minutes: number;
    token_count: number;
    created_at: string;
    response_summary?: string;
    learning_recommendations?: string[];
  };
  defaultExpanded?: boolean;
}

export function PromptCard({ prompt, defaultExpanded = false }: PromptCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "glass-card overflow-hidden transition-all duration-300",
        expanded ? "ring-1 ring-brand-500/20" : ""
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge category={prompt.category} />
            <Badge category={prompt.skill_domain} />
            <span className="text-xs text-[var(--text-muted)]">
              {timeAgo(prompt.created_at)}
            </span>
          </div>
          <p className="text-sm text-[var(--text-primary)] line-clamp-2">
            {prompt.prompt_text}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Complexity: {prompt.complexity_score}/10
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              {prompt.model_used}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              ${prompt.estimated_cost.toFixed(4)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {prompt.estimated_manual_time_minutes}m saved
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-16">
            <NecessityGauge score={prompt.necessity_score} size="sm" />
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-[var(--text-muted)] transition-transform duration-300",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[rgba(139,92,246,0.08)] pt-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Full prompt */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Full Prompt
              </h4>
              <div className="glass-input p-3 text-sm text-[var(--text-secondary)] max-h-40 overflow-y-auto">
                {prompt.prompt_text}
              </div>

              {prompt.response_summary && (
                <>
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-4">
                    AI Response Summary
                  </h4>
                  <div className="glass-input p-3 text-sm text-[var(--text-secondary)] max-h-32 overflow-y-auto">
                    {prompt.response_summary}
                  </div>
                </>
              )}
            </div>

            {/* Right: Stats & Recommendations */}
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass p-3">
                  <p className="text-xs text-[var(--text-muted)]">Tokens Used</p>
                  <p className="text-lg font-bold">{prompt.token_count.toLocaleString()}</p>
                </div>
                <div className="glass p-3">
                  <p className="text-xs text-[var(--text-muted)]">Necessity</p>
                  <p className="text-lg font-bold">{prompt.necessity_score}/100</p>
                </div>
                <div className="glass p-3">
                  <p className="text-xs text-[var(--text-muted)]">Model Used</p>
                  <p className="text-sm font-semibold mt-1">{prompt.model_used}</p>
                </div>
                <div className="glass p-3">
                  <p className="text-xs text-[var(--text-muted)]">Recommended</p>
                  <p className="text-sm font-semibold mt-1 text-accent-cyan">
                    {prompt.recommended_model}
                  </p>
                </div>
              </div>

              {/* Learning Recommendations */}
              {prompt.learning_recommendations &&
                prompt.learning_recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Learning Recommendations
                    </h4>
                    <ul className="space-y-1.5">
                      {prompt.learning_recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                        >
                          <span className="text-brand-400 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
