"use client";

import { X } from "lucide-react";
import { WidgetConfig, ChartInterval, ChartVariant } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ALPHA_VANTAGE_SYMBOLS } from "@/lib/alphaVantageSymbols";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

export default function ChartConfigModal({ open, onClose, widget }: Props) {

  const [title, setTitle] = useState(widget.title);

  const updateWidget = useDashboardStore((s) => s.updateWidget);


  const [symbol, setSymbol] = useState("IBM");
  const [interval, setInterval] = useState<ChartInterval>("daily");
  const [variant, setVariant] = useState<ChartVariant>("line");

  function alphaFunction(interval: ChartInterval) {
    switch (interval) {
      case "daily":
        return "TIME_SERIES_DAILY";
      case "weekly":
        return "TIME_SERIES_WEEKLY";
      case "monthly":
        return "TIME_SERIES_MONTHLY";
    }
  }

  useEffect(() => {
    if (!open || widget.type !== "chart" || !widget.chart) return;

    setTitle(widget.title);

    const match = widget.api?.url?.match(/symbol=([^&]+)/);
    setSymbol(match?.[1] ?? "IBM");

    setInterval(widget.chart.interval);
    setVariant(widget.chart.variant);
  }, [open, widget]);

  if (!open || widget.type !== "chart" || !widget.chart) return null;

  function onSave() {
    updateWidget(widget.id, (w) => ({
      ...w,
      title,
      chart: {
        ...w.chart!,
        interval,
        variant,
      },
      api: {
        ...w.api!,
        url: `/api/alpha-vantage?symbol=${symbol}&function=${alphaFunction(interval)}`,
      },
    }));

    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Edit Chart</h3>
          <button onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
          />
        </div>


        {/* Symbol */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
          >
            {ALPHA_VANTAGE_SYMBOLS.map(({ ticker, company }) => (
              <option key={ticker} value={ticker}>
                {company} ({ticker})
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
              setInterval(e.target.value as ChartInterval)
            }
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Variant */}
        <div className="mb-4">
          <label className="block text-xs mb-1">Chart Type</label>
          <div className="flex gap-2">
            {(["line", "candle"] as ChartVariant[]).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`flex-1 px-2 py-1 rounded-md text-xs border ${variant === v
                  ? "bg-accent text-accent-foreground"
                  : "border-border"
                  }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-md border"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 text-sm rounded-md bg-primary text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
