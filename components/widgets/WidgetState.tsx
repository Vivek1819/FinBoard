"use client";

import { Loader2, AlertTriangle, Database, RefreshCw } from "lucide-react";

type Props = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: React.ReactNode;
};

export default function WidgetState({
  loading,
  error,
  empty,
  children,
}: Props) {
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3">
        {/* Animated loader */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-foreground/70">Loading data</span>
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Please wait</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-[280px] text-center">
          {/* Error icon with background */}
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle size={24} strokeWidth={1.5} />
          </div>

          {/* Error message */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">Something went wrong</span>
            <span className="text-xs text-muted-foreground leading-relaxed">{error}</span>
          </div>

          {/* Retry hint */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
            <RefreshCw size={10} />
            <span>Data will refresh automatically</span>
          </div>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-[240px] text-center">
          {/* Empty state icon */}
          <div className="p-3 rounded-xl bg-muted/50 text-muted-foreground/50">
            <Database size={24} strokeWidth={1.5} />
          </div>

          {/* Empty message */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground/70">No data available</span>
            <span className="text-xs text-muted-foreground/60 leading-relaxed">
              Configure this widget or check back later
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
