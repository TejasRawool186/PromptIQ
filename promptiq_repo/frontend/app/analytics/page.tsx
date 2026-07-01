"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { CostChart } from "@/components/charts/cost-chart";
import { ModelDistribution } from "@/components/charts/model-distribution";
import {
  DollarSign,
  PiggyBank,
  TrendingDown,
  Zap,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";

// ============================================================
// Fallback Mock Data
// ============================================================

const MOCK_COST_OVER_TIME = [
  { date: "Jun 1", cost: 12.5, savings: 4.2, prompts: 24 },
  { date: "Jun 3", cost: 15.8, savings: 5.1, prompts: 31 },
  { date: "Jun 5", cost: 11.2, savings: 6.3, prompts: 28 },
  { date: "Jun 7", cost: 22.4, savings: 8.7, prompts: 45 },
  { date: "Jun 9", cost: 18.6, savings: 7.2, prompts: 38 },
  { date: "Jun 11", cost: 25.1, savings: 12.3, prompts: 52 },
  { date: "Jun 13", cost: 21.3, savings: 10.8, prompts: 47 },
  { date: "Jun 15", cost: 28.7, savings: 15.4, prompts: 61 },
  { date: "Jun 17", cost: 24.5, savings: 13.2, prompts: 55 },
  { date: "Jun 19", cost: 31.2, savings: 18.6, prompts: 68 },
  { date: "Jun 21", cost: 29.8, savings: 16.9, prompts: 72 },
  { date: "Jun 23", cost: 35.4, savings: 22.1, prompts: 84 },
];

const MOCK_COST_BY_MODEL = [
  { model: "Claude Opus", cost: 128.45, prompts: 189, avg_cost: 0.068 },
  { model: "GPT-4o", cost: 98.72, prompts: 245, avg_cost: 0.040 },
  { model: "GPT-4o-mini", cost: 12.36, prompts: 84, avg_cost: 0.015 },
  { model: "Gemini Flash", cost: 8.92, prompts: 140, avg_cost: 0.006 },
  { model: "Ollama Local", cost: 0.0, prompts: 42, avg_cost: 0.0 },
];

const MOCK_COST_BY_CATEGORY = [
  { category: "Code Gen", count: 280, percentage: 38, color: "#8B5CF6" },
  { category: "Debugging", count: 165, percentage: 22, color: "#F43F5E" },
  { category: "Architecture", count: 98, percentage: 13, color: "#F59E0B" },
  { category: "Refactoring", count: 82, percentage: 11, color: "#06B6D4" },
  { category: "Documentation", count: 60, percentage: 8, color: "#10B981" },
];

const MOCK_TOKEN_DATA = [
  { date: "Jun 1", tokens: 45200 },
  { date: "Jun 3", tokens: 62800 },
  { date: "Jun 5", tokens: 51300 },
  { date: "Jun 7", tokens: 89400 },
  { date: "Jun 9", tokens: 72100 },
  { date: "Jun 11", tokens: 98700 },
  { date: "Jun 13", tokens: 85600 },
  { date: "Jun 15", tokens: 112400 },
  { date: "Jun 17", tokens: 95800 },
  { date: "Jun 19", tokens: 128300 },
  { date: "Jun 21", tokens: 118900 },
  { date: "Jun 23", tokens: 145600 },
];

const HEATMAP_DATA = [
  { hour: "9am", Mon: 8, Tue: 12, Wed: 10, Thu: 14, Fri: 6 },
  { hour: "10am", Mon: 15, Tue: 18, Wed: 20, Thu: 16, Fri: 12 },
  { hour: "11am", Mon: 22, Tue: 25, Wed: 28, Thu: 24, Fri: 18 },
  { hour: "12pm", Mon: 10, Tue: 8, Wed: 12, Thu: 9, Fri: 7 },
  { hour: "1pm", Mon: 6, Tue: 5, Wed: 8, Thu: 7, Fri: 4 },
  { hour: "2pm", Mon: 18, Tue: 22, Wed: 25, Thu: 20, Fri: 15 },
  { hour: "3pm", Mon: 24, Tue: 28, Wed: 30, Thu: 26, Fri: 20 },
  { hour: "4pm", Mon: 20, Tue: 24, Wed: 22, Thu: 18, Fri: 14 },
  { hour: "5pm", Mon: 12, Tue: 14, Wed: 16, Thu: 10, Fri: 8 },
];

const modelColors: Record<string, string> = {
  "Claude Opus": "#06B6D4",
  "GPT-4o": "#8B5CF6",
  "GPT-4o-mini": "#F59E0B",
  "Gemini Flash": "#10B981",
  "Ollama Local": "#F43F5E",
};

export default function AnalyticsPage() {
  const [costAnalytics, setCostAnalytics] = useState<any>(null);
  const [usageTrends, setUsageTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAnalytics() {
      try {
        const { api } = await import("@/lib/api");
        const costData = await api.getCostAnalytics();
        const usageData = await api.getUsageTrends();
        if (active) {
          setCostAnalytics(costData);
          setUsageTrends(usageData);
        }
      } catch (err) {
        console.error("Failed to load analytics from API:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  const hasData = costAnalytics && costAnalytics.total_cost > 0;

  const displayCostOverTime = hasData ? costAnalytics.daily_costs : MOCK_COST_OVER_TIME;
  const displayCostByModel = hasData ? costAnalytics.cost_by_model : MOCK_COST_BY_MODEL;
  const displayCostByCategory = hasData ? costAnalytics.cost_by_category : MOCK_COST_BY_CATEGORY;
  const displayTokenData = hasData ? usageTrends.map(t => ({ date: t.date, tokens: t.total_tokens })) : MOCK_TOKEN_DATA;

  const displayStats = hasData ? {
    total_cost: costAnalytics.total_cost,
    total_savings: costAnalytics.total_savings,
    avg_cost_per_prompt: costAnalytics.avg_cost_per_prompt,
    total_tokens: usageTrends.reduce((acc, curr) => acc + curr.total_tokens, 0),
  } : {
    total_cost: 342.18,
    total_savings: 1247.50,
    avg_cost_per_prompt: 0.0285,
    total_tokens: 1060000,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Cost analysis, usage patterns, and optimization insights
          </p>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin text-brand-400" />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total AI Spend"
          value={`$${displayStats.total_cost.toFixed(2)}`}
          trend={!hasData ? { value: 8.3, label: "vs last month", positive: false } : undefined}
          accentColor="#8B5CF6"
        />
        <StatCard
          icon={PiggyBank}
          label="Total Savings"
          value={`$${displayStats.total_savings.toFixed(2)}`}
          trend={!hasData ? { value: 23.1, label: "from smart routing", positive: true } : undefined}
          accentColor="#10B981"
        />
        <StatCard
          icon={TrendingDown}
          label="Avg Cost / Prompt"
          value={`$${displayStats.avg_cost_per_prompt.toFixed(4)}`}
          trend={!hasData ? { value: 12.4, label: "optimizing over time", positive: true } : undefined}
          accentColor="#06B6D4"
        />
        <StatCard
          icon={Zap}
          label="Tokens Consumed"
          value={`${(displayStats.total_tokens / 1000000).toFixed(2)}M`}
          trend={!hasData ? { value: 16.7, label: "this month", positive: true } : undefined}
          accentColor="#F59E0B"
        />
      </div>

      {/* Cost Over Time + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Cost & Savings Over Time</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            AI spend vs savings from model routing optimization
          </p>
          <div className="h-[300px]">
            <CostChart data={displayCostOverTime} variant="stacked" />
          </div>
        </div>

        {/* Cost by Category Donut */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Cost by Category</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Spend distribution across prompt types
          </p>
          <div className="h-[300px]">
            <ModelDistribution
              data={displayCostByCategory.map((c: any) => ({
                model: c.category || c.model || "Unknown",
                count: c.count || 0,
                percentage: c.percentage || 0,
                color: c.color || "#8B5CF6",
              }))}
              innerRadius={50}
              outerRadius={80}
            />
          </div>
        </div>
      </div>

      {/* Cost by Model Bar + Token Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Cost by Model</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Total spend per AI model
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayCostByModel}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(139,92,246,0.08)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#6b6480"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  stroke="#6b6480"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,10,35,0.95)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#a8a3b8" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                />
                <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={24}>
                  {displayCostByModel.map((entry: any) => (
                    <Cell
                      key={entry.model}
                      fill={modelColors[entry.model] || "#8B5CF6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Consumption */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Token Consumption</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Total tokens used over time
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayTokenData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(139,92,246,0.08)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b6480"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b6480"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,10,35,0.95)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#a8a3b8" }}
                  formatter={(value: number) => [
                    value.toLocaleString(),
                    "Tokens",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fill="url(#tokenGrad)"
                  dot={{ fill: "#F59E0B", strokeWidth: 0, r: 3 }}
                  activeDot={{
                    r: 6,
                    fill: "#F59E0B",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Usage Heatmap */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="text-lg font-semibold">Team Usage Heatmap</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Prompt activity by hour and day of week
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-6 gap-2 mb-2 pl-16">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-[var(--text-muted)] font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {HEATMAP_DATA.map((row) => (
              <div key={row.hour} className="grid grid-cols-6 gap-2 mb-2">
                <div className="text-xs text-[var(--text-muted)] flex items-center justify-end pr-2 font-medium">
                  {row.hour}
                </div>
                {(["Mon", "Tue", "Wed", "Thu", "Fri"] as const).map((day) => {
                  const val = row[day] as number;
                  const maxVal = 30;
                  const intensity = Math.min(val / maxVal, 1);
                  return (
                    <div
                      key={day}
                      className="h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-default"
                      style={{
                        background: `rgba(139, 92, 246, ${intensity * 0.6 + 0.05})`,
                        color:
                          intensity > 0.5
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.4)",
                      }}
                      title={`${day} ${row.hour}: ${val} prompts`}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 justify-end">
          <span className="text-xs text-[var(--text-muted)]">Less</span>
          <div className="flex gap-1">
            {[0.1, 0.2, 0.35, 0.5, 0.65].map((opacity, i) => (
              <div
                key={i}
                className="w-6 h-4 rounded"
                style={{
                  background: `rgba(139, 92, 246, ${opacity})`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
}
