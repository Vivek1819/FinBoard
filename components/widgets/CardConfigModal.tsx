"use client";

import { X, ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { FORMAT_OPTIONS } from "@/lib/formatter";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { WidgetConfig, CardVariant } from "@/types/widget";
import { useEffect, useState, useRef } from "react";
import FieldSelector from "@/components/field-selector/FieldSelector";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

// Custom Select Component
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select..."
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; sublabel?: string }[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isOutsideButton = ref.current && !ref.current.contains(target);
      const isOutsideDropdown = !dropdownRef.current || !dropdownRef.current.contains(target);

      if (isOutsideButton && isOutsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border hover:bg-muted/50 transition-all text-left"
      >
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-xs text-muted-foreground/60 font-mono">{selected.sublabel}</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed py-1 bg-popover border border-border/50 rounded-xl shadow-xl max-h-60 overflow-auto custom-scrollbar"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 9999
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${value === option.value ? "bg-primary/5" : ""
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm truncate ${value === option.value ? "font-semibold text-primary" : "text-foreground"}`}>
                  {option.label}
                </span>
                {option.sublabel && (
                  <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">{option.sublabel}</span>
                )}
              </div>
              {value === option.value && <Check size={14} className="text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

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
  const [primaryTicker, setPrimaryTicker] = useState<string | undefined>(
    widget.card?.primaryTicker
  );

  const [title, setTitle] = useState(widget.title);
  const [fieldFormats, setFieldFormats] = useState(widget.fieldFormats ?? {});

  useEffect(() => {
    setTitle(widget.title);
    setVariant(widget.card?.variant ?? "financial");
    setWatchlist(widget.card?.watchlistTickers ?? []);
    setSelectedFields(widget.fields ?? []);
    setPrimaryTicker(widget.card?.primaryTicker);
    setFieldFormats(widget.fieldFormats ?? {});
  }, [widget, open]);


  if (!open || widget.type !== "card") return null;

  function save() {
    updateWidget(widget.id, (w) => ({
      ...w,
      title,
      fieldFormats,
      fields:
        variant === "financial"
          ? selectedFields
          : w.fields,

      card: {
        ...w.card,
        variant,
        availableTickers: w.card?.availableTickers,
        tickerField: w.card?.tickerField,
        ...(variant === "financial" || variant === "performance"
          ? { primaryTicker }
          : {}),
        ...(variant === "watchlist"
          ? { watchlistTickers: watchlist }
          : {}),
      },
    }));

    onClose();
  }


  const isInvalid =
    (variant === "watchlist" && watchlist.length === 0) ||
    (variant === "financial" && (selectedFields.length === 0 || !primaryTicker)) ||
    (variant === "performance" && !primaryTicker);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Card Settings</h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Configure your card widget</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Widget Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
              placeholder="Enter title..."
            />
          </div>

          {/* Variant selector */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Card Type
            </label>

            <div className="grid grid-cols-2 gap-2">
              {(["watchlist", "gainers", "financial", "performance"] as CardVariant[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`group relative px-3 py-3 rounded-xl text-left transition-all border ${variant === v
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border"
                    }`}
                >
                  <span className={`text-sm font-semibold block ${variant === v ? "text-primary" : "text-foreground"}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock selector for financial/performance */}
          {(variant === "financial" || variant === "performance") &&
            widget.card?.availableTickers &&
            widget.card.availableTickers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                  Select Stock
                </label>
                <CustomSelect
                  value={primaryTicker ?? ""}
                  onChange={(val) => setPrimaryTicker(val || undefined)}
                  placeholder="Choose a stock..."
                  options={widget.card.availableTickers.map(({ ticker, company }) => ({
                    value: ticker,
                    label: company,
                    sublabel: ticker
                  }))}
                />
              </div>
            )}

          {/* Watchlist config */}
          {variant === "watchlist" && widget.card?.availableTickers && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                Select Stocks ({watchlist.length} selected)
              </label>

              <div className="max-h-48 overflow-auto rounded-xl border border-border/50 bg-muted/10 p-1.5 space-y-0.5 custom-scrollbar">
                {widget.card.availableTickers.map(({ ticker, company }) => {
                  const selected = watchlist.includes(ticker);

                  return (
                    <label
                      key={`${ticker}-${company}`}
                      className={`relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                    >
                      <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 bg-background"
                        }`}>
                        {selected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{company}</span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">{ticker}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setWatchlist((prev) =>
                            selected ? prev.filter((t) => t !== ticker) : [...prev, ticker]
                          )
                        }
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Financial fields config */}
          {variant === "financial" && widget.availableFields && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                Display Fields ({selectedFields.length} selected)
              </label>
              <FieldSelector
                fields={widget.availableFields.map(path => ({ path }))}
                selected={selectedFields}
                onChange={setSelectedFields}
              />

              {selectedFields.length > 0 && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Data Formatting
                  </label>
                  <div className="space-y-2">
                    {selectedFields.map(field => (
                      <div key={field} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground/80 font-medium ml-1">
                          {field.split(".").pop()?.replace(/_/g, " ")}
                        </span>
                        <CustomSelect
                          value={fieldFormats[field] ?? "default"}
                          onChange={(val) => setFieldFormats(prev => ({ ...prev, [field]: val }))}
                          options={FORMAT_OPTIONS}
                          placeholder="Select format..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/50 bg-muted/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={isInvalid}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
