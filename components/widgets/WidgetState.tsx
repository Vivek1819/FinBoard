"use client";

import { Loader2, AlertTriangle } from "lucide-react";

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
      <div className="h-full w-full flex items-center justify-center text-sm text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-destructive">
          <AlertTriangle size={14} />
          {error}
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted">
        No data available
      </div>
    );
  }

  return <>{children}</>;
}
