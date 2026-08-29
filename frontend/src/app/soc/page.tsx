"use client";

import { useState, useEffect, useMemo } from "react";
import SidebarPlaceholder from "@/components/Sidebar/SidebarPlaceholder";
import { getSiemEvents, getSiemAlerts, updateAlertStatus, submitSiemEvent, getAlertIntelligence, analyzeAlert } from "@/lib/api";

type SecurityEvent = {
  id: string;
  timestamp: string;
  source: string;
  event_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  source_ip?: string;
  destination_ip?: string;
  hostname?: string;
  username?: string;
  message?: string;
  raw_event?: string;
  status: string;
  detection_rule?: string;
};

type SecurityAlert = {
  id: string;
  event_id: string;
  rule_id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  description: string;
  timestamp: string;
  status: "OPEN" | "IN REVIEW" | "RESOLVED" | "FALSE POSITIVE";
};

type SecurityIntelligence = {
  id: string;
  source_type: string;
  source_id: string;
  risk_score: string;
  confidence: string;
  summary: string;
  evidence: string;
  indicators: string;
  related_events: string;
  related_alerts: string;
  recommended_actions: string;
  created_at: string;
};

type IOCIndicator = {
  indicator: string;
  type: string;
  description?: string;
  source?: string;
};

export default function SOCDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [alertStatusFilter, setAlertStatusFilter] = useState("ALL");

  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [selectedEventForAlert, setSelectedEventForAlert] = useState<SecurityEvent | null>(null);
  const [intelligence, setIntelligence] = useState<SecurityIntelligence | null>(null);
  const [investigating, setInvestigating] = useState(false);

  // Synthetic Test Tools
  const [syntheticLoading, setSyntheticLoading] = useState(false);

  useEffect(() => {
    const fetchSOCData = async () => {
      setLoading(true);
      try {
        const [eventsData, alertsData] = await Promise.all([
          getSiemEvents(1, 50, severityFilter),
          getSiemAlerts(1, 50, severityFilter, alertStatusFilter)
        ]);
        setEvents(eventsData.items || []);
        setTotalEvents(eventsData.total || 0);
        setAlerts(alertsData.items || []);

        if (selectedAlert) {
          const matchingAlert = alertsData.items?.find((a: SecurityAlert) => a.id === selectedAlert.id);
          if (matchingAlert) {
              setSelectedAlert(matchingAlert);
          }
        }
      } catch (err) {
        console.error("Failed to load SOC data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSOCData();
  }, [severityFilter, alertStatusFilter, selectedAlert]);

  const loadEventForAlert = async (eventId: string) => {
    const e = events.find(e => e.id === eventId);
    if (e) {
      setSelectedEventForAlert(e);
      return;
    }
    // Fetch if not in current page
    try {
      const eData = await getSiemEvents(1, 100);
      const ev = eData.items?.find((e: SecurityEvent) => e.id === eventId);
      if (ev) setSelectedEventForAlert(ev);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAlert = async (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setIntelligence(null);
    loadEventForAlert(alert.event_id);
    try {
      const intel = await getAlertIntelligence(alert.id);
      if (intel && intel.length > 0) {
        setIntelligence(intel[0]); // most recent
      }
    } catch (err) {
      console.error("No existing intelligence found or error", err);
    }
  };

  const handleInvestigate = async (alertId: string) => {
    setInvestigating(true);
    try {
      const intel = await analyzeAlert(alertId);
      setIntelligence(intel);
    } catch (err) {
      console.error("Failed to analyze alert", err);
    } finally {
      setInvestigating(false);
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus);
      // We could re-fetch data, but for now we trust it or reload locally
      // For simplicity, we just trigger a state change to re-fetch
      setSeverityFilter(prev => prev); // trigger effect
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const triggerSyntheticEvent = async (type: string) => {
    setSyntheticLoading(true);
    try {
      if (type === "brute_force") {
        for (let i = 0; i < 5; i++) {
          await submitSiemEvent({
            source: "synthetic-tester",
            event_type: "login_failed",
            severity: "LOW",
            category: "Authentication",
            source_ip: "192.168.1.100",
            username: "admin"
          });
        }
      } else if (type === "sql_injection") {
        await submitSiemEvent({
            source: "synthetic-tester",
            event_type: "waf_alert",
            severity: "HIGH",
            category: "Injection",
            source_ip: "203.0.113.5",
            message: "SELECT * FROM users WHERE name = '' OR 1=1 --;"
        });
      } else if (type === "command_injection") {
        await submitSiemEvent({
            source: "synthetic-tester",
            event_type: "waf_alert",
            severity: "HIGH",
            category: "Injection",
            source_ip: "203.0.113.6",
            raw_event: '{"payload": "; cat /etc/passwd"}'
        });
      }
      setTimeout(() => setSeverityFilter(prev => prev), 1000); // Trigger re-fetch
    } catch (err) {
      console.error(err);
    } finally {
      setSyntheticLoading(false);
    }
  };

  const summary = useMemo(() => {
    const s = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, OPEN: 0 };
    alerts.forEach(a => {
      if (a.severity === "CRITICAL") s.CRITICAL++;
      if (a.severity === "HIGH") s.HIGH++;
      if (a.severity === "MEDIUM") s.MEDIUM++;
      if (a.status === "OPEN") s.OPEN++;
    });
    return s;
  }, [alerts]);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <SidebarPlaceholder />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 shadow-md">
          <div className="font-semibold tracking-wide flex items-center gap-3">
            <span className="text-blue-400">SOC Dashboard</span>
            <span className="bg-blue-900/30 border border-blue-800 text-blue-300 px-2 py-0.5 rounded text-xs">Phase 8</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <button 
              disabled={syntheticLoading}
              onClick={() => triggerSyntheticEvent("brute_force")}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 border border-gray-700 transition-colors"
            >
              Test: Brute Force
            </button>
            <button 
              disabled={syntheticLoading}
              onClick={() => triggerSyntheticEvent("sql_injection")}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 border border-gray-700 transition-colors"
            >
              Test: SQLi
            </button>
            <button 
              disabled={syntheticLoading}
              onClick={() => triggerSyntheticEvent("command_injection")}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 border border-gray-700 transition-colors"
            >
              Test: Cmdi
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Total Events</div>
              <div className="text-3xl font-bold text-gray-100">{totalEvents}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-center">
              <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Open Alerts</div>
              <div className="text-3xl font-bold text-blue-400">{summary.OPEN}</div>
            </div>
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5 shadow-lg flex flex-col justify-center">
              <div className="text-sm text-red-400 font-medium uppercase tracking-wider mb-1">Critical Alerts</div>
              <div className="text-3xl font-bold text-red-500">{summary.CRITICAL}</div>
            </div>
            <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-5 shadow-lg flex flex-col justify-center">
              <div className="text-sm text-orange-400 font-medium uppercase tracking-wider mb-1">High Alerts</div>
              <div className="text-3xl font-bold text-orange-500">{summary.HIGH}</div>
            </div>
            <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-xl p-5 shadow-lg flex flex-col justify-center">
              <div className="text-sm text-yellow-400 font-medium uppercase tracking-wider mb-1">Medium Alerts</div>
              <div className="text-3xl font-bold text-yellow-500">{summary.MEDIUM}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-md">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Severity</label>
              <select 
                className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-200"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Alert Status</label>
              <select 
                className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-gray-200"
                value={alertStatusFilter}
                onChange={e => setAlertStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN REVIEW">IN REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE POSITIVE">FALSE POSITIVE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Alerts List */}
            <div className="flex flex-col space-y-4">
              <h2 className="text-xl font-semibold border-b border-gray-800 pb-2">Active Security Alerts</h2>
              {loading && alerts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
                  No active alerts matching your criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => handleSelectAlert(a)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all shadow-sm ${
                        selectedAlert?.id === a.id 
                          ? 'bg-gray-800 border-blue-500/50 ring-1 ring-blue-500/30' 
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-100">{a.title}</div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                            {a.status}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border
                            ${a.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' : ''}
                            ${a.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : ''}
                            ${a.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : ''}
                            ${a.severity === 'LOW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : ''}
                            ${a.severity === 'INFO' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' : ''}
                          `}>
                            {a.severity}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="font-mono">{a.rule_id} &bull; {a.category}</div>
                        <div>{new Date(a.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alert Details */}
            {selectedAlert ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl h-fit sticky top-6">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-800">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider
                                ${selectedAlert.severity === 'CRITICAL' ? 'bg-red-500 text-white' : ''}
                                ${selectedAlert.severity === 'HIGH' ? 'bg-orange-500 text-white' : ''}
                                ${selectedAlert.severity === 'MEDIUM' ? 'bg-yellow-500 text-black' : ''}
                                ${selectedAlert.severity === 'LOW' ? 'bg-blue-500 text-white' : ''}
                                ${selectedAlert.severity === 'INFO' ? 'bg-gray-500 text-white' : ''}
                        `}>
                            {selectedAlert.severity}
                        </span>
                        <span className="text-sm font-mono text-gray-400">{selectedAlert.rule_id}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">{selectedAlert.title}</h2>
                    <div className="text-sm text-gray-400 mt-1">{new Date(selectedAlert.timestamp).toLocaleString()}</div>
                  </div>
                  <div>
                    <button
                        onClick={() => handleInvestigate(selectedAlert.id)}
                        disabled={investigating}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                        {investigating ? "Analyzing..." : "Investigate with AI"}
                    </button>
                  </div>
                </div>

                <div className="space-y-6 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alert Status</label>
                    <select 
                      className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 outline-none w-full text-gray-200 focus:border-blue-500"
                      value={selectedAlert.status}
                      onChange={(e) => handleStatusChange(selectedAlert.id, e.target.value)}
                    >
                      <option value="OPEN">OPEN - Needs Investigation</option>
                      <option value="IN REVIEW">IN REVIEW - Being Analyzed</option>
                      <option value="RESOLVED">RESOLVED - Threat Mitigated</option>
                      <option value="FALSE POSITIVE">FALSE POSITIVE - Safe Activity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <div className="text-gray-300 leading-relaxed bg-gray-950 p-4 rounded-lg border border-gray-800">
                        {selectedAlert.description}
                    </div>
                  </div>

                  {selectedEventForAlert && (
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="font-semibold text-lg">Event Context</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Source IP</label>
                                <div className="text-gray-300 font-mono bg-gray-950 px-3 py-2 rounded border border-gray-800">{selectedEventForAlert.source_ip || "N/A"}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Username</label>
                                <div className="text-gray-300 font-mono bg-gray-950 px-3 py-2 rounded border border-gray-800">{selectedEventForAlert.username || "N/A"}</div>
                            </div>
                        </div>

                        {(selectedEventForAlert.message || selectedEventForAlert.raw_event) && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Raw Evidence</label>
                                <div className="bg-gray-950 p-4 rounded-lg font-mono text-red-300 border border-gray-800 overflow-x-auto whitespace-pre-wrap text-xs shadow-inner">
                                    {selectedEventForAlert.raw_event || selectedEventForAlert.message}
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  {/* Investigation Intelligence */}
                  {intelligence && (
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="font-semibold text-lg text-blue-400 border-b border-gray-800 pb-2">Intelligence Context</h3>
                        
                        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Risk Score</div>
                                <div className="text-2xl font-bold text-gray-200">{intelligence.risk_score} / 100</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Confidence</div>
                                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-bold">{intelligence.confidence}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                                <h4 className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-2">DETECTED (Deterministic)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Related Events</div>
                                        <div className="text-sm text-gray-300">{intelligence.related_events ? JSON.parse(intelligence.related_events).length : 0} event(s) correlated</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">IOC Indicators</div>
                                        {intelligence.indicators && JSON.parse(intelligence.indicators).length > 0 ? (
                                            <ul className="text-sm font-mono text-gray-300 list-disc list-inside">
                                                {(JSON.parse(intelligence.indicators) as IOCIndicator[]).map((ioc, idx) => (
                                                    <li key={idx} title={ioc.description || ioc.source}>{ioc.indicator} <span className="text-xs text-gray-500 ml-1 border rounded px-1">{ioc.type}</span></li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-sm text-gray-500">None detected</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Deterministic Evidence</div>
                                        <div className="text-sm text-gray-300 whitespace-pre-wrap">{intelligence.evidence?.split('\n')[0]}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                <h4 className="text-xs text-purple-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                    INFERRED (AI Analysis)
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Summary</div>
                                        <div className="text-sm text-gray-300 leading-relaxed">{intelligence.summary}</div>
                                    </div>
                                    {intelligence.recommended_actions && (
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-semibold">Recommended Actions</div>
                                            <div className="text-sm text-gray-300 leading-relaxed">{intelligence.recommended_actions}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col justify-center items-center h-[500px] text-gray-500 shadow-lg">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p>Select an alert to view details, evidence, and update status.</p>
                </div>
            )}
            
          </div>
          
          {/* Recent Events Table */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold border-b border-gray-800 pb-2 mb-4">Recent Security Events Feed</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950 text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                        <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Severity</th>
                            <th className="px-4 py-3">Event Type</th>
                            <th className="px-4 py-3">Source / User</th>
                            <th className="px-4 py-3">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {events.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No events found.</td></tr>
                        ) : events.map(e => (
                            <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border
                                        ${e.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' : ''}
                                        ${e.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : ''}
                                        ${e.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : ''}
                                        ${e.severity === 'LOW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : ''}
                                        ${e.severity === 'INFO' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' : ''}
                                    `}>
                                        {e.severity}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-300">{e.event_type}</td>
                                <td className="px-4 py-3">
                                    <div className="text-gray-300">{e.source_ip || e.source}</div>
                                    {e.username && <div className="text-xs text-gray-500 mt-0.5">{e.username}</div>}
                                </td>
                                <td className="px-4 py-3 text-gray-400 truncate max-w-xs" title={e.message || e.raw_event}>
                                    {e.message || e.raw_event || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
