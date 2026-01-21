"use client";

import { X } from "lucide-react";
import { WidgetConfig, ChartInterval, ChartVariant } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";

const SYMBOLS = ["IBM", "AAPL", "MSFT"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

export default function ChartConfigModal({ open, onClose, widget }: Props) {
  const updateWidget = useDashboardStore((s) => s.updateWidget);

  if (!open || widget.type !== "chart" || !widget.chart) return null;

  const { interval, variant } = widget.chart;

  function updateChart(partial: Partial<WidgetConfig["chart"]>) {
    updateWidget(widget.id, (w) => ({
      ...w,
      chart: {
        ...w.chart!,
        ...partial,
      },
    }));
  }

  function updateSymbol(symbol: string) {
    updateWidget(widget.id, (w) => ({
      ...w,
      api: {
        ...w.api!,
        // keep URL logic simple for now
        url: `/api/alpha-vantage?symbol=${symbol}&interval=${w.chart!.interval}`,
      },
    }));
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Edit Chart</h3>
          <button onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Symbol */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Symbol</label>
          <select
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
            onChange={(e) => updateSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Interval */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Interval</label>
          <select
            value={interval}
            onChange={(e) =>
              updateChart({ interval: e.target.value as ChartInterval })
            }
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Variant */}
        <div>
          <label className="block text-xs mb-1">Chart Type</label>
          <div className="flex gap-2">
            {(["line", "candle"] as ChartVariant[]).map((v) => (
              <button
                key={v}
                onClick={() => updateChart({ variant: v })}
                className={`flex-1 px-2 py-1 rounded-md text-xs border ${
                  variant === v
                    ? "bg-accent text-accent-foreground"
                    : "border-border"
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
