"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to landing page if not signed in
        router.push("/");
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center gap-4 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="text-sm font-medium tracking-tight">Verifying secure workspace session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
