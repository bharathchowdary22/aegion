"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, badge, actions }: HeaderProps) {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (title) return { heading: title, sub: subtitle };
    switch (pathname) {
      case "/":
        return { heading: "AI Security Copilot", sub: "Interactive threat analysis, code scanning & advisory" };
      case "/dashboard":
        return { heading: "Security Posture & Scanner", sub: "Real-time posture assessment, SAST analysis & vulnerability registry" };
      case "/soc":
        return { heading: "SOC Command Center", sub: "SIEM event ingestion, brute-force & attack correlation intelligence" };
      default:
        return { heading: "AEGION Security", sub: "Enterprise DevSecOps Platform" };
    }
  };

  const info = getPageInfo();

  return (
    <header className="h-16 bg-white border-b border-[#EAEAEA] sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-[#111111] tracking-tight">
              {info.heading}
            </h1>
            {badge}
          </div>
          {info.sub && (
            <p className="text-xs text-[#6B7280] hidden sm:block font-normal">
              {info.sub}
            </p>
          )}
        </div>
      </div>

      {/* Global Status & Quick Actions */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Live Engine Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF1E6] border border-[#FFD2B2] text-xs font-semibold text-[#E85000]">
          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
          <span>Active Defenses</span>
        </div>

        {/* Quick Nav Links on Mobile Header */}
        <div className="flex md:hidden items-center gap-1">
          <Link
            href="/dashboard"
            className={`p-2 rounded-lg text-xs font-medium ${pathname === "/dashboard" ? "bg-[#FFF1E6] text-[#FF6B00]" : "text-gray-600"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className={`p-2 rounded-lg text-xs font-medium ${pathname === "/" ? "bg-[#FFF1E6] text-[#FF6B00]" : "text-gray-600"}`}
          >
            Copilot
          </Link>
          <Link
            href="/soc"
            className={`p-2 rounded-lg text-xs font-medium ${pathname === "/soc" ? "bg-[#FFF1E6] text-[#FF6B00]" : "text-gray-600"}`}
          >
            SOC
          </Link>
        </div>
      </div>
    </header>
  );
}
