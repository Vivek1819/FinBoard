"use client";

import { Loader2, AlertTriangle, Database, RefreshCw, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: React.ReactNode;
  lastUpdated?: Date | null;
};

// Check if error is rate limit related
function isRateLimitError(error: string | null): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("too many") ||
    lower.includes("429");
}

export default function WidgetState({
  loading,
  error,
  empty,
  children,
  lastUpdated,
}: Props) {
  const [countdown, setCountdown] = useState(60);
  const isRateLimit = isRateLimitError(error);

  // Countdown timer for rate limit
  useEffect(() => {
    if (!isRateLimit) return;

    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRateLimit, error]);

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

  // Special Rate Limit Exceeded State
  if (isRateLimit) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-[300px] text-center">
          {/* Animated icon container */}
          <div className="relative">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
              <Zap size={28} strokeWidth={1.5} />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-semibold text-foreground">API Limit Reached</span>
            <span className="text-xs text-muted-foreground leading-relaxed">
              We've hit the rate limit for this API. The data will automatically refresh when available.
            </span>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/50">
            <Clock size={14} className="text-muted-foreground" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tabular-nums text-foreground">{countdown}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">sec</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw size={10} className={countdown === 0 ? "animate-spin" : ""} />
              <span>{countdown === 0 ? "Retrying..." : "Auto-retry"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generic Error State
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
      {lastUpdated && (
        <div className="flex-shrink-0 flex items-center justify-end gap-1.5 pt-2 pb-0.5 px-1 opacity-60 hover:opacity-100 transition-opacity">
          <RefreshCw size={10} className="text-muted-foreground/70" />
          <span className="text-[10px] font-medium text-muted-foreground/70 tabular-nums">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}
