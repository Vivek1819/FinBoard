"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { WidgetConfig } from "@/types/widget";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

export default function CardConfigModal({ open, onClose, widget }: Props) {
  const updateWidget = useDashboardStore((s) => s.updateWidget);

  const [tickers, setTickers] = useState(
    widget.card?.watchlistTickers?.join(",") ?? ""
  );

  if (!open || widget.type !== "card") return null;

  function save() {
    updateWidget(widget.id, (w) => ({
      ...w,
      card: {
        variant: w.card?.variant ?? "watchlist",
        tickerField: w.card?.tickerField,
        availableTickers: w.card?.availableTickers,
        watchlistTickers: tickers
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    }));
    onClose();
  }


  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-card p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Edit Watchlist</h3>
          <button onClick={onClose}><X size={14} /></button>
        </div>

        {widget.card?.variant === "watchlist" &&
          widget.card.availableTickers && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Select watchlist stocks
              </label>

              <div className="max-h-48 overflow-auto rounded-md border border-border p-2 space-y-2">
                {widget.card.availableTickers.map((ticker) => {
                  const selected =
                    widget.card?.watchlistTickers?.includes(ticker);

                  return (
                    <label key={ticker} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          updateWidget(widget.id, (w) => {
                            const prev =
                              w.card?.watchlistTickers ?? [];

                            return {
                              ...w,
                              card: {
                                ...w.card!,
                                watchlistTickers: selected
                                  ? prev.filter((t) => t !== ticker)
                                  : [...prev, ticker],
                              },
                            };
                          })
                        }
                      />
                      <span>{ticker}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}


        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
