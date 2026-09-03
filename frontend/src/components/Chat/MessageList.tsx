"use client";

import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { Message } from "@/lib/api";

interface MessageListProps {
  messages: Message[];
  loadingMessage?: string;
  onQuickAction?: (prompt: string) => void;
}

export default function MessageList({ messages, loadingMessage, onQuickAction }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessage]);

  const quickActions = [
    {
      title: "Analyze Code",
      desc: "Paste snippet for SAST vulnerability check",
      prompt: "Please analyze this code snippet for security vulnerabilities, injection flaws, and misconfigurations:\n\n```\n// paste code here\n```",
      icon: "🔍",
    },
    {
      title: "Investigate Threat",
      desc: "Evaluate suspicious IP, hash, or attack vector",
      prompt: "Can you investigate this threat indicator and assess its risk level and possible MITRE ATT&CK techniques?",
      icon: "🛡️",
    },
    {
      title: "Security Best Practices",
      desc: "Get hardening tips for API, Auth & Cloud",
      prompt: "What are the recommended DevSecOps hardening best practices for securing our FastAPI backend and PostgreSQL database?",
      icon: "⚡",
    },
    {
      title: "Explain Finding",
      desc: "Deconstruct CWE vulnerability impact & fix",
      prompt: "Can you explain how SQL Injection vulnerabilities occur in ORM queries and provide a safe parameterized code example?",
      icon: "💡",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
      {messages.length === 0 ? (
        <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 py-8">
          {/* Glowing Emblem */}
          <div className="w-14 h-14 rounded-2xl bg-[#FFF1E6] border border-[#FFD2B2] flex items-center justify-center text-[#FF6B00] shadow-sm">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl md:text-2xl font-bold text-[#111111] tracking-tight">
              AEGION AI Security Copilot
            </h2>
            <p className="text-sm text-[#6B7280] max-w-md">
              Your real-time cybersecurity assistant. Ask about threat indicators, code vulnerabilities, remediation steps, or SOC triage.
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onQuickAction?.(action.prompt)}
                className="p-4 rounded-xl bg-white border border-[#EAEAEA] hover:border-[#FF6B00] hover:shadow-[0_4px_16px_rgba(255,107,0,0.08)] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-base">{action.icon}</span>
                  <span className="text-sm font-bold text-[#111111] group-hover:text-[#FF6B00] transition-colors">
                    {action.title}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] line-clamp-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto w-full pb-4">
          {messages.map((msg, i) => (
            <MessageItem key={i} message={msg} />
          ))}

          {loadingMessage !== undefined && (
            <MessageItem
              message={{
                role: "assistant",
                content: loadingMessage || "Thinking...",
              }}
            />
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
