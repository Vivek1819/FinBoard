"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { formatValue } from "@/lib/formatter";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import WidgetState from "./WidgetState";
import { cachedFetch } from "@/lib/apiCache";
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
    widget: WidgetConfig;
};

export default function CardWidget({ widget }: Props) {
    const [item, setItem] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const variant = widget.card?.variant ?? "financial";

    const fields = widget.fields ?? [];

    const selectedTicker = widget.card?.primaryTicker;
    const hasData = !loading && !error && item;

    const selectedMeta = widget.card?.availableTickers?.find(
        (t) => t.ticker === selectedTicker
    );

    async function fetchData() {
        if (!widget.api?.url) return;

        try {
            setLoading(true);
            setError(null);

            const isFinnhub = widget.api.url.includes("/finnhub/quote");
            const watchlist = widget.card?.watchlistTickers ?? [];

            if (variant === "watchlist" && isFinnhub && watchlist.length > 0) {
                const ttlMs = (widget.api?.refreshInterval ?? 30) * 1000;

                const results = await Promise.all(
                    watchlist.map(async (ticker) => {
                        try {
                            const raw = await cachedFetch(
                                `/api/finnhub/quote?symbol=${ticker}`,
                                ttlMs
                            );

                            const normalized = normalizeApiResponse(
                                `/api/finnhub/quote?symbol=${ticker}`,
                                raw
                            );

                            return normalized.rows[0] ?? null;
                        } catch {
                            return null;
                        }
                    })
                );

                setItems(results.filter(Boolean));
                return;
            }
            const ttlMs = (widget.api?.refreshInterval ?? 30) * 1000;

            const raw = await cachedFetch(widget.api.url, ttlMs);

            const normalized = normalizeApiResponse(widget.api.url, raw);
            setItems(normalized.rows);


        } catch (err: any) {
            if (err.message === "RATE_LIMIT") {
                setError("Rate limit reached.");
            } else {
                setError("Failed to load data.");
            }
        } finally {
            setLoading(false);
            setLastRefreshed(new Date());
        }
    }

    useEffect(() => {
        fetchData();

        const interval = setInterval(
            fetchData,
            (widget.api?.refreshInterval ?? 30) * 1000
        );

        return () => clearInterval(interval);
    }, [widget.api?.url, widget.api?.refreshInterval, variant]);

    useEffect(() => {
        if (!items.length) return;

        if (
            (variant === "financial" || variant === "performance") &&
            widget.card?.primaryTicker &&
            widget.card?.tickerField
        ) {
            const match = items.find(
                (row) => row.ticker === widget.card!.primaryTicker
            );
            setItem(match ?? null);
        } else {
            setItem(items[0] ?? null);
        }
    }, [
        items,
        variant,
        widget.card?.primaryTicker,
        widget.card?.tickerField,
    ]);

    // Trend Badge Component
    const TrendBadge = ({ value }: { value: number }) => {
        const isPositive = value >= 0;
        return (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isPositive
                ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-400"
                }`}>
                {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                {value > 0 ? "+" : ""}{value}%
            </span>
        );
    };

    if ((variant === "performance" || variant === "financial") && !hasData) {
        return (
            <WidgetState loading={loading} error={error} empty lastUpdated={lastRefreshed}>
                <div className="h-full flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                </div>
            </WidgetState>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // LIST VARIANTS (Gainers / Watchlist) - Creative card-based design
    // ═══════════════════════════════════════════════════════════════════
    if (variant === "gainers" || variant === "watchlist") {
        const rows = variant === "watchlist"
            ? items.filter((stock: any) => widget.card?.watchlistTickers?.includes(stock.ticker))
            : [...items].sort((a, b) => (b.percent_change ?? 0) - (a.percent_change ?? 0)).slice(0, 5);

        if (variant === "watchlist" && !widget.card?.tickerField) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <Activity size={28} className="opacity-40" />
                    </div>
                    <span className="text-sm font-medium">Configure ticker field</span>
                </div>
            );
        }

        return (
            <WidgetState loading={loading} error={error} empty={!items.length} lastUpdated={lastRefreshed}>
                <div className="flex flex-col h-full gap-2 overflow-y-auto custom-scrollbar -mx-1 px-1">
                    {rows.map((stock: any, idx) => {
                        const isPositive = (stock.percent_change ?? 0) >= 0;

                        return (
                            <div
                                key={`${stock.ticker}-${idx}`}
                                className="group relative flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/30 hover:border-border/50 transition-all"
                            >
                                {/* Left side - Company info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Trend indicator circle */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isPositive
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                        : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                        }`}>
                                        {isPositive ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                            {stock.company}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                                            {stock.ticker}
                                        </p>
                                    </div>
                                </div>

                                {/* Right side - Price info */}
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0 pl-2">
                                    <span className="text-sm font-bold tabular-nums text-foreground">
                                        ₹{stock.price?.toLocaleString()}
                                    </span>
                                    <span className={`text-[11px] font-bold tabular-nums ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        }`}>
                                        {stock.percent_change > 0 ? "+" : ""}{stock.percent_change}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </WidgetState>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // PERFORMANCE VARIANT - Compact centered layout
    // ═══════════════════════════════════════════════════════════════════
    if (variant === "performance") {
        if (!item) return <WidgetState loading={loading} error={error} empty><div /></WidgetState>;

        const stock = item;
        const isPositive = stock.percent_change >= 0;

        return (
            <WidgetState loading={loading} error={error} empty={false} lastUpdated={lastRefreshed}>
                <div className="flex flex-col h-full items-center justify-center text-center relative p-2">
                    {/* Ambient glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[50px] opacity-[0.12] pointer-events-none ${isPositive ? "bg-emerald-500" : "bg-rose-500"
                        }`} />

                    {/* Stock Name */}
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                        {selectedTicker}
                    </p>
                    <h2 className="text-xl font-bold text-foreground tracking-tight leading-tight mt-0.5 mb-3">
                        {selectedMeta?.company ?? selectedTicker ?? "—"}
                    </h2>

                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-0.5 mb-2">
                        <span className="text-base font-medium text-muted-foreground/40">₹</span>
                        <span className="text-4xl font-black tracking-tighter tabular-nums text-foreground">
                            {stock.price?.toLocaleString()}
                        </span>
                    </div>

                    {/* Trend Badge */}
                    <div className="flex items-center justify-center gap-2">
                        <TrendBadge value={stock.percent_change} />
                        <span className="text-xs font-medium text-muted-foreground/50 tabular-nums">
                            {stock.net_change > 0 ? "+" : ""}{stock.net_change}
                        </span>
                    </div>
                </div>
            </WidgetState>
        );
    }


    // ═══════════════════════════════════════════════════════════════════
    // FINANCIAL VARIANT - Compact centered layout
    // ═══════════════════════════════════════════════════════════════════
    if (variant === "financial") {
        if (!item || fields.length === 0) return <WidgetState loading={false} error={null} empty><div /></WidgetState>;

        const primaryField = fields[0];
        const primaryValue = item.raw
            ? primaryField.split(".").reduce((acc: any, k) => acc?.[k], item.raw)
            : undefined;

        const primaryLabel = primaryField.split(".").pop()?.replace(/_/g, " ");

        return (
            <WidgetState loading={loading} error={error} empty={!item} lastUpdated={lastRefreshed}>
                <div className="flex flex-col h-full items-center justify-center text-center p-2">
                    {/* Stock Name */}
                    <h2 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                        {selectedMeta?.company ?? selectedTicker ?? "—"}
                    </h2>
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mt-0.5 mb-4">
                        {selectedTicker}
                    </p>

                    {/* Primary Metric */}
                    <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                        {primaryLabel}
                    </p>
                    <p className="text-4xl font-black text-foreground tracking-tighter tabular-nums mb-4">
                        {formatValue(primaryValue, widget.fieldFormats?.[primaryField])}
                    </p>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                        {fields.slice(1, 5).map((field) => {
                            const value = item.raw
                                ? field.split(".").reduce((acc: any, k) => acc?.[k], item.raw)
                                : undefined;

                            const label = field.split(".").pop()?.replace(/_/g, " ");

                            return (
                                <div
                                    key={field}
                                    className="py-2 px-3 rounded-lg bg-muted/30 border border-border/30 text-left"
                                >
                                    <p className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-widest truncate" title={label}>
                                        {label}
                                    </p>
                                    <p className="text-sm font-bold text-foreground tabular-nums truncate">
                                        {formatValue(value, widget.fieldFormats?.[field])}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </WidgetState>
        );
    }

    return null;
}
