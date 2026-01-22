"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { WidgetConfig, CardVariant } from "@/types/widget";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

export default function CardConfigModal({ open, onClose, widget }: Props) {
  const updateWidget = useDashboardStore((s) => s.updateWidget);

  const [variant, setVariant] = useState<CardVariant>(
    widget.card?.variant ?? "financial"
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    widget.fields ?? []
  );
  const [watchlist, setWatchlist] = useState<string[]>(
    widget.card?.watchlistTickers ?? []
  );

  useEffect(() => {
    setVariant(widget.card?.variant ?? "financial");
    setWatchlist(widget.card?.watchlistTickers ?? []);
    setSelectedFields(widget.fields ?? []);
  }, [widget]);


  if (!open || widget.type !== "card") return null;

  function save() {
    updateWidget(widget.id, (w) => ({
      ...w,
      fields:
        variant === "financial" || variant === "performance"
          ? selectedFields
          : w.fields,
      card: {
        variant,
        tickerField: w.card?.tickerField,
        availableTickers: w.card?.availableTickers,
        watchlistTickers:
          variant === "watchlist" ? watchlist : undefined,
      }
    }));

    onClose();
  }

  const isInvalid =
    (variant === "watchlist" && watchlist.length === 0) ||
    ((variant === "financial" || variant === "performance") &&
      selectedFields.length === 0);

  console.log("CARD CONFIG MODAL DEBUG", {
    variant,
    widgetCard: widget.card,
    availableTickers: widget.card?.availableTickers,
    watchlistTickers: widget.card?.watchlistTickers,
  });



  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-xl bg-card p-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Card Settings</h3>
          <button onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Variant selector */}
        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium">
            Card type
          </label>

          <div className="grid grid-cols-2 gap-2">
            {(["watchlist", "gainers", "financial", "performance"] as CardVariant[])
              .map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`px-3 py-2 rounded-md text-sm border
                    ${variant === v
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-background border-border"
                    }`}
                >
                  {v}
                </button>
              ))}
          </div>
        </div>

        {/* Watchlist config */}
        {variant === "watchlist" &&
          widget.card?.availableTickers && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Select stocks
              </label>

              <div className="max-h-48 overflow-auto rounded-md border border-border p-2 space-y-2">
                {widget.card.availableTickers.map((ticker) => {
                  const selected = watchlist.includes(ticker);

                  return (
                    <label
                      key={ticker}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setWatchlist((prev) =>
                            selected
                              ? prev.filter((t) => t !== ticker)
                              : [...prev, ticker]
                          )
                        }
                      />
                      <span>{ticker}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

        {/* Financial / Performance fields config */}
        {(variant === "financial" || variant === "performance") &&
          widget.availableFields && (
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium">
                Select fields to display
              </label>

              <div className="max-h-48 overflow-auto rounded-md border border-border p-2 space-y-2">
                {widget.availableFields.map((field) => {
                  const checked = selectedFields.includes(field);

                  return (
                    <label
                      key={field}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedFields((prev) =>
                            checked
                              ? prev.filter((f) => f !== field)
                              : [...prev, field]
                          )
                        }
                      />
                      <span className="truncate">
                        {field.split(".").pop()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}


        {/* Footer */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm text-muted"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={isInvalid}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-40"
          >
            Save
          </button>

        </div>
      </div>
    </div>,
    document.body
  );
}
