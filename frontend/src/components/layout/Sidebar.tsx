"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  conversations?: ConversationItem[];
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
}

export default function Sidebar({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewChat,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  const navSections = [
    {
      title: "MAIN",
      items: [
        {
          name: "Overview & Scans",
          href: "/dashboard",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-4a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
            </svg>
          ),
        },
        {
          name: "AI Copilot",
          href: "/",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "SECURITY OPERATIONS",
      items: [
        {
          name: "SOC Command Center",
          href: "/soc",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-[#EAEAEA] transition-all duration-300 h-screen z-30 flex-shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#EAEAEA]">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E85000] via-[#FF6B00] to-[#FF7A00] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            {/* Custom Shield + Spark Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#111111]">
                AEGION<span className="text-[#FF6B00]">.</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#6B7280]">
                DevSecOps AI
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-[#FFF1E6] text-[#FF6B00] shadow-sm font-semibold"
                      : "text-gray-600 hover:text-[#111111] hover:bg-gray-50"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <span className={`transition-colors ${isActive ? "text-[#FF6B00]" : "text-gray-400 group-hover:text-gray-700"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Phase 7: Integrated Chat History when available */}
        {pathname === "/" && onNewChat && !collapsed && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                Chat History
              </span>
              <button
                onClick={onNewChat}
                className="text-xs text-[#FF6B00] hover:text-[#E85000] font-semibold flex items-center gap-1 cursor-pointer"
              >
                + New
              </button>
            </div>

            {conversations.length > 5 && (
              <input
                type="text"
                placeholder="Search chats..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#FF6B00]"
              />
            )}

            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {filteredConversations.length === 0 ? (
                <div className="text-xs text-gray-400 py-2 px-2 italic text-center">
                  No previous sessions
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectConversation?.(c.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs truncate transition-colors flex items-center gap-2 cursor-pointer ${
                      activeConversationId === c.id
                        ? "bg-[#FFF1E6] text-[#FF6B00] font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="truncate">{c.title || "Untitled Investigation"}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-[#EAEAEA] bg-[#FAFAFA]">
        <div className={`flex items-center justify-between ${collapsed ? "flex-col gap-2" : ""}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-[#111111] truncate">Security Analyst</span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
