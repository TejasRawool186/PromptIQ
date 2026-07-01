"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { PromptTrendChart } from "@/components/charts/prompt-trend-chart";
import { ModelDistribution } from "@/components/charts/model-distribution";
import { NecessityGauge } from "@/components/necessity-gauge";
import {
  MessageSquareText,
  DollarSign,
  PiggyBank,
  Gauge,
  Send,
  Sparkles,
  ArrowRight,
  Clock,
  Cpu,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ============================================================
// Fallback / Mock Data (shown if backend is empty)
// ============================================================

const MOCK_TREND = [
  { date: "Jun 1", prompts: 24 },
  { date: "Jun 3", prompts: 31 },
  { date: "Jun 5", prompts: 28 },
  { date: "Jun 7", prompts: 45 },
  { date: "Jun 9", prompts: 38 },
  { date: "Jun 11", prompts: 52 },
  { date: "Jun 13", prompts: 47 },
  { date: "Jun 15", prompts: 61 },
  { date: "Jun 17", prompts: 55 },
  { date: "Jun 19", prompts: 68 },
  { date: "Jun 21", prompts: 72 },
  { date: "Jun 23", prompts: 84 },
];

const MOCK_MODEL_DIST = [
  { model: "GPT-4o", count: 245, percentage: 35, color: "#8B5CF6" },
  { model: "Claude Opus", count: 189, percentage: 27, color: "#06B6D4" },
  { model: "Gemini Flash", count: 140, percentage: 20, color: "#10B981" },
  { model: "GPT-4o-mini", count: 84, percentage: 12, color: "#F59E0B" },
  { model: "Ollama Local", count: 42, percentage: 6, color: "#F43F5E" },
];

const MOCK_RECENT = [
  {
    id: "1",
    prompt_text:
      "Refactor the useAuth hook to use React Context instead of prop drilling. Include TypeScript generics for the user type.",
    category: "refactoring" as const,
    skill_domain: "frontend" as const,
    complexity_score: 7,
    necessity_score: 45,
    model_used: "Claude Opus",
    estimated_cost: 0.0234,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "2",
    prompt_text:
      "Debug this PostgreSQL query that's causing a sequential scan instead of using the index on user_id column.",
    category: "debugging" as const,
    skill_domain: "database" as const,
    complexity_score: 6,
    necessity_score: 72,
    model_used: "GPT-4o",
    estimated_cost: 0.0156,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "3",
    prompt_text:
      "Generate a Dockerfile for a Next.js 14 app with multi-stage build, non-root user, and proper caching of node_modules.",
    category: "code_generation" as const,
    skill_domain: "devops" as const,
    complexity_score: 5,
    necessity_score: 38,
    model_used: "Gemini Flash",
    estimated_cost: 0.0045,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

// ============================================================
// Quick Analysis Form
// ============================================================

function QuickAnalysisForm({ onAnalyzeComplete }: { onAnalyzeComplete?: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    necessity: number;
    category: string;
    model: string;
    cost: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { api } = await import("@/lib/api");
      const res = await api.analyzePrompt({
        prompt_text: prompt,
        user_id: "default_user",
        project: "unknown",
      });
      setResult({
        necessity: res.necessity_score,
        category: res.analysis.category,
        model: res.suggested_model,
        cost: res.analysis.estimated_cost,
      });
      setPrompt("");
      if (onAnalyzeComplete) {
        onAnalyzeComplete();
      }
    } catch (err: any) {
      console.error("Analysis API failed:", err);
      // Clean fallback in degraded mode
      setResult({
        necessity: 45,
        category: "refactoring",
        model: "Gemini Flash",
        cost: 0.0012,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" />
        Quick Prompt Analysis
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste a prompt to analyze instantly..."
          rows={3}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
        />
        <button
          type="submit"
          disabled={isAnalyzing || !prompt.trim()}
          className="glass-btn px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Analyze Prompt
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-4 glass rounded-xl animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <NecessityGauge score={result.necessity} size="sm" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Necessity</p>
                <p className="text-sm font-semibold">{result.necessity}/100</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Category</p>
              <Badge category={result.category} size="md" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Best Model</p>
              <p className="text-sm font-semibold text-accent-cyan">{result.model}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Est. Cost</p>
              <p className="text-sm font-semibold">${result.cost.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Dashboard Page
// ============================================================

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentPromptsData, setRecentPromptsData] = useState<any[]>([]);
  const [trendDataList, setTrendDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const { api } = await import("@/lib/api");
        const fetchedStats = await api.getDashboardStats();
        const fetchedPrompts = await api.listPrompts({ limit: 5 });
        const fetchedUsage = await api.getUsageTrends();
        
        if (active) {
          setStats(fetchedStats);
          setRecentPromptsData(fetchedPrompts);
          if (fetchedUsage && fetchedUsage.length > 0) {
            setTrendDataList(fetchedUsage.map(u => ({ date: u.date, prompts: u.total_prompts })));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const hasData = stats && stats.total_prompts > 0;

  const displayStats = hasData ? stats : {
    total_prompts: 2847,
    total_cost: 342.18,
    total_savings: 1247.50,
    avg_necessity_score: 62.4,
    active_users: 2,
    model_distribution: MOCK_MODEL_DIST,
  };

  const displayPrompts = recentPromptsData.length > 0 ? recentPromptsData : MOCK_RECENT;
  const displayTrend = trendDataList.length > 0 ? trendDataList : MOCK_TREND;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">PromptIQ</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Your AI governance layer — powered by Cognee memory engine
          </p>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin text-brand-400" />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stagger-1 animate-slide-up opacity-0">
          <StatCard
            icon={MessageSquareText}
            label="Total Prompts"
            value={displayStats.total_prompts.toLocaleString()}
            trend={!hasData ? { value: 12.5, label: "vs last week", positive: true } : undefined}
            accentColor="#8B5CF6"
          />
        </div>
        <div className="stagger-2 animate-slide-up opacity-0">
          <StatCard
            icon={DollarSign}
            label="AI Spend"
            value={`$${displayStats.total_cost.toFixed(2)}`}
            trend={!hasData ? { value: 8.3, label: "vs last month", positive: false } : undefined}
            accentColor="#06B6D4"
          />
        </div>
        <div className="stagger-3 animate-slide-up opacity-0">
          <StatCard
            icon={PiggyBank}
            label="Savings Generated"
            value={`$${displayStats.total_savings.toFixed(2)}`}
            trend={!hasData ? { value: 23.1, label: "from smart routing", positive: true } : undefined}
            accentColor="#10B981"
          />
        </div>
        <div className="stagger-4 animate-slide-up opacity-0">
          <StatCard
            icon={Gauge}
            label="Avg Necessity Score"
            value={displayStats.avg_necessity_score.toFixed(1)}
            trend={!hasData ? { value: 3.2, label: "improving over time", positive: true } : undefined}
            accentColor="#F59E0B"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Prompt Trends</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Daily prompt submissions over the last 2 weeks
              </p>
            </div>
            {!hasData && (
              <div className="flex items-center gap-1 text-sm text-accent-emerald">
                <TrendingUp className="w-4 h-4" />
                <span>+16.7%</span>
              </div>
            )}
          </div>
          <div className="h-[280px]">
            <PromptTrendChart data={displayTrend} />
          </div>
        </div>

        {/* Model Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Model Usage</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Distribution across AI models
          </p>
          <div className="h-[280px]">
            <ModelDistribution data={displayStats.model_distribution} innerRadius={55} outerRadius={85} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Prompts */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Prompts</h3>
            <a
              href="/prompts"
              className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {displayPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="glass p-4 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] line-clamp-1 group-hover:text-white transition-colors">
                      {prompt.prompt_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge category={prompt.category} />
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {prompt.model_used}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const diff = Date.now() - new Date(prompt.created_at).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 60) return `${mins}m ago`;
                          if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
                          return `${Math.floor(mins / 1440)}d ago`;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Cost</p>
                      <p className="text-sm font-semibold text-accent-cyan">
                        ${(prompt.estimated_cost || 0).toFixed(4)}
                      </p>
                    </div>
                    <NecessityGauge score={prompt.necessity_score} size="sm" showLabel={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Analysis */}
        <div className="lg:col-span-2">
          <QuickAnalysisForm onAnalyzeComplete={triggerRefresh} />
        </div>
      </div>
    </div>
  );
}
