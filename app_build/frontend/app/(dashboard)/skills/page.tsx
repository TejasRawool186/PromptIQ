"use client";

import React, { useState, useEffect } from "react";
import { SkillRadar } from "@/components/charts/skill-radar";
import { StatCard } from "@/components/ui/stat-card";
import {
  Brain,
  TrendingUp,
  Cpu,
  Award,
  BookOpen,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DOMAIN_DETAILS: Record<
  string,
  { label: string; desc: string; color: string }
> = {
  frontend: {
    label: "Frontend Development",
    desc: "React, Next.js, CSS layouts, Tailwind, State Management",
    color: "#8B5CF6",
  },
  backend: {
    label: "Backend & Systems",
    desc: "FastAPI, API Design, Async execution, OOP, System Integrations",
    color: "#ef4444",
  },
  database: {
    label: "Database Management",
    desc: "SQL Optimizations, Indexing, Vector Databases, Graph Databases",
    color: "#10B981",
  },
  devops: {
    label: "DevOps & Infrastructure",
    desc: "Docker, Kubernetes, AWS resources, CI/CD pipelines, Env configuration",
    color: "#F59E0B",
  },
  testing: {
    label: "Testing & Quality",
    desc: "Unit Testing, Integration Testing, Pytest, Mocking, Jest",
    color: "#F43F5E",
  },
  security: {
    label: "Security & Auditing",
    desc: "API Auth, JWT Tokens, OWASP vulnerabilities, Encryption, Data privacy",
    color: "#EF4444",
  },
  ml_ai: {
    label: "ML & AI Engineering",
    desc: "LLMs integration, Prompt engineering, Cognee Memory, Vector Search",
    color: "#EC4899",
  },
};

export default function SkillsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    async function loadSkills() {
      setLoading(true);
      try {
        const { api } = await import("@/lib/api");
        const skillProfile = await api.getSkillProfile(currentUser.id);
        const skillTimeline = await api.getSkillTimeline(currentUser.id);
        if (active) {
          setProfile(skillProfile);
          setTimeline(skillTimeline);
        }
      } catch (err) {
        console.error("Failed to load skills profile:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSkills();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const defaultDomains = [
    { domain: "frontend" as const, score: 0 },
    { domain: "backend" as const, score: 0 },
    { domain: "database" as const, score: 0 },
    { domain: "devops" as const, score: 0 },
    { domain: "testing" as const, score: 0 },
    { domain: "security" as const, score: 0 },
    { domain: "ml_ai" as const, score: 0 },
  ];

  const hasData = profile && profile.total_prompts > 0;

  const displaySkills = hasData
    ? profile.skills
    : defaultDomains;

  const displayTimeline = timeline && timeline.timeline && timeline.timeline.length > 0
    ? timeline.timeline.map((t: any, i: number) => ({
        month: t.date || `Step ${i + 1}`,
        frontend: t.skills.frontend || 0,
        backend: t.skills.backend || 0,
        devops: t.skills.devops || 0,
      }))
    : [
        { month: "Point A", frontend: 0, backend: 0, devops: 0 },
        { month: "Point B", frontend: 0, backend: 0, devops: 0 },
        { month: "Point C", frontend: 0, backend: 0, devops: 0 },
      ];

  const displayAIDependency = hasData
    ? [
        { week: "Wk 1", dependency: Math.round(profile.ai_dependency_score * 0.8), prompts: Math.round(profile.total_prompts * 0.2) },
        { week: "Wk 2", dependency: Math.round(profile.ai_dependency_score * 0.9), prompts: Math.round(profile.total_prompts * 0.3) },
        { week: "Wk 3", dependency: Math.round(profile.ai_dependency_score), prompts: Math.round(profile.total_prompts * 0.5) }
      ]
    : [
        { week: "Wk 1", dependency: 0, prompts: 0 },
        { week: "Wk 2", dependency: 0, prompts: 0 },
        { week: "Wk 3", dependency: 0, prompts: 0 }
      ];

  const avgSkillScore = hasData && displaySkills.length > 0
    ? Math.round(
        displaySkills.reduce((acc: number, s: any) => acc + (s.score || s.level || 0), 0) /
          displaySkills.length
      )
    : 0;

  const currentDependency = hasData
    ? Math.round(profile.ai_dependency_score)
    : 0;

  const currentPrompts = hasData
    ? profile.total_prompts
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Skill Tracking & AI Dependency
        </h1>
        <p className="text-[var(--text-secondary)]">
          Analyze your skill growth and track AI dependency trends dynamically based on Cognee memory.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {currentUser?.picture ? (
            <img
              src={currentUser.picture}
              alt={currentUser.name || "User Avatar"}
              className="w-16 h-16 rounded-2xl border border-white/10 shadow-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-brand-500/10">
              {(currentUser?.name || "D").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {currentUser?.name || "Developer Workspace"}
              {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-400" />}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {currentUser?.email || "Connected Active Workspace"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 border-t border-[rgba(255,255,255,0.05)] pt-6 md:pt-0 md:border-t-0">
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
              Competency Index
            </div>
            <div className="text-3xl font-bold text-brand-400">
              {avgSkillScore}%
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.08)] hidden md:block" />
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
              AI Dependency
            </div>
            <div className="text-3xl font-bold text-accent-cyan">
              {currentDependency}%
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.08)] hidden md:block" />
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
              Ingested Prompts
            </div>
            <div className="text-3xl font-bold text-accent-emerald">
              {currentPrompts}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Warning */}
      {!hasData && !loading && (
        <div className="glass p-6 rounded-2xl border border-[rgba(239,68,68,0.15)] bg-red-500/[0.02] flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-300">No Prompt Telemetry Detected</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your competency map is empty because you haven't logged any prompts to the database. Submit prompts in the 
              <strong> Quick Prompt Analysis</strong> panel on your dashboard to see your AI dependency scores and skill coverage update!
            </p>
          </div>
        </div>
      )}

      {/* Skill Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Skill Radar Chart */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" /> Skill Domain Radar
          </h3>
          <div className="h-[300px] w-full flex-1 flex items-center justify-center">
            {hasData ? (
              <SkillRadar data={displaySkills} />
            ) : (
              <div className="text-xs text-[var(--text-muted)] text-center">
                Radar requires active prompt data to compute coordinates.
              </div>
            )}
          </div>
        </div>

        {/* Skill Progress List */}
        <div className="lg:col-span-7 glass-card p-6 space-y-5">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-400" /> Skill Domain Competency
          </h3>
          <div className="grid grid-cols-1 gap-4 max-h-[320px] overflow-y-auto pr-1">
            {displaySkills.map((skill: any) => {
              const details = DOMAIN_DETAILS[skill.domain] || {
                label: skill.domain,
                desc: "",
                color: "#8B5CF6",
              };
              const score = skill.score || skill.level || 0;
              return (
                <div
                  key={skill.domain}
                  className="bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 transition-all hover:bg-white/[0.03] group"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {details.label}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {details.desc}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: details.color }}
                    >
                      {score}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${score}%`,
                        backgroundColor: details.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Timeline */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" /> Skill Growth Timeline
          </h3>
          <div className="h-[280px] w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayTimeline}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(139,92,246,0.08)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#6b6480"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b6480"
                    fontSize={12}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,10,35,0.95)",
                      border: "1px solid rgba(139,92,246,0.2)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                    labelStyle={{ color: "#a8a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="frontend"
                    name="Frontend"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="backend"
                    name="Backend"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="devops"
                    name="DevOps"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-white/5 rounded-xl">
                Charts will populate as skill nodes build up in Cognee memory.
              </div>
            )}
          </div>
        </div>

        {/* AI Dependency Trend */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-cyan" /> AI Dependency Trend
          </h3>
          <div className="h-[280px] w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayAIDependency}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(139,92,246,0.08)"
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#6b6480"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b6480"
                    fontSize={12}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,10,35,0.95)",
                      border: "1px solid rgba(139,92,246,0.2)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                    labelStyle={{ color: "#a8a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dependency"
                    name="Dependency %"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ fill: "#ef4444", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="prompts"
                    name="Weekly Prompts"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: "#8B5CF6", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-white/5 rounded-xl">
                Charts will populate as dependency trends calculate.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-400" /> Cognee-Powered Learning Recommendations
        </h3>
        {!hasData ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-[rgba(255,255,255,0.05)] rounded-xl bg-white/[0.005]">
            Add prompt data to receive personalized skill refinement recommendations from Cognee.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(profile?.recommendations || []).map((rec: any) => {
              const details = DOMAIN_DETAILS[rec.domain] || {
                label: rec.domain,
                color: "#8B5CF6",
              };
              return (
                <div
                  key={rec.id}
                  className="bg-white/[0.015] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 hover:bg-white/[0.03] transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${details.color}15`,
                          color: details.color,
                        }}
                      >
                        {details.label.split(" ")[0]}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">
                        {rec.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold leading-snug mb-2 text-[var(--text-primary)]">
                      {rec.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mt-4 border-t border-[rgba(255,255,255,0.05)] pt-4">
                    <span className="text-xs text-[var(--text-muted)]">
                      Estimated: {rec.time}
                    </span>
                    <a
                      href="#"
                      className="text-xs font-semibold flex items-center gap-0.5 hover:underline"
                      style={{ color: details.color }}
                    >
                      Start <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
