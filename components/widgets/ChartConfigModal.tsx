"use client";

import { X, ChevronDown, Check, LineChart, CandlestickChart } from "lucide-react";
import { WidgetConfig, ChartInterval, ChartVariant } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";
import { useEffect, useState, useRef } from "react";
import { ALPHA_VANTAGE_SYMBOLS } from "@/lib/alphaVantageSymbols";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

// Custom Select Component with Portal
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
      // Check if click is outside both the button container AND the dropdown portal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Chart Settings</h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Configure your chart widget</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
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

          {/* Symbol */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Stock Symbol
            </label>
            <CustomSelect
              value={symbol}
              onChange={setSymbol}
              placeholder="Choose a stock..."
              options={ALPHA_VANTAGE_SYMBOLS.map(({ ticker, company }) => ({
                value: ticker,
                label: company,
                sublabel: ticker
              }))}
            />
          </div>

          {/* Interval */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Time Interval
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["daily", "weekly", "monthly"] as ChartInterval[]).map((int) => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${interval === int
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border text-muted-foreground"
                    }`}
                >
                  {int.charAt(0).toUpperCase() + int.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Variant */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              Chart Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "line", label: "Line", icon: LineChart },
                { value: "candle", label: "Candlestick", icon: CandlestickChart }
              ] as { value: ChartVariant; label: string; icon: any }[]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setVariant(value)}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all border ${variant === value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border text-muted-foreground"
                    }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
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
            onClick={onSave}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
