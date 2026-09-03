"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CyberCard } from "@/components/ui/Card";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getSiemEvents,
  getSiemAlerts,
  updateAlertStatus,
  submitSiemEvent,
  getAlertIntelligence,
  analyzeAlert,
} from "@/lib/api";

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

export default function SOCDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [alertStatusFilter, setAlertStatusFilter] = useState("ALL");

  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [intelligence, setIntelligence] = useState<SecurityIntelligence | null>(null);
  const [investigating, setInvestigating] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);

  const fetchSOCData = async () => {
    setLoading(true);
    try {
      const [eventsData, alertsData] = await Promise.all([
        getSiemEvents(1, 50, severityFilter),
        getSiemAlerts(1, 50, severityFilter, alertStatusFilter),
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSOCData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, alertStatusFilter]);

  const handleSelectAlert = async (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setIntelligence(null);
    try {
      const intelList = await getAlertIntelligence(alert.id);
      if (intelList && intelList.length > 0) {
        setIntelligence(intelList[0]);
      }
    } catch {
      // No existing intelligence recorded yet
    }
  };

  const handleAnalyzeAlertWithAI = async (alertId: string) => {
    setInvestigating(true);
    try {
      const intel = await analyzeAlert(alertId);
      setIntelligence(intel);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setInvestigating(false);
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus);
      await fetchSOCData();
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert({ ...selectedAlert, status: newStatus as SecurityAlert["status"] });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Synthetic Test Generator for SIEM
  const handleTriggerSyntheticThreat = async (type: "BRUTE_FORCE" | "SQL_INJECTION") => {
    setSyntheticLoading(true);
    try {
      if (type === "BRUTE_FORCE") {
        for (let i = 0; i < 5; i++) {
          await submitSiemEvent({
            source: "auth-gateway",
            event_type: "login_failed",
            severity: "HIGH",
            category: "Authentication",
            source_ip: "198.51.100.42",
            username: "root_admin",
            message: `Failed authentication attempt #${i + 1}`,
          });
        }
      } else {
        await submitSiemEvent({
          source: "waf-ingress",
          event_type: "waf_rule_match",
          severity: "CRITICAL",
          category: "Web Application",
          source_ip: "203.0.113.88",
          message: "SQLi vector intercepted: ' OR 1=1 --",
        });
      }
      await fetchSOCData();
    } catch (e) {
      console.error("Synthetic trigger error", e);
    } finally {
      setSyntheticLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#111111] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0">
        <Header
          title="SOC Command Center & SIEM"
          subtitle="Real-time event pipeline, anomaly correlation, and AI-assisted threat intelligence"
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              INGESTION LIVE
            </span>
          }
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Top Status & Metrics */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4" hoverable>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                Active Alerts
              </div>
              <div className="text-3xl font-extrabold text-[#E85000]">{alerts.length}</div>
              <div className="text-[11px] text-gray-400 mt-1">Requiring SOC triage</div>
            </Card>

            <Card className="p-4" hoverable>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 font-mono">
                Ingested Events
              </div>
              <div className="text-3xl font-extrabold text-[#111111]">{totalEvents}</div>
              <div className="text-[11px] text-gray-400 mt-1">Total SIEM telemetry</div>
            </Card>

            <Card className="p-4 bg-red-50/50 border-red-200/80" hoverable>
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1 font-mono">
                Critical Alerts
              </div>
              <div className="text-3xl font-extrabold text-red-600">
                {alerts.filter((a) => a.severity === "CRITICAL").length}
              </div>
              <div className="text-[11px] text-red-500/80 mt-1">WAF / Exploit triggers</div>
            </Card>

            {/* Quick Threat Generator */}
            <Card className="p-4 flex flex-col justify-between" hoverable>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-mono">
                Simulate Threat
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerSyntheticThreat("BRUTE_FORCE")}
                  disabled={syntheticLoading}
                >
                  Auth Attack
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleTriggerSyntheticThreat("SQL_INJECTION")}
                  disabled={syntheticLoading}
                >
                  SQLi Exploit
                </Button>
              </div>
            </Card>
          </section>

          {/* Main SOC Workspace */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Triage Queue & Event Stream */}
            <div className="lg:col-span-7 space-y-6">
              {/* Alert Triage Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                    <span>Correlated Security Alerts</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="text-xs bg-white border border-[#EAEAEA] rounded-xl px-3 py-1.5 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>

                    <select
                      value={alertStatusFilter}
                      onChange={(e) => setAlertStatusFilter(e.target.value)}
                      className="text-xs bg-white border border-[#EAEAEA] rounded-xl px-3 py-1.5 outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN REVIEW">In Review</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>

                {loading && alerts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">Loading alerts queue...</div>
                ) : alerts.length === 0 ? (
                  <EmptyState
                    title="Your SOC is quiet"
                    description="No correlated security alerts currently require triage. Trigger a synthetic threat above to test detection pipelines."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {alerts.map((alert) => {
                      const isSelected = selectedAlert?.id === alert.id;
                      return (
                        <div
                          key={alert.id}
                          onClick={() => handleSelectAlert(alert)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FFF8F3] border-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.1)]"
                              : "bg-white border-[#EAEAEA] hover:border-[#D1D5DB]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-bold text-[#111111]">{alert.title}</h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={alert.status} />
                              <SeverityBadge severity={alert.severity} size="sm" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                          <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
                            <span>Rule: {alert.rule_id}</span>
                            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Real-time SIEM Events Stream */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111111]">Recent Telemetry Stream</h3>
                  <span className="text-xs text-gray-400 font-mono">{events.length} events logged</span>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden shadow-xs">
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {events.map((evt) => (
                      <div key={evt.id} className="p-3 text-xs flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${evt.severity === "CRITICAL" ? "bg-red-500" : evt.severity === "HIGH" ? "bg-[#FF6B00]" : "bg-blue-500"}`} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{evt.event_type}</span>
                            <span className="text-[11px] text-gray-500 font-mono">{evt.source} {evt.source_ip ? `• ${evt.source_ip}` : ""}</span>
                          </div>
                        </div>
                        <SeverityBadge severity={evt.severity} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: AI Threat Intelligence & Investigation Drawer */}
            <div className="lg:col-span-5">
              {selectedAlert ? (
                <CyberCard className="p-6 sticky top-20 space-y-5" hoverable>
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#22272E]">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-[#FF7A00] uppercase tracking-wider mb-1">
                        PHASE 9 THREAT INTELLIGENCE
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {selectedAlert.title}
                      </h3>
                    </div>
                    <SeverityBadge severity={selectedAlert.severity} />
                  </div>

                  {/* Status Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">
                      SOC Workflow Status
                    </label>
                    <select
                      value={selectedAlert.status}
                      onChange={(e) => handleStatusChange(selectedAlert.id, e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D333B] text-white rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="OPEN">OPEN (Unassigned)</option>
                      <option value="IN REVIEW">IN REVIEW (Active Investigation)</option>
                      <option value="RESOLVED">RESOLVED (Threat Mitigated)</option>
                      <option value="FALSE POSITIVE">FALSE POSITIVE (Excluded)</option>
                    </select>
                  </div>

                  {/* AI Copilot Investigation Button */}
                  <div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleAnalyzeAlertWithAI(selectedAlert.id)}
                      isLoading={investigating}
                    >
                      {investigating ? "Correlating Indicators..." : "Run AI Threat Intelligence"}
                    </Button>
                  </div>

                  {/* Intelligence Results */}
                  {intelligence ? (
                    <div className="space-y-4 pt-4 border-t border-[#22272E] text-xs">
                      <div className="flex items-center justify-between bg-[#161B22] p-3 rounded-xl border border-[#2D333B]">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-mono">Risk Score</span>
                          <span className="text-xl font-bold text-[#FF7A00]">{intelligence.risk_score} / 100</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-mono">Confidence</span>
                          <span className="text-sm font-semibold text-emerald-400">{intelligence.confidence}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                          Executive Assessment
                        </label>
                        <p className="text-gray-300 bg-[#161B22] p-3 rounded-xl border border-[#2D333B] leading-relaxed">
                          {intelligence.summary}
                        </p>
                      </div>

                      {intelligence.indicators && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                            Extracted IOC Indicators
                          </label>
                          <div className="p-3 bg-[#090D11] text-[#FF7A00] font-mono rounded-xl border border-[#22272E] text-[11px] overflow-x-auto">
                            {intelligence.indicators}
                          </div>
                        </div>
                      )}

                      {intelligence.recommended_actions && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                            Recommended SOC Actions
                          </label>
                          <div className="text-emerald-400 bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/50 leading-relaxed font-sans">
                            {intelligence.recommended_actions}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#161B22] border border-[#2D333B] text-center text-gray-400 text-xs">
                      Click &quot;Run AI Threat Intelligence&quot; to extract indicators and calculate risk correlation.
                    </div>
                  )}
                </CyberCard>
              ) : (
                <Card className="p-8 text-center text-gray-400 border-dashed sticky top-20">
                  <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs">Select any alert from the triage queue to run deep threat intelligence.</span>
                </Card>
              )}
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
