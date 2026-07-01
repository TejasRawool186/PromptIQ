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
// Realistic Mock Data — 20 developer prompts
// ============================================================

const MOCK_PROMPTS = [
  {
    id: "p1",
    prompt_text: "Refactor the useAuth hook to use React Context with TypeScript generics instead of prop drilling through 5 component layers.",
    category: "refactoring",
    skill_domain: "frontend",
    complexity_score: 7,
    necessity_score: 45,
    model_used: "Claude Opus",
    recommended_model: "Claude Opus",
    token_count: 1842,
    estimated_cost: 0.0234,
    estimated_manual_time_minutes: 45,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    response_summary: "Provided a complete Context-based auth implementation with typed Provider, custom hook, and migration guide.",
    learning_recommendations: ["Study React Context patterns", "Learn TypeScript generic constraints"],
  },
  {
    id: "p2",
    prompt_text: "Debug this PostgreSQL query that's causing a sequential scan on a 10M row table instead of using the composite index on (user_id, created_at).",
    category: "debugging",
    skill_domain: "database",
    complexity_score: 6,
    necessity_score: 72,
    model_used: "GPT-4o",
    recommended_model: "GPT-4o",
    token_count: 1256,
    estimated_cost: 0.0156,
    estimated_manual_time_minutes: 30,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    response_summary: "Identified implicit type casting preventing index usage. Suggested EXPLAIN ANALYZE and provided corrected query.",
    learning_recommendations: ["Study PostgreSQL query planning", "Learn about index selectivity"],
  },
  {
    id: "p3",
    prompt_text: "Generate a multi-stage Dockerfile for Next.js 14 with standalone output, non-root user, and proper layer caching for node_modules.",
    category: "code_generation",
    skill_domain: "devops",
    complexity_score: 5,
    necessity_score: 38,
    model_used: "Gemini Flash",
    recommended_model: "Gemini Flash",
    token_count: 890,
    estimated_cost: 0.0045,
    estimated_manual_time_minutes: 20,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    response_summary: "Generated optimized Dockerfile with 3 stages: deps, build, runtime. Image size reduced to ~180MB.",
    learning_recommendations: ["Learn Docker multi-stage builds"],
  },
  {
    id: "p4",
    prompt_text: "Write comprehensive Jest unit tests for the PaymentService class that mocks the Stripe SDK, handles webhook signature verification, and tests all error paths.",
    category: "code_generation",
    skill_domain: "testing",
    complexity_score: 8,
    necessity_score: 61,
    model_used: "Claude Opus",
    recommended_model: "Claude Opus",
    token_count: 2890,
    estimated_cost: 0.0312,
    estimated_manual_time_minutes: 60,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    response_summary: "Created 12 test cases covering payment creation, refunds, webhook handling, and error scenarios with full Stripe mock setup.",
    learning_recommendations: ["Practice test-driven development", "Study Stripe webhook patterns"],
  },
  {
    id: "p5",
    prompt_text: "Design a microservices architecture for an e-commerce platform with event-driven communication using RabbitMQ, CQRS pattern, and saga orchestration for orders.",
    category: "architecture",
    skill_domain: "backend",
    complexity_score: 9,
    necessity_score: 85,
    model_used: "GPT-4o",
    recommended_model: "Claude Opus",
    token_count: 3456,
    estimated_cost: 0.0456,
    estimated_manual_time_minutes: 120,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    response_summary: "Detailed architecture with 6 bounded contexts, event schemas, saga flow diagrams, and infrastructure recommendations.",
    learning_recommendations: ["Study CQRS and Event Sourcing", "Learn saga patterns"],
  },
  {
    id: "p6",
    prompt_text: "Create a custom React hook useInfiniteScroll that uses IntersectionObserver for efficient infinite scrolling with proper cleanup and loading states.",
    category: "code_generation",
    skill_domain: "frontend",
    complexity_score: 6,
    necessity_score: 35,
    model_used: "GPT-4o-mini",
    recommended_model: "GPT-4o-mini",
    token_count: 1100,
    estimated_cost: 0.0023,
    estimated_manual_time_minutes: 25,
    created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    response_summary: "Hook with IntersectionObserver, cleanup logic, configurable threshold, and TypeScript types.",
    learning_recommendations: ["Study IntersectionObserver API"],
  },
  {
    id: "p7",
    prompt_text: "Explain the difference between optimistic and pessimistic locking in PostgreSQL and when to use each in a high-concurrency booking system.",
    category: "learning",
    skill_domain: "database",
    complexity_score: 5,
    necessity_score: 28,
    model_used: "Gemini Flash",
    recommended_model: "Ollama Local",
    token_count: 780,
    estimated_cost: 0.0012,
    estimated_manual_time_minutes: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    response_summary: "Clear explanation with code examples for SELECT FOR UPDATE (pessimistic) and version column (optimistic) approaches.",
    learning_recommendations: ["Read PostgreSQL concurrency docs", "Practice with transaction isolation levels"],
  },
  {
    id: "p8",
    prompt_text: "Set up a GitHub Actions CI/CD pipeline with matrix testing for Node 18/20, Docker build and push to ECR, and automatic ECS deployment on main branch.",
    category: "code_generation",
    skill_domain: "devops",
    complexity_score: 7,
    necessity_score: 55,
    model_used: "Claude Opus",
    recommended_model: "GPT-4o",
    token_count: 2100,
    estimated_cost: 0.0289,
    estimated_manual_time_minutes: 50,
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    response_summary: "Complete workflow YAML with test, build, and deploy jobs. Includes AWS credential management and rollback strategy.",
    learning_recommendations: ["Learn GitHub Actions workflow syntax", "Study AWS ECS deployment patterns"],
  },
  {
    id: "p9",
    prompt_text: "Generate boilerplate CRUD endpoints for a User resource in FastAPI with Pydantic v2 models, SQLAlchemy async, and proper error handling.",
    category: "boilerplate",
    skill_domain: "backend",
    complexity_score: 4,
    necessity_score: 22,
    model_used: "GPT-4o-mini",
    recommended_model: "Ollama Local",
    token_count: 1450,
    estimated_cost: 0.0019,
    estimated_manual_time_minutes: 20,
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    response_summary: "Complete CRUD with router, schemas, service layer, and HTTP exception handling. Includes pagination.",
    learning_recommendations: ["You know FastAPI well — consider self-solving boilerplate tasks"],
  },
  {
    id: "p10",
    prompt_text: "Help me understand and fix this race condition in our WebSocket connection manager where simultaneous disconnects cause a ConcurrentModificationError.",
    category: "debugging",
    skill_domain: "backend",
    complexity_score: 8,
    necessity_score: 78,
    model_used: "Claude Opus",
    recommended_model: "Claude Opus",
    token_count: 2340,
    estimated_cost: 0.0298,
    estimated_manual_time_minutes: 60,
    created_at: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
    response_summary: "Identified dict mutation during iteration. Solution: asyncio.Lock + connection snapshot pattern.",
    learning_recommendations: ["Study asyncio synchronization primitives", "Learn concurrent data structure patterns"],
  },
  {
    id: "p11",
    prompt_text: "Write API documentation in OpenAPI 3.0 format for our authentication endpoints including OAuth2, JWT refresh, and API key flows.",
    category: "documentation",
    skill_domain: "backend",
    complexity_score: 5,
    necessity_score: 42,
    model_used: "GPT-4o",
    recommended_model: "GPT-4o-mini",
    token_count: 1680,
    estimated_cost: 0.0198,
    estimated_manual_time_minutes: 40,
    created_at: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
    response_summary: "Complete OpenAPI spec with security schemes, request/response schemas, and example values.",
    learning_recommendations: ["Familiarize with OpenAPI 3.0 spec", "Use tools like Swagger Editor"],
  },
  {
    id: "p12",
    prompt_text: "Implement a Redis-backed rate limiter middleware for Express.js using sliding window algorithm with configurable limits per API key.",
    category: "code_generation",
    skill_domain: "backend",
    complexity_score: 7,
    necessity_score: 58,
    model_used: "GPT-4o",
    recommended_model: "GPT-4o",
    token_count: 1920,
    estimated_cost: 0.0245,
    estimated_manual_time_minutes: 45,
    created_at: new Date(Date.now() - 1000 * 60 * 1080).toISOString(),
    response_summary: "Sliding window rate limiter with Redis sorted sets, configurable window and max requests, and proper headers.",
    learning_recommendations: ["Study rate limiting algorithms", "Learn Redis sorted set operations"],
  },
  {
    id: "p13",
    prompt_text: "Add ARIA labels, keyboard navigation, and screen reader support to our custom dropdown menu component built with Headless UI.",
    category: "refactoring",
    skill_domain: "frontend",
    complexity_score: 6,
    necessity_score: 50,
    model_used: "Claude Opus",
    recommended_model: "GPT-4o-mini",
    token_count: 1540,
    estimated_cost: 0.0201,
    estimated_manual_time_minutes: 35,
    created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    response_summary: "Added proper ARIA roles, keyboard handlers (Arrow/Escape/Enter), focus management, and live region announcements.",
    learning_recommendations: ["Study WAI-ARIA Authoring Practices", "Learn keyboard interaction patterns"],
  },
  {
    id: "p14",
    prompt_text: "Configure Terraform modules for a production AWS VPC with public/private subnets, NAT gateway, security groups, and VPC flow logs to CloudWatch.",
    category: "code_generation",
    skill_domain: "devops",
    complexity_score: 8,
    necessity_score: 73,
    model_used: "GPT-4o",
    recommended_model: "Claude Opus",
    token_count: 2680,
    estimated_cost: 0.0345,
    estimated_manual_time_minutes: 75,
    created_at: new Date(Date.now() - 1000 * 60 * 1320).toISOString(),
    response_summary: "Modular Terraform with variables for CIDR blocks, AZ count, and tagging strategy. Includes outputs for subnet IDs.",
    learning_recommendations: ["Study AWS VPC networking", "Practice Terraform module composition"],
  },
  {
    id: "p15",
    prompt_text: "Implement input validation and sanitization for our Express API to prevent XSS, SQL injection, and prototype pollution attacks.",
    category: "code_generation",
    skill_domain: "security",
    complexity_score: 7,
    necessity_score: 68,
    model_used: "Claude Opus",
    recommended_model: "Claude Opus",
    token_count: 1890,
    estimated_cost: 0.0267,
    estimated_manual_time_minutes: 40,
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    response_summary: "Middleware chain with express-validator, DOMPurify for HTML, parameterized queries, and prototype pollution guard.",
    learning_recommendations: ["Study OWASP Top 10", "Learn about Content Security Policy"],
  },
  {
    id: "p16",
    prompt_text: "Build a real-time collaborative text editor component using Yjs CRDT with WebSocket provider and awareness (cursor/selection sync).",
    category: "code_generation",
    skill_domain: "frontend",
    complexity_score: 9,
    necessity_score: 88,
    model_used: "Claude Opus",
    recommended_model: "Claude Opus",
    token_count: 3200,
    estimated_cost: 0.0412,
    estimated_manual_time_minutes: 90,
    created_at: new Date(Date.now() - 1000 * 60 * 1560).toISOString(),
    response_summary: "Complete implementation with Yjs document, WebSocket provider, cursor awareness, undo/redo, and conflict-free merging.",
    learning_recommendations: ["Study CRDTs and Yjs architecture", "Learn about operational transformation vs CRDT"],
  },
  {
    id: "p17",
    prompt_text: "Create a Python script to migrate data from MongoDB to PostgreSQL, mapping nested documents to normalized tables with foreign key relationships.",
    category: "code_generation",
    skill_domain: "database",
    complexity_score: 7,
    necessity_score: 62,
    model_used: "GPT-4o",
    recommended_model: "GPT-4o",
    token_count: 2100,
    estimated_cost: 0.0278,
    estimated_manual_time_minutes: 55,
    created_at: new Date(Date.now() - 1000 * 60 * 1680).toISOString(),
    response_summary: "Migration script with pymongo reader, SQLAlchemy writer, document flattening, and batch insert with error recovery.",
    learning_recommendations: ["Study data normalization principles", "Learn ETL best practices"],
  },
  {
    id: "p18",
    prompt_text: "Set up a machine learning pipeline with scikit-learn for customer churn prediction including feature engineering, model selection, and cross-validation.",
    category: "code_generation",
    skill_domain: "ml_ai",
    complexity_score: 8,
    necessity_score: 76,
    model_used: "GPT-4o",
    recommended_model: "Claude Opus",
    token_count: 2750,
    estimated_cost: 0.0356,
    estimated_manual_time_minutes: 70,
    created_at: new Date(Date.now() - 1000 * 60 * 1800).toISOString(),
    response_summary: "End-to-end pipeline with feature scaling, encoding, model comparison (RF, XGBoost, LR), GridSearchCV, and evaluation metrics.",
    learning_recommendations: ["Study feature engineering techniques", "Learn about model evaluation metrics"],
  },
  {
    id: "p19",
    prompt_text: "Generate TypeScript types and Zod validation schemas from our existing OpenAPI specification for the frontend API client.",
    category: "boilerplate",
    skill_domain: "frontend",
    complexity_score: 4,
    necessity_score: 25,
    model_used: "GPT-4o-mini",
    recommended_model: "Ollama Local",
    token_count: 980,
    estimated_cost: 0.0015,
    estimated_manual_time_minutes: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 1920).toISOString(),
    response_summary: "Generated 15 type interfaces and Zod schemas with proper optional fields and enum types.",
    learning_recommendations: ["Consider using openapi-typescript-codegen for automation"],
  },
  {
    id: "p20",
    prompt_text: "Write a comprehensive README.md for our open-source project including badges, installation, API reference, contributing guide, and architecture diagram in Mermaid.",
    category: "documentation",
    skill_domain: "backend",
    complexity_score: 4,
    necessity_score: 30,
    model_used: "Gemini Flash",
    recommended_model: "Gemini Flash",
    token_count: 1100,
    estimated_cost: 0.0034,
    estimated_manual_time_minutes: 30,
    created_at: new Date(Date.now() - 1000 * 60 * 2040).toISOString(),
    response_summary: "Full README with shields.io badges, quickstart guide, API docs table, Mermaid architecture diagram, and MIT license.",
    learning_recommendations: ["Practice writing documentation independently"],
  },
];

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
