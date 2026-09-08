import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = "", hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#F1E4DA] shadow-[0_1px_4px_rgba(255,107,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 ${
        hoverable ? "hover:border-[#FFD2B2] hover:shadow-[0_4px_20px_rgba(255,107,0,0.08)] hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CyberCard — Premium light orange card with top accent border.
 * Used for high-importance panels (security posture, AI intelligence).
 * Maintains the same component interface so existing imports are not broken.
 */
export function CyberCard({ children, className = "", hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[#FFFCF9] text-[#171717] rounded-2xl border border-[#F1E4DA] shadow-[0_2px_16px_rgba(255,107,0,0.06),0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 ${
        hoverable ? "hover:border-[#FFD2B2] hover:shadow-[0_6px_28px_rgba(255,107,0,0.12)] hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {/* Warm orange top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-75 pointer-events-none" />
      {children}
    </div>
  );
}
