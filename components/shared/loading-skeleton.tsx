import React from 'react';

export const LoadingSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md ${className}`} aria-hidden="true" />
);

export const DashboardCardSkeleton = () => (
  <div className="p-6 border rounded-xl w-full h-32 flex flex-col gap-4">
    <LoadingSkeleton className="w-1/3 h-6" />
    <LoadingSkeleton className="w-1/2 h-4" />
  </div>
);

export const LeaderboardTableSkeleton = () => (
  <div className="w-full flex flex-col gap-2">
    <LoadingSkeleton className="w-full h-10" />
    <LoadingSkeleton className="w-full h-10" />
    <LoadingSkeleton className="w-full h-10" />
  </div>
);

export const FormTextareaSkeleton = () => (
  <div className="w-full flex flex-col gap-2">
    <LoadingSkeleton className="w-1/4 h-4" />
    <LoadingSkeleton className="w-full h-32" />
  </div>
);
