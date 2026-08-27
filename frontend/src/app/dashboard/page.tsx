"use client";

import { useState, useMemo } from "react";
import SidebarPlaceholder from "@/components/Sidebar/SidebarPlaceholder";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<Summary>({
    CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, total: 0
  });

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("Severity");

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  const handleScan = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${apiUrl}/api/v1/scan/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({ content: code })
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze code");
      }
      
      const data = await res.json();
      setFindings(data.findings || []);
      setSummary(data.summary || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, total: 0 });
      setSelectedFindingId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: Finding["status"]) => {
    setFindings(findings.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  // Derived state
  const categories = useMemo(() => Array.from(new Set(findings.map(f => f.category))), [findings]);
  
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const matchSearch = f.title.toLowerCase().includes(search.toLowerCase()) || 
                          f.description.toLowerCase().includes(search.toLowerCase()) ||
                          f.location.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === "ALL" || f.severity === severityFilter;
      const matchCategory = categoryFilter === "ALL" || f.category === categoryFilter;
      const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
      return matchSearch && matchSeverity && matchCategory && matchStatus;
    }).sort((a, b) => {
      if (sortBy === "Severity") {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        return order[a.severity] - order[b.severity];
      }
      if (sortBy === "Title") {
        return a.title.localeCompare(b.title);
      }
      // Since request-based doesn't have true timestamps, newest/oldest fallback to original order
      return 0;
    });
  }, [findings, search, severityFilter, categoryFilter, statusFilter, sortBy]);

  const selectedFinding = findings.find(f => f.id === selectedFindingId);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <SidebarPlaceholder />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="h-14 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="font-semibold tracking-wide text-gray-200">
            Security Dashboard
          </div>
          <div className="text-xs text-gray-500 font-mono tracking-wider">
            PHASE 6
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full space-y-8">
          
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-medium mb-3">Scan Code / Configuration</h2>
            <textarea
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm font-mono focus:border-blue-500 outline-none text-gray-300"
              rows={4}
              placeholder="Paste code or configuration here to generate findings..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-red-400">{error}</span>
              <button
                onClick={handleScan}
                disabled={loading || !code.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? "Scanning..." : "Run Security Scan"}
              </button>
            </div>
          </section>

          {findings.length > 0 && (
            <>
              <section className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold">{summary.total}</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase">Total Findings</div>
                </div>
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-red-500">{summary.CRITICAL}</div>
                  <div className="text-xs text-red-400 mt-1 uppercase">Critical</div>
                </div>
                <div className="bg-orange-950/30 border border-orange-900/50 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-orange-500">{summary.HIGH}</div>
                  <div className="text-xs text-orange-400 mt-1 uppercase">High</div>
                </div>
                <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-yellow-500">{summary.MEDIUM}</div>
                  <div className="text-xs text-yellow-400 mt-1 uppercase">Medium</div>
                </div>
                <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-blue-500">{summary.LOW}</div>
                  <div className="text-xs text-blue-400 mt-1 uppercase">Low</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-gray-400">{summary.INFO}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">Info</div>
                </div>
              </section>
              
              <div className="text-sm bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between">
                <span>Security Posture Indicator:</span>
                <span className={`font-bold ${summary.CRITICAL > 0 || summary.HIGH > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {summary.CRITICAL > 0 || summary.HIGH > 0 ? 'AT RISK - Action Required' : 'NO SEVERE FINDINGS'}
                </span>
              </div>

              <section className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-3 bg-gray-900 p-3 rounded-xl border border-gray-800 items-center">
                    <input 
                      type="text" 
                      placeholder="Search findings..." 
                      className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm flex-1 outline-none focus:border-blue-500"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <select className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFO">Info</option>
                    </select>
                    <select className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                      <option value="ALL">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">OPEN</option>
                      <option value="IN REVIEW">IN REVIEW</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                    </select>
                    <select className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                      <option value="Severity">Sort: Severity</option>
                      <option value="Title">Sort: Title</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {filteredFindings.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
                        No findings match the current filters.
                      </div>
                    ) : (
                      filteredFindings.map((f, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedFindingId(f.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedFindingId === f.id ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-100">{f.title}</h3>
                            <div className="flex gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                                {f.status}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded font-medium
                                ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                                ${f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                                ${f.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                                ${f.severity === 'LOW' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                                ${f.severity === 'INFO' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
                              `}>
                                {f.severity}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500 font-mono">
                            <span>{f.category}</span>
                            <span>{f.location}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedFinding && (
                  <div className="lg:w-1/3 w-full bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg h-fit">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-800">
                      <div>
                        <div className="text-xs text-gray-500 font-mono mb-1">{selectedFinding.id}</div>
                        <h2 className="text-lg font-bold">{selectedFinding.title}</h2>
                      </div>
                    </div>
                    
                    <div className="space-y-5 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Status</div>
                        <select 
                          className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 outline-none w-full"
                          value={selectedFinding.status}
                          onChange={(e) => handleStatusChange(selectedFinding.id, e.target.value as Finding["status"])}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN REVIEW">IN REVIEW</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="FALSE POSITIVE">FALSE POSITIVE</option>
                        </select>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Description</div>
                        <div className="text-gray-300 leading-relaxed">{selectedFinding.description}</div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Evidence</div>
                        <div className="bg-gray-950 p-3 rounded font-mono text-gray-300 border border-gray-800 overflow-x-auto whitespace-pre-wrap">
                          {selectedFinding.evidence}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Potential Impact</div>
                        <div className="text-gray-300">{selectedFinding.impact}</div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Recommended Mitigation</div>
                        <div className="text-gray-300">{selectedFinding.mitigation}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500 text-xs uppercase mb-1">Confidence</div>
                        <div className="text-gray-300">{selectedFinding.confidence}</div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {!loading && findings.length === 0 && !error && code.trim() && (
            <div className="text-center py-16 text-gray-500">
              No findings generated yet. Click &quot;Run Security Scan&quot; to analyze the code.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
