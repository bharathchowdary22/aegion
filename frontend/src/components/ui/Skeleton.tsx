import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200/70 to-gray-100 rounded-xl ${className}`}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#EAEAEA] shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 space-x-4">
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="h-5 w-1/6" />
      <Skeleton className="h-5 w-1/6" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}
