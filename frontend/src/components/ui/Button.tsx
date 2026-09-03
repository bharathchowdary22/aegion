import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-xl gap-2",
    lg: "text-base px-5 py-3 rounded-xl gap-2.5",
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#FF6B00] to-[#FF7A00] text-white hover:brightness-105 active:scale-[0.98] shadow-sm hover:shadow-[0_4px_16px_rgba(255,107,0,0.25)]",
    secondary: "bg-[#FFF1E6] text-[#E85000] hover:bg-[#FFE6D4] active:scale-[0.98]",
    outline: "bg-white border border-[#EAEAEA] text-[#111111] hover:bg-[#FAFAFA] hover:border-[#D1D5DB] active:scale-[0.98]",
    ghost: "text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] active:scale-[0.98]",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.98]",
    dark: "bg-[#0E1217] text-white hover:bg-[#161B22] border border-[#2D333B] active:scale-[0.98] shadow-sm",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
