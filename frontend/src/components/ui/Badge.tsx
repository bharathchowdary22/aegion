import React from "react";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type StatusLevel = "OPEN" | "IN REVIEW" | "RESOLVED" | "FALSE POSITIVE" | "STRONG" | "MODERATE" | "AT RISK";

interface SeverityBadgeProps {
  severity: string;
  size?: "sm" | "md";
  className?: string;
}

export function SeverityBadge({ severity, size = "md", className = "" }: SeverityBadgeProps) {
  const norm = severity.toUpperCase() as SeverityLevel;

  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  const styles: Record<SeverityLevel, { bg: string; text: string; dot: string; border: string }> = {
    CRITICAL: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      border: "border-red-200/80",
    },
    HIGH: {
      bg: "bg-orange-50",
      text: "text-[#E85000]",
      dot: "bg-[#FF6B00]",
      border: "border-[#FFD2B2]",
    },
    MEDIUM: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      dot: "bg-amber-500",
      border: "border-amber-200",
    },
    LOW: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200",
    },
    INFO: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
      border: "border-gray-200",
    },
  };

  const style = styles[norm] || styles.INFO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide uppercase ${sizeClasses} ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {norm}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case "RESOLVED":
      case "STRONG":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN REVIEW":
      case "MODERATE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "AT RISK":
      case "OPEN":
        return "bg-[#FFF1E6] text-[#E85000] border-[#FFD2B2]";
      case "FALSE POSITIVE":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-md font-medium border uppercase tracking-wider ${getStyle()} ${className}`}
    >
      {status}
    </span>
  );
}
