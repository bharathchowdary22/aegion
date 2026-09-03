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
    if (score >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", stroke: "#10B981" };
    if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", stroke: "#F59E0B" };
    return { text: "text-[#FF7A00]", bg: "bg-[#FF6B00]/10", border: "border-[#FF6B00]/30", stroke: "#FF6B00" };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none transition-all duration-700"
          style={{ background: statusStyle.stroke }}
        />
        
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#22272E"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
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

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white">{score}</span>
          <span className="text-[11px] font-mono tracking-widest text-gray-400 uppercase mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
          {status}
        </span>
        <span className="text-xs text-gray-400 font-medium">{subtitle}</span>
      </div>
    </div>
  );
}
