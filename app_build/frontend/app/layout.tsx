import React from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "PromptIQ — AI Governance Layer",
  description: "The Memory-Powered AI Governance Layer for Engineering Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.variable,
          "font-sans antialiased min-h-screen bg-[#020202] text-[#f1f0f5]"
        )}
      >
        {/* Background mesh */}
        <div className="bg-mesh" />
        {children}
      </body>
    </html>
  );
}
