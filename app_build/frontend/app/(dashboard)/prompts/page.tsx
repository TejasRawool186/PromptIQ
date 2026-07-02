"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { NecessityGauge } from "@/components/necessity-gauge";
import { cn, timeAgo, categoryColors } from "@/lib/utils";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Cpu,
  Coins,
  Clock,
  Layers,
  Lightbulb,
  SortAsc,
  SortDesc,
} from "lucide-react";

// ============================================================
// Categories list
// ============================================================

const ALL_CATEGORIES = [
  "all",
  "code_generation",
  "debugging",
  "refactoring",
  "documentation",
  "architecture",
  "learning",
  "boilerplate",
];

type SortField = "created_at" | "complexity_score" | "necessity_score" | "estimated_cost";

export default function PromptsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [promptsList, setPromptsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchPrompts() {
      try {
        const { api } = await import("@/lib/api");
        const list = await api.listPrompts();
        if (active) {
          setPromptsList(list);
        }
      } catch (err) {
        console.error("Failed to load prompts from API:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchPrompts();
    return () => {
      active = false;
    };
  }, []);

  const filteredPrompts = useMemo(() => {
    let result = promptsList;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.prompt_text.toLowerCase().includes(q) ||
          p.model_used.toLowerCase().includes(q) ||
          p.skill_domain.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [searchQuery, selectedCategory, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <SortAsc className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? (
      <SortAsc className="w-3.5 h-3.5 text-brand-400" />
    ) : (
      <SortDesc className="w-3.5 h-3.5 text-brand-400" />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompt History</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Browse and analyze all captured AI interactions
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search prompts, models, domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-muted)]">
            {filteredPrompts.length} results
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
              selectedCategory === cat
                ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                : "border-white/10 text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text-secondary)]"
            )}
          >
            {cat === "all"
              ? "All"
              : cat
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(139,92,246,0.08)] text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
          <div className="col-span-4">Prompt</div>
          <div className="col-span-1">Category</div>
          <div
            className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
            onClick={() => toggleSort("complexity_score")}
          >
            Complexity <SortIcon field="complexity_score" />
          </div>
          <div
            className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
            onClick={() => toggleSort("necessity_score")}
          >
            Necessity <SortIcon field="necessity_score" />
          </div>
          <div className="col-span-2">Model</div>
          <div
            className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
            onClick={() => toggleSort("estimated_cost")}
          >
            Cost <SortIcon field="estimated_cost" />
          </div>
          <div
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
            onClick={() => toggleSort("created_at")}
          >
            Time <SortIcon field="created_at" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[rgba(139,92,246,0.06)]">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              No prompt logs recorded. Connect your CLI to populate telemetry logs.
            </div>
          ) : (
            filteredPrompts.map((prompt) => {
              const isExpanded = expandedId === prompt.id;

            return (
              <div key={prompt.id}>
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : prompt.id)
                  }
                  className="w-full grid grid-cols-12 gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-4">
                    <p className="text-sm text-[var(--text-primary)] line-clamp-1">
                      {prompt.prompt_text}
                    </p>
                    <div className="mt-1">
                      <Badge category={prompt.skill_domain} />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Badge category={prompt.category} />
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${prompt.complexity_score * 10}%`,
                            background:
                              prompt.complexity_score <= 4
                                ? "#10B981"
                                : prompt.complexity_score <= 7
                                  ? "#F59E0B"
                                  : "#F43F5E",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {prompt.complexity_score}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <NecessityGauge
                      score={prompt.necessity_score}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {prompt.model_used}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-accent-cyan">
                      ${prompt.estimated_cost.toFixed(4)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">
                      {timeAgo(prompt.created_at)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-[var(--text-muted)] transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Expanded row */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-fade-in">
                    <div className="glass p-5 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Full Prompt
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {prompt.prompt_text}
                          </p>

                          {prompt.response_summary && (
                            <>
                              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-4">
                                AI Response
                              </h4>
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {prompt.response_summary}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="glass p-3 rounded-lg">
                              <p className="text-xs text-[var(--text-muted)]">Tokens</p>
                              <p className="text-lg font-bold">{prompt.token_count.toLocaleString()}</p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <p className="text-xs text-[var(--text-muted)]">Time Saved</p>
                              <p className="text-lg font-bold flex items-center gap-1">
                                <Clock className="w-4 h-4 text-accent-emerald" />
                                {prompt.estimated_manual_time_minutes}m
                              </p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <p className="text-xs text-[var(--text-muted)]">Recommended</p>
                              <p className="text-sm font-semibold mt-1 text-accent-cyan">
                                {prompt.recommended_model}
                              </p>
                            </div>
                            <div className="glass p-3 rounded-lg">
                              <p className="text-xs text-[var(--text-muted)]">Necessity</p>
                              <p className="text-lg font-bold">{prompt.necessity_score}/100</p>
                            </div>
                          </div>

                          {prompt.learning_recommendations.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                Learning Tips
                              </h4>
                              <ul className="space-y-1">
                                {prompt.learning_recommendations.map(
                                  (rec: string, i: number) => (
                                    <li
                                      key={i}
                                      className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                                    >
                                      <span className="text-brand-400 mt-0.5">→</span>
                                      {rec}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
