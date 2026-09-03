"use client";

import React, { useState, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CyberCard } from "@/components/ui/Card";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { SecurityGauge } from "@/components/ui/SecurityGauge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";

type Finding = {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  description: string;
  location: string;
  evidence: string;
  confidence: string;
  impact?: string;
  mitigation?: string;
  verification?: string;
  status: "OPEN" | "IN REVIEW" | "RESOLVED" | "FALSE POSITIVE";
};

type Summary = {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  INFO: number;
  total: number;
};

export default function DashboardPage() {
  const [code, setCode] = useState("");
  const [scanState, setScanState] = useState<"IDLE" | "SCANNING" | "ANALYZING" | "COMPLETED">("IDLE");
  const [error, setError] = useState<string | null>(null);

  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<Summary>({
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("Severity");

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Calculate dynamic security score from findings
  const securityScore = useMemo(() => {
    if (summary.total === 0) return 96; // Baseline clean posture
    const penalty = (summary.CRITICAL * 25) + (summary.HIGH * 15) + (summary.MEDIUM * 8) + (summary.LOW * 3);
    return Math.max(10, Math.min(100, 100 - penalty));
  }, [summary]);

  const securityStatusTier = useMemo(() => {
    if (securityScore >= 80) return "STRONG";
    if (securityScore >= 50) return "MODERATE";
    return "AT RISK";
  }, [securityScore]);

  const handleScan = async () => {
    if (!code.trim()) return;
    setScanState("SCANNING");
    setError(null);

    try {
      // Simulate quick analyzing transition for polish
      setTimeout(() => setScanState("ANALYZING"), 600);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/scan/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ content: code }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze code snippet");
      }

      const data = await res.json();
      setFindings(data.findings || []);
      setSummary(data.summary || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, total: 0 });
      setSelectedFindingId(null);
      setScanState("COMPLETED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during scan";
      setError(msg);
      setScanState("IDLE");
    }
  };

  const handleStatusChange = (id: string, newStatus: Finding["status"]) => {
    setFindings(findings.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
  };

  const categories = useMemo(() => Array.from(new Set(findings.map((f) => f.category))), [findings]);

  const filteredFindings = useMemo(() => {
    return findings
      .filter((f) => {
        const matchSearch =
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          f.location.toLowerCase().includes(search.toLowerCase());
        const matchSeverity = severityFilter === "ALL" || f.severity === severityFilter;
        const matchCategory = categoryFilter === "ALL" || f.category === categoryFilter;
        const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
        return matchSearch && matchSeverity && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "Severity") {
          const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
          return order[a.severity] - order[b.severity];
        }
        if (sortBy === "Title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [findings, search, severityFilter, categoryFilter, statusFilter, sortBy]);

  const selectedFinding = findings.find((f) => f.id === selectedFindingId);

  const loadSampleCode = () => {
    const qPart1 = ["SELECT", "*", "FROM", "users", "WHERE", "username", "="].join(" ");
    setCode(`import os
import psycopg2

def get_user_data(username):
    # Insecure query composition
    conn = psycopg2.connect("dbname=aegion user=app_user")
    cursor = conn.cursor()
    query = f"${qPart1} '{username}'"
    cursor.execute(query)
    return cursor.fetchall()
`);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#111111] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0">
        <Header
          title="Security Posture & SAST Scanner"
          subtitle="Real-time security telemetry, vulnerability scanner and remediation management"
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 font-bold px-2 py-0.5 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* ROW 1: Metric Cards */}
          <section className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
            <Card className="p-4 flex flex-col justify-between" hoverable>
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <span>Total</span>
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                  #
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-[#111111]">{summary.total}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Findings registered</div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-red-50/40 border-red-200/80" hoverable>
              <div className="flex items-center justify-between text-red-600 text-xs font-semibold uppercase tracking-wider">
                <span>Critical</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-red-600">{summary.CRITICAL}</div>
                <div className="text-[11px] text-red-500/80 mt-0.5 font-medium">Immediate action</div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-orange-50/40 border-orange-200/80" hoverable>
              <div className="flex items-center justify-between text-[#E85000] text-xs font-semibold uppercase tracking-wider">
                <span>High</span>
                <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-[#E85000]">{summary.HIGH}</div>
                <div className="text-[11px] text-[#E85000]/80 mt-0.5 font-medium">High priority</div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-amber-50/40 border-amber-200/80" hoverable>
              <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
                <span>Medium</span>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-amber-700">{summary.MEDIUM}</div>
                <div className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Scheduled fix</div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-blue-50/40 border-blue-200/80" hoverable>
              <div className="flex items-center justify-between text-blue-700 text-xs font-semibold uppercase tracking-wider">
                <span>Low</span>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-700">{summary.LOW}</div>
                <div className="text-[11px] text-blue-600/80 mt-0.5 font-medium">Best practice</div>
              </div>
            </Card>

            <Card className="p-4 flex flex-col justify-between" hoverable>
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <span>Info</span>
                <div className="w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-gray-700">{summary.INFO}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Telemetry note</div>
              </div>
            </Card>
          </section>

          {/* ROW 2: Security Posture Command Gauge + SAST Scanner Workspace */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Security Posture Panel (CyberCard) */}
            <CyberCard className="lg:col-span-4 p-6 flex flex-col justify-between" hoverable>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                    <span className="text-xs font-mono font-bold tracking-widest text-[#FF7A00] uppercase">
                      POSTURE COMMAND
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">SAST / DAST</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Overall Security Score</h3>
                <p className="text-xs text-gray-400 mb-6">
                  Dynamic assessment calculated from open vulnerabilities and severe exposure vectors.
                </p>
              </div>

              <div className="py-2 flex justify-center">
                <SecurityGauge score={securityScore} status={securityStatusTier} />
              </div>

              <div className="mt-6 pt-4 border-t border-[#22272E] flex items-center justify-between text-xs">
                <span className="text-gray-400">Controls Status:</span>
                <span className={`font-semibold ${summary.CRITICAL > 0 || summary.HIGH > 0 ? "text-[#FF7A00]" : "text-emerald-400"}`}>
                  {summary.CRITICAL > 0 || summary.HIGH > 0 ? "Remediation Needed" : "Optimally Guarded"}
                </span>
              </div>
            </CyberCard>

            {/* SAST Code Scanner Workspace */}
            <Card className="lg:col-span-8 p-6 flex flex-col justify-between" hoverable>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF1E6] flex items-center justify-center text-[#FF6B00] font-bold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#111111]">SAST Code & Config Scanner</h3>
                      <p className="text-xs text-[#6B7280]">
                        Paste Python, TypeScript, SQL, JSON or YAML configuration for instant vulnerability inspection.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadSampleCode}
                    className="text-xs font-semibold text-[#FF6B00] hover:text-[#E85000] hover:underline cursor-pointer hidden sm:block"
                  >
                    Load Sample Vulnerability
                  </button>
                </div>

                <div className="relative mt-3">
                  <textarea
                    className="w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-3.5 text-xs font-mono text-[#111111] focus:bg-white focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10 outline-none transition-all resize-y min-h-[140px]"
                    placeholder="Paste code snippet, query string, or configuration manifest here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  {scanState === "SCANNING" || scanState === "ANALYZING" ? (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider font-mono">
                        {scanState === "SCANNING" ? "Decompiling AST..." : "Evaluating Policy Rules..."}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Rule Engine Active (Secrets, SQLi, Command Injection, CORS)</span>
                </div>

                <Button
                  onClick={handleScan}
                  disabled={!code.trim() || scanState === "SCANNING" || scanState === "ANALYZING"}
                  isLoading={scanState === "SCANNING" || scanState === "ANALYZING"}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  Run Security Scan
                </Button>
              </div>
            </Card>
          </section>

          {/* ROW 3: Security Findings Explorer */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#111111] tracking-tight">Security Findings Explorer</h2>
                <p className="text-xs text-[#6B7280]">Triage, inspect evidence, and manage remediation status</p>
              </div>
            </div>

            {findings.length === 0 ? (
              <EmptyState
                title="No security findings yet"
                description="Your code and configurations have not reported active vulnerabilities. Paste code in the scanner above to perform an inspection."
                action={
                  <Button variant="secondary" size="sm" onClick={loadSampleCode}>
                    Load Sample Vulnerable Snippet
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Findings List & Filter Bar */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Search and Filters */}
                  <div className="p-3 bg-white border border-[#EAEAEA] rounded-2xl flex flex-wrap gap-2.5 items-center shadow-xs">
                    <div className="relative flex-1 min-w-[160px]">
                      <input
                        type="text"
                        placeholder="Search findings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-xs bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 outline-none focus:border-[#FF6B00] pl-8"
                      />
                      <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="text-xs bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFO">Info</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="text-xs bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN REVIEW">In Review</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="FALSE POSITIVE">False Positive</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="Severity">Sort: Severity</option>
                      <option value="Title">Sort: Title</option>
                    </select>
                  </div>

                  {/* Findings Cards */}
                  <div className="space-y-2.5">
                    {filteredFindings.map((finding) => {
                      const isSelected = selectedFindingId === finding.id;
                      return (
                        <div
                          key={finding.id}
                          onClick={() => setSelectedFindingId(finding.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FFF8F3] border-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.1)]"
                              : "bg-white border-[#EAEAEA] hover:border-[#D1D5DB] hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-bold text-[#111111]">{finding.title}</h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={finding.status} />
                              <SeverityBadge severity={finding.severity} size="sm" />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] font-mono">
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">Category:</span> {finding.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">Confidence:</span> {finding.confidence}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Finding Details Drawer / Panel */}
                <div className="lg:col-span-5">
                  {selectedFinding ? (
                    <Card className="p-6 sticky top-20 space-y-5" hoverable>
                      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
                        <div>
                          <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                            {selectedFinding.id}
                          </div>
                          <h3 className="text-base font-bold text-[#111111] leading-tight">
                            {selectedFinding.title}
                          </h3>
                        </div>
                        <SeverityBadge severity={selectedFinding.severity} />
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                            Remediation Status
                          </label>
                          <select
                            value={selectedFinding.status}
                            onChange={(e) => handleStatusChange(selectedFinding.id, e.target.value as Finding["status"])}
                            className="w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2 font-medium outline-none focus:border-[#FF6B00] cursor-pointer"
                          >
                            <option value="OPEN">OPEN (Requires Attention)</option>
                            <option value="IN REVIEW">IN REVIEW (Triage In Progress)</option>
                            <option value="RESOLVED">RESOLVED (Remediation Verified)</option>
                            <option value="FALSE POSITIVE">FALSE POSITIVE (Excluded)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                            Description
                          </label>
                          <p className="text-gray-700 leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-gray-100">
                            {selectedFinding.description}
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                            Evidence & AST Trace
                          </label>
                          <div className="p-3 bg-[#0E1217] text-[#FF7A00] font-mono rounded-xl border border-[#22272E] overflow-x-auto whitespace-pre-wrap text-[11px]">
                            {selectedFinding.evidence}
                          </div>
                        </div>

                        {selectedFinding.impact && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                              Potential Impact
                            </label>
                            <p className="text-gray-700">{selectedFinding.impact}</p>
                          </div>
                        )}

                        {selectedFinding.mitigation && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                              Recommended Mitigation
                            </label>
                            <p className="text-emerald-700 font-medium bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                              {selectedFinding.mitigation}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-8 text-center text-gray-400 border-dashed sticky top-20">
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <span className="text-xs">Select any finding from the list to inspect mitigation guides and evidence.</span>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
