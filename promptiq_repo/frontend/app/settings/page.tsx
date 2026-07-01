"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/badge";
import {
  Settings,
  Key,
  Database,
  Cpu,
  Save,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  PlayCircle,
} from "lucide-react";

// ============================================================
// Model Pricing Defaults
// ============================================================

const INITIAL_PRICING = [
  { tier: "Premium", model: "gpt-5.4-pro", input_price: 0.03, output_price: 0.18 },
  { tier: "Premium", model: "o3-pro", input_price: 0.02, output_price: 0.08 },
  { tier: "Premium", model: "claude-opus", input_price: 0.005, output_price: 0.025 },
  { tier: "Premium", model: "claude-sonnet", input_price: 0.003, output_price: 0.015 },
  { tier: "Premium", model: "gpt-5.2", input_price: 0.00175, output_price: 0.014 },
  { tier: "Premium", model: "gemini-pro", input_price: 0.0025, output_price: 0.015 },
  { tier: "Mid-Tier", model: "gemini-flash", input_price: 0.0015, output_price: 0.009 },
  { tier: "Mid-Tier", model: "claude-haiku", input_price: 0.001, output_price: 0.005 },
  { tier: "Mid-Tier", model: "deepseek-v4-pro", input_price: 0.000435, output_price: 0.00087 },
  { tier: "Mid-Tier", model: "gpt-4.1-mini", input_price: 0.0004, output_price: 0.0016 },
  { tier: "Mid-Tier", model: "gpt-4o-mini", input_price: 0.00015, output_price: 0.0006 },
  { tier: "Local", model: "ollama/llama3", input_price: 0.0, output_price: 0.0 },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("promptiq-dev-key-change-me");
  const [llmApiKey, setLlmApiKey] = useState("••••••••••••••••••••••••••••");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showLlmApiKey, setShowLlmApiKey] = useState(false);
  const [pricing, setPricing] = useState(INITIAL_PRICING);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection & Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let active = true;
    import("@/lib/api").then(({ api }) => {
      api.checkHealth()
        .then((res) => {
          if (active) {
            setConnectionStatus(res.status === "healthy" ? "online" : "offline");
          }
        })
        .catch(() => {
          if (active) setConnectionStatus("offline");
        });
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const { api } = await import("@/lib/api");
      const res = await api.seedDemoDatabase();
      setSeedResult(`Successfully seeded database with ${res.seeded_count} developer prompts!`);
    } catch (err: any) {
      setSeedResult(`Failed to seed: ${err.message || err}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePriceChange = (index: number, field: "input_price" | "output_price", val: string) => {
    const updated = [...pricing];
    updated[index] = {
      ...updated[index],
      [field]: parseFloat(val) || 0,
    };
    setPricing(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-[var(--text-secondary)]">
          Manage your API integrations, Cognee connection settings, and LLM pricing rates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column — Credentials & Connection */}
          <div className="lg:col-span-6 space-y-8">
            {/* API Keys Configuration */}
            <div className="glass-card p-6 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
                <Key className="w-5 h-5 text-brand-400" /> API Credentials
              </h3>

              {/* PromptIQ Developer Key */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                  PromptIQ X-API-Key <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl py-3 pl-4 pr-16 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-3 text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Cognee Backend LLM Key */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                  LLM Provider API Key (Cognee & Routing) <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </label>
                <div className="relative">
                  <input
                    type={showLlmApiKey ? "text" : "password"}
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl py-3 pl-4 pr-16 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLlmApiKey(!showLlmApiKey)}
                    className="absolute right-4 top-3 text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    {showLlmApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Status Panel */}
            <div className="glass-card p-6 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
                <Database className="w-5 h-5 text-brand-400" /> Cognee Integration Status
              </h3>

              <div className="flex items-center justify-between bg-white/[0.015] border border-[rgba(255,255,255,0.03)] rounded-xl p-4">
                <div>
                  <h4 className="text-sm font-semibold">Memory Server Connection</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Connecting to Cognee local instance: http://localhost:8000
                  </p>
                </div>
                <StatusBadge 
                  status={connectionStatus === "online" ? "online" : connectionStatus === "checking" ? "online" : "offline"} 
                  label={connectionStatus === "online" ? "Connected" : connectionStatus === "checking" ? "Checking..." : "Offline"} 
                />
              </div>

              <div className="space-y-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Vector Storage Database:</span>
                  <span className="font-bold text-[var(--text-primary)]">LanceDB (Local)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Graph Database Engine:</span>
                  <span className="font-bold text-[var(--text-primary)]">NetworkX (Local In-Memory)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">Embedding Engine:</span>
                  <span className="font-bold text-[var(--text-primary)]">Gemini text-embedding-004</span>
                </div>
              </div>

              {/* Seed Demo Database Panel */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-brand-400" /> Demo Database Initialization
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Seed your Cognee memory graph and prompt database with 20 realistic developer interactions to view populated charts.
                </p>
                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={isSeeding || connectionStatus !== "online"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed border border-brand-500/30 hover:border-brand-500/50 text-brand-300 rounded-xl text-xs font-bold transition-all"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Seeding Knowledge Graph...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" /> Seed Demo Database
                    </>
                  )}
                </button>
                {seedResult && (
                  <p className="text-[11px] text-brand-400 font-medium bg-brand-500/5 border border-brand-500/10 rounded-lg p-2.5 text-center">
                    {seedResult}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column — Model pricing configuration */}
          <div className="lg:col-span-6">
            <div className="glass-card p-6 space-y-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
                  <Cpu className="w-5 h-5 text-brand-400" /> LLM Pricing Configuration
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-2 mb-4 leading-relaxed">
                  Customize token pricing rates (per 1,000 tokens) used to compute Estimated AI Costs and ROI savings in analytics.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)] text-[var(--text-muted)] font-semibold uppercase">
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3">Input ($/1K)</th>
                        <th className="py-2.5 px-3">Output ($/1K)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.01] transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {row.model}
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                              {row.tier}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              step="0.000001"
                              value={row.input_price}
                              onChange={(e) => handlePriceChange(idx, "input_price", e.target.value)}
                              className="w-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg py-1 px-2 text-xs focus:outline-none focus:border-brand-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              step="0.000001"
                              value={row.output_price}
                              onChange={(e) => handlePriceChange(idx, "output_price", e.target.value)}
                              className="w-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg py-1 px-2 text-xs focus:outline-none focus:border-brand-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="mt-6 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex gap-3 text-xs text-amber-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="leading-relaxed">
                  <strong>Important:</strong> Changing pricing parameters will update future prompt cost calculations. Graph data stored historically in Cognee will preserve its original cost properties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex items-center justify-end gap-4 border-t border-[rgba(255,255,255,0.06)] pt-6">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
              <CheckCircle className="w-4 h-4" /> Settings updated successfully
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 active:scale-95 transition-all text-sm font-semibold rounded-xl text-white shadow-lg shadow-brand-500/25"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
