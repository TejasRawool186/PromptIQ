"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShinyButton } from "@/components/ui/shiny-button";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { GlassCard } from "@/components/ui/glass-card";
import { NecessityGauge } from "@/components/necessity-gauge";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Shield,
  Layers,
  Rocket,
  Brain,
  Activity,
  Database,
  BarChart3,
  Users,
  Globe,
  Search,
  Workflow,
  Cpu,
  Lock,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Play,
  Check,
  Send,
  Loader2,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// ============================================================
// FAQ Data
// ============================================================
const FAQ_ITEMS = [
  {
    question: "How does PromptIQ route prompts to the optimal model?",
    answer: "Our routing gateway analyzes prompts for complexity, tokens, category, and historical user performance. Simple tasks are routed to cheaper local/edge models, while complex architecture queries are routed to deep intelligence models like Claude Opus. This operates with latency under 150ms.",
  },
  {
    question: "What is the Cognee memory layer, and why does it matter?",
    answer: "Cognee is our semantic memory engine. Instead of a basic key-value log, Cognee parses developer prompts into a connected knowledge graph (Users, Projects, Skill Domains). This enables team-wide semantic search, automated onboarding recommendations, and long-term organizational memory.",
  },
  {
    question: "Can PromptIQ run on-premise or with local models?",
    answer: "Yes, PromptIQ supports Ollama integration and local model routing. You can route sensitive codebase queries to self-hosted models, keeping your intellectual property entirely secure within your internal infrastructure.",
  },
  {
    question: "How does the Necessity Score help developer learning?",
    answer: "The Necessity Score (0-100) measures how critical AI was for a specific prompt. A low score (e.g. 20/100) indicates boilerplate tasks the developer could self-solve. Managers get aggregated skill mapping, while developers receive targeted documentation to learn concepts instead of relying blindly on copilot copy-pasting.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    }
  }, []);

  const handleLaunchClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/dashboard");
        return;
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/auth/google/url`);
      const data = await res.json();

      if (data.url) {
        if (data.mock) {
          window.location.href = `/auth/callback?code=mock_code_dev_sandbox`;
        } else {
          window.location.href = data.url;
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.warn("Failed to fetch auth URL, routing directly:", err);
      router.push("/dashboard");
    }
  };

  // Teaser form states
  const [teaserPrompt, setTeaserPrompt] = useState("");
  const [isTeaserAnalyzing, setIsTeaserAnalyzing] = useState(false);
  const [teaserResult, setTeaserResult] = useState<{
    necessity: number;
    category: string;
    model: string;
    cost: number;
    tip: string;
  } | null>(null);

  // FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Video modal simulation state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Mock teaser analysis function
  const handleTeaserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teaserPrompt.trim()) return;

    setIsTeaserAnalyzing(true);
    setTeaserResult(null);

    // Call API with fallback for simulated response if api backend is offline
    try {
      const { api } = await import("@/lib/api");
      const res = await api.analyzePrompt({
        prompt_text: teaserPrompt,
        user_id: "anonymous_teaser",
        project: "teaser_sandbox",
      });
      setTeaserResult({
        necessity: res.necessity_score,
        category: res.analysis.category,
        model: res.suggested_model,
        cost: res.analysis.estimated_cost,
        tip: res.learning_tips[0] || "Study patterns for this task to solve manually next time.",
      });
    } catch (err) {
      console.warn("FastAPI backend offline, falling back to client-side simulation.");
      // Client-side simulation based on prompt content
      setTimeout(() => {
        const text = teaserPrompt.toLowerCase();
        let necessity = 45;
        let category = "code_generation";
        let model = "Gemini Flash";
        let cost = 0.0015;
        let tip = "Learn multi-stage Docker caching to deploy faster.";

        if (text.includes("explain") || text.includes("how does") || text.includes("difference")) {
          necessity = 25;
          category = "learning";
          model = "Ollama Local";
          cost = 0.0;
          tip = "Read official documentation on this concept to internalize it.";
        } else if (text.includes("refactor") || text.includes("optimize") || text.includes("clean")) {
          necessity = 65;
          category = "refactoring";
          model = "Claude Opus";
          cost = 0.024;
          tip = "Practice composition and clean code rules for hooks.";
        } else if (text.includes("debug") || text.includes("error") || text.includes("broken")) {
          necessity = 75;
          category = "debugging";
          model = "GPT-4o";
          cost = 0.018;
          tip = "Use logging breakpoints to inspect call stacks.";
        } else if (text.includes("design") || text.includes("architecture") || text.includes("microservice")) {
          necessity = 85;
          category = "architecture";
          model = "Claude Opus";
          cost = 0.038;
          tip = "Review CQRS event schemas and transactional boundaries.";
        }

        setTeaserResult({ necessity, category, model, cost, tip });
      }, 1000);
    } finally {
      setIsTeaserAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-[#ef4444]/30 selection:text-white pb-20">
      {/* Background Grid & Light Reflections */}
      <div className="absolute inset-0 faint-grid pointer-events-none z-0" />
      
      {/* Left Top Spotlight */}
      <div className="absolute top-10 left-10 red-glow" />
      
      {/* Center Hero Spotlight */}
      <div className="absolute top-80 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-radial-gradient from-[#ef4444]/4 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* ============================================
         1. STICKY HEADER
         ============================================ */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020202]/65 backdrop-blur-xl transition-all select-none">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#b91c1c] flex items-center justify-center shadow-lg shadow-[#ef4444]/10">
              <Sparkles className="w-4 h-4 text-[#020202]" />
            </div>
            <span className="font-bold text-white tracking-tight text-lg">PromptIQ</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#teaser" className="hover:text-white transition-colors duration-200">Interactive Demo</a>
            <a href="#stats" className="hover:text-white transition-colors duration-200">ROI Impact</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          <button onClick={handleLaunchClick} className="border-none bg-transparent outline-none cursor-pointer">
            {isLoggedIn ? (
              <ShinyButton className="text-xs py-2 px-4">Go to Dashboard</ShinyButton>
            ) : (
              <div className="flex items-center gap-2 bg-[#ef4444] hover:bg-[#d33c3c] text-[#020202] text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-[#ef4444]/20 hover:scale-102">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.06 0 11.75-4.97 11.75-11.95 0-.81-.08-1.42-.18-1.765H12.24z"/>
                </svg>
                Sign In
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ============================================
         2. HERO SECTION
         ============================================ */}
      <section className="relative max-w-[1200px] mx-auto px-6 pt-20 pb-16 z-10 text-center select-none">
        {/* Editorial Subtitle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner mb-6 text-xs text-[#ef4444] font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
          Powered by Cognee Semantic Memory Layer
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          The Memory-Powered <br />
          <span className="gradient-text bg-gradient-to-r from-white via-slate-100 to-[#ef4444]">AI Governance Layer</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Capture developer prompts, store organizational technical memory, route requests to cost-optimal models, and track team-wide skill growth in real time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button onClick={handleLaunchClick} className="w-full sm:w-auto border-none bg-transparent outline-none cursor-pointer">
            {isLoggedIn ? (
              <ShinyButton className="w-full sm:w-auto px-8 py-3.5 text-sm shadow-xl">
                Enter Workspace <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </ShinyButton>
            ) : (
              <div className="flex items-center justify-center gap-2.5 bg-[#ef4444] hover:bg-[#d33c3c] text-[#020202] text-sm font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-[#ef4444]/25 hover:scale-102">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.06 0 11.75-4.97 11.75-11.95 0-.81-.08-1.42-.18-1.765H12.24z"/>
                </svg>
                Sign In with Google
              </div>
            )}
          </button>
          <a href="#features" className="w-full sm:w-auto">
            <ShinyButton variant="secondary" className="w-full sm:w-auto px-8 py-3.5 text-sm">
              Explore Features
            </ShinyButton>
          </a>
        </div>

        {/* Browser Showcase Preview */}
        <div className="relative max-w-5xl mx-auto stagger-2 animate-slide-up">
          {/* Backing spotlight grid glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[70%] h-[300px] bg-[#ef4444]/3 rounded-full blur-[80px] z-0" />
          
          <BrowserFrame glow={false} className="border-white/10 z-10">
            {/* Simulated Live App Frame */}
            <div className="bg-[#020202] p-6 text-left font-sans">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Workspace Analytics</h3>
                  <p className="text-xs text-[var(--text-muted)]">Active Cost Optimization & Performance Logs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md font-medium">Gateway Active</span>
                </div>
              </div>

              {/* Grid of stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="glass p-4 rounded-xl border-white/5">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Total Saving Generated</p>
                  <p className="text-xl font-bold text-[#ef4444] mt-1">$1,247.50</p>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-1 font-medium">
                    <TrendingUp className="w-2.5 h-2.5" /> +23.1% this week
                  </span>
                </div>
                <div className="glass p-4 rounded-xl border-white/5">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Gateway Prompts</p>
                  <p className="text-xl font-bold text-white mt-1">2,847</p>
                  <span className="text-[9px] text-[var(--text-muted)] mt-1 block">Avg latency 145ms</span>
                </div>
                <div className="glass p-4 rounded-xl border-white/5">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Avg Necessity Score</p>
                  <p className="text-xl font-bold text-[#F59E0B] mt-1">62.4<span className="text-xs text-[var(--text-muted)]">/100</span></p>
                  <span className="text-[9px] text-emerald-400 block mt-1 font-medium">Optimal balance index</span>
                </div>
              </div>

              {/* Graphic rows representing visual dashboard logs */}
              <div className="space-y-2.5">
                <div className="glass p-3 rounded-lg border-white/5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-[#ef4444]/10 text-[#ef4444] font-mono text-[9px]">DEVOPS</div>
                    <span className="text-slate-300 font-medium truncate max-w-xs md:max-w-md">Multi-stage Dockerfile for Next.js 14 deployment</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-mono">Claude Opus ➡️ Gemini Flash</span>
                    <span className="text-emerald-400 font-bold">Saved 92%</span>
                  </div>
                </div>

                <div className="glass p-3 rounded-lg border-white/5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-[#F59E0B]/10 text-[#F59E0B] font-mono text-[9px]">DATABASE</div>
                    <span className="text-slate-300 font-medium truncate max-w-xs md:max-w-md">Query optimization composite index missing user_id</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-mono">GPT-4o ➡️ Ollama Local</span>
                    <span className="text-emerald-400 font-bold">Saved 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>
      </section>

      {/* ============================================
         3. INTERACTIVE TEASER SECTION
         ============================================ */}
      <section id="teaser" className="max-w-[1000px] mx-auto px-6 py-20 z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Test the Prompt Routing Gateway</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Input a development prompt below to witness the necessity evaluation and optimal model selection live.
          </p>
        </div>

        <GlassCard className="max-w-2xl mx-auto border-white/5 p-6 stagger-3 animate-slide-up">
          <form onSubmit={handleTeaserSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={teaserPrompt}
                onChange={(e) => setTeaserPrompt(e.target.value)}
                placeholder="Paste a prompt here (e.g. 'How do I optimize a Postgres index?' or 'Write a custom React Context')..."
                rows={3}
                className="w-full bg-[#020202]/80 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-[#ef4444]/40 transition-colors placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-[10px] text-[var(--text-muted)]">
                Try topics like: <span className="text-slate-400 font-mono">VPC setup</span>, <span className="text-slate-400 font-mono">FastAPI boiler</span>, or <span className="text-slate-400 font-mono">WebSockets</span>
              </div>
              <button
                type="submit"
                disabled={isTeaserAnalyzing || !teaserPrompt.trim()}
                className="px-5 py-2.5 text-xs rounded-xl bg-gradient-to-r from-[#ef4444] to-[#b91c1c] text-[#020202] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-lg shadow-[#ef4444]/10"
              >
                {isTeaserAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Gateway...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Test Analyzer
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Interactive Output display card */}
          {teaserResult && (
            <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-4 flex justify-center">
                  <NecessityGauge score={teaserResult.necessity} size="md" />
                </div>
                
                <div className="sm:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] text-[var(--text-muted)]">Category:</span>
                    <Badge category={teaserResult.category} />
                    
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto">Estimated Cost:</span>
                    <span className="text-xs font-semibold font-mono text-[#ef4444]">
                      {teaserResult.cost > 0 ? `$${teaserResult.cost.toFixed(4)}` : "Free (Local)"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-1.5">
                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 font-medium uppercase tracking-wider">
                      <Cpu className="w-3.5 h-3.5 text-[#ef4444]" /> Suggested Model
                    </p>
                    <p className="text-sm font-bold text-white">{teaserResult.model}</p>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Learning Tip:</strong> {teaserResult.tip}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </section>

      {/* ============================================
         4. DETAILED FEATURES SECTION
         ============================================ */}
      <section id="features" className="max-w-[1200px] mx-auto px-6 py-20 z-10 relative select-none">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Precision Engineering for AI Operations</h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-lg mx-auto">
            Everything your team needs to route prompts, analyze consumption costs, secure codebases, and grow knowledge.
          </p>
        </div>

        {/* Feature 1: Model Router */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-28">
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex p-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444]">
              <Workflow className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Dynamic Model Routing</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Why use expensive Frontier models for standard boilerplate? Our gateway dynamically routes simple requests (like regex generation, YAML configs, basic syntax) to local models or mid-tier endpoints, reserving intelligence models exclusively for complex engineering challenges.
            </p>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Direct token savings of up to 40% automatically
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Multi-fallback queueing prevents rate-limit lockouts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Ollama connection for local execution offline
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <BrowserFrame glow className="border-white/5">
              <div className="bg-[#050505] p-5 font-mono text-[11px] leading-relaxed overflow-x-auto text-left">
                <p className="text-slate-500">// PromptIQ Intelligent Model Router</p>
                <p className="text-white"><span className="text-[#ef4444]">const</span> router = <span className="text-amber-400">new</span> <span className="text-[#ef4444]">PromptRouter</span>({`{`}</p>
                <p className="text-white">&nbsp;&nbsp;rules: {`[`}</p>
                <p className="text-white">&nbsp;&nbsp;&nbsp;&nbsp;{`{`} category: <span className="text-emerald-400">&apos;boilerplate&apos;</span>, routeTo: <span className="text-emerald-400">&apos;ollama/llama3&apos;</span> {`}`},</p>
                <p className="text-white">&nbsp;&nbsp;&nbsp;&nbsp;{`{`} complexity: <span className="text-[#ef4444]">&lt; 5</span>, routeTo: <span className="text-emerald-400">&apos;gemini/flash&apos;</span> {`}`},</p>
                <p className="text-white">&nbsp;&nbsp;&nbsp;&nbsp;{`{`} default: <span className="text-emerald-400">&apos;claude-3-5-sonnet&apos;</span> {`}`}</p>
                <p className="text-white">&nbsp;&nbsp;{`]`}</p>
                <p className="text-white">{`});`}</p>
                <br />
                <p className="text-slate-500">// Output latency check</p>
                <p className="text-emerald-400">✅ Dynamic routing finished in 12ms. Destination: gemini/flash</p>
              </div>
            </BrowserFrame>
          </div>
        </div>

        {/* Feature 2: Cognee Memory Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-28">
          <div className="lg:col-span-7 order-last lg:order-first">
            <BrowserFrame glow className="border-white/5">
              {/* Graphic node visualization layout */}
              <div className="bg-[#050505] p-6 h-[260px] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
                
                {/* Visual mock graph nodes */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-white text-xs font-semibold shadow-xl flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#ef4444]" /> Cognee Semantic Node
                  </div>

                  <div className="flex gap-12">
                    <div className="px-3 py-1 rounded-lg bg-slate-950 border border-[#ef4444]/30 text-[10px] text-slate-300 shadow-lg">
                      User: Alice (Frontend)
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-slate-950 border border-white/5 text-[10px] text-slate-300 shadow-lg">
                      Skill: React Context
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-slate-950 border border-white/5 text-[10px] text-slate-300 shadow-lg">
                      Project: Payment Gateway
                    </div>
                  </div>
                </div>

                {/* SVG connection lines overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line x1="50%" y1="35%" x2="25%" y2="65%" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" />
                  <line x1="50%" y1="35%" x2="50%" y2="65%" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" strokeDasharray="3" />
                  <line x1="50%" y1="35%" x2="75%" y2="65%" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
                </svg>
              </div>
            </BrowserFrame>
          </div>
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex p-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444]">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Cognee Semantic Memory</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Every prompt processed through PromptIQ is analyzed, categorized, and structured inside a semantic database using Cognee memory layer. This turns disconnected queries into structured corporate context, preventing developers from re-generating identical solutions repeatedly.
            </p>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Build graph relationships between users and topics
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Automatic semantic lookup of past solutions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Prevent repetitive prompt loops across teams
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: Skill Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex p-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444]">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Skill Mapping & Dependency</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Is your team learning or just copy-pasting? PromptIQ maps prompt logs to developer skill domains, highlighting dependency issues where developers frequently prompt for topics they should self-solve, allowing you to suggest target courses.
            </p>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Auto-evaluate developer capability levels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Continuous necessity assessment index (0-100)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#ef4444]" /> Automated learning tips suggested inline
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <BrowserFrame glow className="border-white/5">
              <div className="bg-[#050505] p-5 text-left font-sans space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="font-bold text-white">Competency Map</span>
                  <span className="text-[10px] text-[#ef4444]">Alice Chen (Senior Frontend)</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                      <span>Frontend Development</span>
                      <span className="text-emerald-400">Competent (78/100)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: "78%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                      <span>DevOps & Deployments</span>
                      <span className="text-[#ef4444]">Developing (42/100)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#ef4444] rounded-full" style={{ width: "42%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* ============================================
         5. STATISTICS BANNER SECTION
         ============================================ */}
      <section id="stats" className="max-w-[1200px] mx-auto px-6 py-24 z-10 relative select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="border-white/5 text-center p-8">
            <p className="text-5xl font-extrabold text-[#ef4444] font-mono mb-2">40%</p>
            <p className="text-sm font-semibold text-white mb-1">Cost Reduction</p>
            <p className="text-xs text-[var(--text-muted)]">Average monthly API spend reduction from intelligent routing overrides.</p>
          </GlassCard>

          <GlassCard className="border-white/5 text-center p-8">
            <p className="text-5xl font-extrabold text-[#ef4444] font-mono mb-2">30%</p>
            <p className="text-sm font-semibold text-white mb-1">Faster Recall</p>
            <p className="text-xs text-[var(--text-muted)]">Accelerated search lookup for repeated questions using Cognee memory.</p>
          </GlassCard>

          <GlassCard className="border-white/5 text-center p-8">
            <p className="text-5xl font-extrabold text-[#ef4444] font-mono mb-2">50%</p>
            <p className="text-sm font-semibold text-white mb-1">Knowledge Retention</p>
            <p className="text-xs text-[var(--text-muted)]">Increased team knowledge-retention index from targeted learning tips.</p>
          </GlassCard>
        </div>
      </section>

      {/* ============================================
         6. VIDEO SECTION / DEMO VIDEO SIMULATOR
         ============================================ */}
      <section className="max-w-[1000px] mx-auto px-6 py-16 z-10 relative select-none">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Watch PromptIQ in Action</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            See how the CLI captures prompt inputs and feeds them into the Cognee backend live.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto rounded-2xl border border-white/5 bg-white/[0.01] p-2 overflow-hidden shadow-2xl">
          {/* Inner Video Simulator Frame */}
          <div className="aspect-video rounded-xl bg-slate-950 border border-white/5 relative flex items-center justify-center overflow-hidden">
            {isVideoPlaying ? (
              <div className="absolute inset-0 p-4 font-mono text-xs text-left bg-black flex flex-col justify-between overflow-y-auto leading-relaxed select-none">
                <div className="space-y-1">
                  <p className="text-slate-500">$ pip install promptiq-cli</p>
                  <p className="text-slate-400">Installing packages...</p>
                  <p className="text-[#ef4444] font-semibold">Done. CLI successfully linked to account dev1.</p>
                  <br />
                  <p className="text-slate-500">$ promptiq --analyze &quot;write a rust rocket endpoint to decode webhook&quot;</p>
                  <p className="text-slate-400">Evaluating prompt details...</p>
                  <p className="text-white">🚀 [Category]: code_generation</p>
                  <p className="text-white">✅ [Necessity Score]: 68/100 (Recommended Route)</p>
                  <p className="text-emerald-400">🎯 [Optimal Model]: Claude Opus</p>
                  <p className="text-slate-400">Recording transaction parameters to Cognee memory layer...</p>
                  <p className="text-emerald-400">Memory node registered (ID: node_92ab8d)</p>
                </div>
                <div className="text-right mt-4">
                  <button 
                    onClick={() => setIsVideoPlaying(false)}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider underline border-none bg-transparent cursor-pointer"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Background graphic placeholder */}
                <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                
                {/* Play trigger button */}
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="group z-10 w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-[#ef4444]/10"
                >
                  <Play className="w-5 h-5 text-white fill-white group-hover:text-[#ef4444] group-hover:fill-[#ef4444] transition-colors" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-secondary)] font-medium select-none">
                  Click to play interactive command demo
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================
         7. TIMELINE / ROADMAP SECTION
         ============================================ */}
      <section className="max-w-[800px] mx-auto px-6 py-20 z-10 relative select-none">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">Product Roadmap</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Our vision for the future of team intelligence and AI developer metrics.
          </p>
        </div>

        {/* Roadmap milestones */}
        <div className="relative border-l border-white/5 pl-8 space-y-12">
          {/* Milestone 1 */}
          <div className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-[#020202] border-2 border-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center justify-center" />
            <GlassCard className="border-white/5 p-5">
              <span className="text-[10px] text-[#ef4444] font-bold uppercase tracking-wider mb-1 block">Phase 1: Core Integration (Completed)</span>
              <h4 className="text-base font-bold text-white mb-2">Developer Capture Gateway</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                FastAPI proxy integration with deep analysis pipelines. Captures prompts, computes necessity scores, routes dynamically to local LLMs or Frontier servers, and stores telemetry.
              </p>
            </GlassCard>
          </div>

          {/* Milestone 2 */}
          <div className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-[#020202] border-2 border-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center justify-center animate-pulse" />
            <GlassCard className="border-white/5 p-5">
              <span className="text-[10px] text-[#ef4444] font-bold uppercase tracking-wider mb-1 block">Phase 2: Semantic Graph (Active)</span>
              <h4 className="text-base font-bold text-white mb-2">Cognee Knowledge Core</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Integrating the Cognee memory engine to extract entity relationships, link users to specific codebase repositories, and build search vectors over the team prompt history logs.
              </p>
            </GlassCard>
          </div>

          {/* Milestone 3 */}
          <div className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-[#020202] border-2 border-white/10 flex items-center justify-center" />
            <GlassCard className="border-white/5 p-5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1 block">Phase 3: Recommendations (Q3 2026)</span>
              <h4 className="text-base font-bold text-white mb-2">AI-Driven Learning Paths</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Automated skill recommendations mapping to external APIs (Pluralsight, O&apos;Reilly) to route developers from repetitive code prompts to customized tutorials and growth tracks.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ============================================
         8. TESTIMONIALS SECTION
         ============================================ */}
      <section className="max-w-[1200px] mx-auto px-6 py-20 z-10 relative select-none">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Reviewed by Tech Leads</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
            See how teams use PromptIQ to save on AI costs while keeping code secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="border-white/5 flex flex-col justify-between p-6">
            <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed mb-6">
              &quot;PromptIQ changed how we utilize LLMs. We automatically saved 38% in API costs in the first month by routing boilerplate queries to local edge models.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                SL
              </div>
              <div>
                <p className="text-xs font-bold text-white">Sarah Lin</p>
                <p className="text-[10px] text-[var(--text-muted)]">CTO, AppScale</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-white/5 flex flex-col justify-between p-6">
            <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed mb-6">
              &quot;The Cognee semantic layer has saved our onboarding team hours. New hires search past prompt graphs to find out how complex internal APIs were structured.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                MK
              </div>
              <div>
                <p className="text-xs font-bold text-white">Marcus King</p>
                <p className="text-[10px] text-[var(--text-muted)]">Engineering Lead, FinFlow</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-white/5 flex flex-col justify-between p-6">
            <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed mb-6">
              &quot;The Necessity scoring is amazing. We identified that developers were prompting for standard boilerplate they should self-solve. It helped us focus training.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                DV
              </div>
              <div>
                <p className="text-xs font-bold text-white">Deepak Verma</p>
                <p className="text-[10px] text-[var(--text-muted)]">VP of Engineering, VeloTech</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ============================================
         9. PRICING SECTION
         ============================================ */}
      <section id="pricing" className="max-w-[1000px] mx-auto px-6 py-20 z-10 relative select-none">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">Transparent Tier Plans</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
            Choose the right model routing scale for your development team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Plan 1 */}
          <GlassCard className="border-white/5 p-6 space-y-6 relative overflow-hidden">
            <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-white/5 text-[var(--text-muted)] text-[8px] font-bold uppercase tracking-wider">Coming Soon</span>
            <div>
              <h4 className="text-sm font-bold text-white">Free Sandbox</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">For single sandbox developers.</p>
            </div>
            <p className="text-3xl font-extrabold text-white">$0 <span className="text-xs text-[var(--text-muted)] font-normal">/ month</span></p>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Up to 500 prompts / month</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Basic necessity score</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Dynamic routing logs</li>
            </ul>
            <button disabled className="w-full block py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-[var(--text-muted)] bg-white/5 cursor-not-allowed opacity-50">
              Coming Soon
            </button>
          </GlassCard>

          {/* Plan 2: Featured Plan */}
          <GlassCard className="border-[#ef4444]/40 bg-[#ef4444]/[0.01] p-7 space-y-6 relative shadow-[0_30px_70px_rgba(239,68,68,0.06)] scale-105 overflow-hidden">
            <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] text-[8px] font-bold uppercase tracking-wider">Coming Soon</span>
            {/* Spotlight label */}
            <span className="absolute -top-3 left-1/3 -translate-x-1/2 px-3 py-1 rounded-full bg-[#ef4444] text-[#020202] text-[9px] font-bold uppercase tracking-wider">Most Popular</span>
            <div>
              <h4 className="text-base font-bold text-white">Developer Team</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">For active engineering groups.</p>
            </div>
            <p className="text-4xl font-extrabold text-white">$49 <span className="text-xs text-[var(--text-muted)] font-normal">/ month</span></p>
            <ul className="space-y-2.5 text-[11px] text-slate-200">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Unlimited prompts / month</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Cognee memory graph connection</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Advanced team skill profiling</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Custom latency threshold config</li>
            </ul>
            <button disabled className="w-full block py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-[var(--text-muted)] bg-white/5 cursor-not-allowed opacity-50">
              Coming Soon
            </button>
          </GlassCard>

          {/* Plan 3 */}
          <GlassCard className="border-white/5 p-6 space-y-6 relative overflow-hidden">
            <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-white/5 text-[var(--text-muted)] text-[8px] font-bold uppercase tracking-wider">Coming Soon</span>
            <div>
              <h4 className="text-sm font-bold text-white">Enterprise</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">For large enterprise security.</p>
            </div>
            <p className="text-3xl font-extrabold text-white">Custom <span className="text-xs text-[var(--text-muted)] font-normal"> pricing</span></p>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> On-premise Docker deployment</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Dedicated local model nodes</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> Custom security filters & sanitizing</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#ef4444]" /> 24/7 SLA governance support</li>
            </ul>
            <button disabled className="w-full block py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-[var(--text-muted)] bg-white/5 cursor-not-allowed opacity-50">
              Coming Soon
            </button>
          </GlassCard>
        </div>
      </section>

      {/* ============================================
         10. FAQ SECTION
         ============================================ */}
      <section id="faq" className="max-w-[700px] mx-auto px-6 py-20 z-10 relative select-none">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Everything you need to know about the AI gateway.
          </p>
        </div>

        <div className="divide-y divide-white/5 border-t border-b border-white/5">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-4">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between py-2 text-left font-semibold text-white hover:text-[#ef4444] transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="text-sm">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#ef4444]" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed pb-2">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================
         11. FINAL CALL TO ACTION
         ============================================ */}
      <section className="max-w-[900px] mx-auto px-6 py-20 z-10 relative text-center select-none">
        {/* Glowing backdrop spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-radial-gradient from-[#ef4444]/5 to-transparent blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Build Long-Term <br />
            Team Technical Memory Today
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Initialize your team routing rules and connect Cognee memory. Reduce LLM spend while boosting developer growth.
          </p>
          <div className="pt-4">
            <button onClick={handleLaunchClick} className="border-none bg-transparent outline-none">
              <ShinyButton className="px-10 py-4 text-sm shadow-xl">
                Get Started for Free <ArrowRight className="w-4 h-4 ml-1.5" />
              </ShinyButton>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================
         12. MINIMAL LUXURY FOOTER
         ============================================ */}
      <footer className="border-t border-white/5 bg-[#020202] pt-16 pb-8 select-none z-10 relative">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#ef4444] to-[#b91c1c] flex items-center justify-center shadow-md shadow-[#ef4444]/10">
                <Sparkles className="w-3.5 h-3.5 text-[#020202]" />
              </div>
              <span className="font-bold text-white tracking-tight text-sm">PromptIQ</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              The Memory-Powered AI Governance Layer for Engineering Teams. Build organizational wisdom.
            </p>
          </div>

          {/* Links Col 1 */}
          <div>
            <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)] font-medium">
              <li><a href="#features" className="hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#teaser" className="hover:text-white transition-colors duration-200">Sandbox Teaser</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing Tiers</a></li>
              <li><button onClick={handleLaunchClick} className="hover:text-white transition-colors duration-200 border-none bg-transparent outline-none p-0 text-left font-medium text-xs text-[var(--text-muted)] cursor-pointer">Active Workspace</button></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-4">Governance</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)] font-medium">
              <li><a href="https://github.com/cognee-io/cognee" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Cognee Graph</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">MCP SDK API</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors duration-200">Help Core</a></li>
              <li><a href="mailto:support@promptiq.dev" className="hover:text-white transition-colors duration-200">Direct Support</a></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div>
            <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-4">Security</h5>
            <ul className="space-y-2.5 text-xs text-[var(--text-muted)] font-medium">
              <li><span className="text-slate-400">SOC2 Type II compliant</span></li>
              <li><span className="text-slate-400">GDPR Deleted policy</span></li>
              <li><span className="text-slate-400">Data anonymized gateway</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--text-muted)] font-medium">
          <p>© 2026 PromptIQ Technologies Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="hover:text-white transition-colors cursor-default">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-default">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-default">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
