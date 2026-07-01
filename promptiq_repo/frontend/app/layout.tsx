"use client";

import React, { useState } from "react";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <html lang="en" className="dark">
      <head>
        <title>PromptIQ — AI Governance Dashboard</title>
        <meta
          name="description"
          content="The Memory-Powered AI Governance Layer for Engineering Teams"
        />
      </head>
      <body
        className={cn(
          inter.variable,
          "font-sans antialiased min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
        )}
      >
        {/* Background mesh */}
        <div className="bg-mesh" />

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
      </body>
    </html>
  );
}
