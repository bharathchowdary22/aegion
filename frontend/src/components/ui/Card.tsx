import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = "", hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#EAEAEA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 ${
        hoverable ? "hover:border-[#FFD2B2] hover:shadow-[0_4px_20px_rgba(255,107,0,0.06)] hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CyberCard({ children, className = "", hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[#0E1217] text-white rounded-2xl border border-[#22272E] shadow-xl transition-all duration-200 ${
        hoverable ? "hover:border-[#FF6B00]/40 hover:shadow-[0_8px_30px_rgba(255,107,0,0.12)] hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {/* Subtle orange accent glow at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-80" />
      {children}
    </div>
  );
}
