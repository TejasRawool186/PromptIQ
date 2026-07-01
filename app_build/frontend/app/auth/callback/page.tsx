"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code found in the redirect URL.");
      return;
    }

    async function swapCodeForToken() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        const res = await fetch(`${apiUrl}/api/v1/auth/google/callback?code=${code}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Authentication token swap failed.");
        }

        const data = await res.json();
        
        if (data.success && data.token) {
          // Store session data in localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          setStatus("success");
          
          // Redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          throw new Error("Invalid session response received.");
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        setStatus("error");
        setErrorMsg(err.message || "An unexpected error occurred during login.");
      }
    }

    swapCodeForToken();
  }, [searchParams, router]);

  return (
    <GlassCard className="max-w-md w-full p-8 text-center relative border border-white/5 bg-[#0a0505]/60 z-10">
      {status === "loading" && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              {/* Custom glowing metallic spinner */}
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-white/10 animate-spin-reverse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-medium text-white tracking-tight">Authenticating</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Swapping Google credentials for a secure PromptIQ session...
            </p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="flex justify-center text-emerald-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-medium text-white tracking-tight">Login Successful</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Preparing your customized dashboard telemetry...
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="flex justify-center text-red-500">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-medium text-white tracking-tight">Authentication Failed</h2>
            <p className="text-sm text-red-400/80 mt-2">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
          >
            Return to Landing Page
          </button>
        </div>
      )}
    </GlassCard>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-[#000000] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      
      <Suspense fallback={
        <GlassCard className="max-w-md w-full p-8 text-center relative border border-white/5 bg-[#0a0505]/60 z-10">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full border-t-2 border-red-500 animate-spin" style={{ borderRightColor: 'transparent' }} />
          </div>
          <h2 className="text-xl font-medium text-white tracking-tight mt-6">Loading Secure Session...</h2>
        </GlassCard>
      }>
        <AuthCallbackInner />
      </Suspense>
    </main>
  );
}
