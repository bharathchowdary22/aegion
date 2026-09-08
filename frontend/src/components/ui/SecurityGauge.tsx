import React from "react";

interface SecurityGaugeProps {
  score: number; // 0 to 100
  status: "STRONG" | "MODERATE" | "AT RISK";
  subtitle?: string;
  size?: number;
}

export function SecurityGauge({
  score,
  status,
  subtitle = "Overall Security Posture",
  size = 180,
}: SecurityGaugeProps) {
  // SVG circular arc calculations
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusColor = () => {
    if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", stroke: "#16A34A", trackStroke: "#D1FAE5" };
    if (score >= 50) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", stroke: "#F59E0B", trackStroke: "#FDE68A" };
    return { text: "text-[#E85000]", bg: "bg-[#FFF4EA]", border: "border-[#FFD2B2]", stroke: "#FF6B00", trackStroke: "#FFE4CC" };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Warm ambient glow — subtle, not dark */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ background: statusStyle.stroke }}
        />

        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track — warm light color */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={statusStyle.trackStroke}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={statusStyle.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content — dark readable text on white/warm bg */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-[#171717]">{score}</span>
          <span className="text-[11px] font-mono tracking-widest text-[#9CA3AF] uppercase mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
          {status}
        </span>
        <span className="text-xs text-[#6B7280] font-medium">{subtitle}</span>
      </div>
    </div>
  );
}
