"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import WidgetState from "./WidgetState";

type Props = {
    widget: WidgetConfig;
};

export default function CardWidget({ widget }: Props) {
    const [item, setItem] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                // 🔁 fan-out: one request per ticker
                const results = await Promise.all(
                    watchlist.map(async (ticker) => {
                        const res = await fetch(`/api/finnhub/quote?symbol=${ticker}`);
                        if (!res.ok) return null;

                        const json = await res.json();
                        const normalized = normalizeApiResponse(
                            `/api/finnhub/quote?symbol=${ticker}`,
                            json
                        );

                        return normalized.rows[0] ?? null;
                    })
                );

                setItems(results.filter(Boolean));
                return;
            }
            const res = await fetch(widget.api.url);

            if (res.status === 429) {
                throw new Error("RATE_LIMIT");
            }

            if (!res.ok) {
                throw new Error(`HTTP_${res.status}`);
            }

            const json = await res.json();

            const normalized = normalizeApiResponse(widget.api.url, json);
            setItems(normalized.rows);

        } catch (err: any) {
            if (err.message === "RATE_LIMIT") {
                setError("Rate limit reached. Retrying shortly.");
            } else {
                setError("Failed to load data.");
            }
        } finally {
            setLoading(false);
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

    if ((variant === "performance" || variant === "financial") && !hasData) {
        return (
            <WidgetState
                loading={loading}
                error={error}
                empty
            >
                <div />
            </WidgetState>
        );
    }

    if (variant === "gainers") {
        const rows = items;

        const topGainers = [...rows]
            .sort((a, b) => (b.percent_change ?? 0) - (a.percent_change ?? 0))
            .slice(0, 5);

        return (
            <WidgetState
                loading={loading}
                error={error}
                empty={!items.length}
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {topGainers.map((stock: any) => (
                            <div
                                key={stock.ticker}
                                className="flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-sm font-medium">{stock.ticker}</div>
                                    <div className="text-xs text-muted truncate">
                                        {stock.company}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-medium tabular-nums">
                                        ₹{stock.price}
                                    </div>
                                    <div
                                        className={`text-xs font-medium ${stock.percent_change >= 0
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                            }`}
                                    >
                                        {stock.percent_change}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </WidgetState>
        );
    }

    if (variant === "watchlist") {
        const rows = items;

        const watchlist = widget.card?.watchlistTickers ?? [];

        const tickerField = widget.card?.tickerField;

        if (!tickerField) {
            return (
                <div className="h-32 flex items-center justify-center text-sm text-muted">
                    No ticker field configured
                </div>
            );
        }


        const filtered = rows.filter((stock: any) => {
            const ticker = stock.ticker;

            return watchlist.includes(ticker);
        });

        return (
            <WidgetState
                loading={loading}
                error={error}
                empty={!items.length}
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {filtered.map((stock: any) => (
                            <div
                                key={stock.ticker}
                                className="flex items-center justify-between"
                            >
                                <div>
                                    <div className="text-sm font-medium">{stock.ticker}</div>
                                    <div className="text-xs text-muted truncate">
                                        {stock.company}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-medium tabular-nums">
                                        ₹{stock.price}
                                    </div>
                                    <div
                                        className={`text-xs font-medium ${stock.percent_change >= 0
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                            }`}
                                    >
                                        {stock.percent_change}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </WidgetState>
        );
    }

    if (variant === "performance") {
        if (!item) {
            return (
                <WidgetState
                    loading={loading}
                    error={error}
                    empty
                >
                    <div />
                </WidgetState>
            );
        }

        const stock = item;

        return (
            <WidgetState
                loading={loading}
                error={error}
                empty={false}
            >
                <div className="flex flex-col justify-between h-full">
                    {/* Header */}
                    <div>
                        <div className="text-sm font-medium truncate">
                            {selectedMeta?.company ?? selectedTicker ?? "—"}
                        </div>
                        <div className="text-xs text-muted font-mono">
                            {selectedTicker ?? "—"}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="mt-4">
                        <div className="text-4xl font-semibold tabular-nums">
                            ₹{stock.price}
                        </div>

                        <div
                            className={`mt-1 text-sm font-medium ${stock.percent_change >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                                }`}
                        >
                            {stock.percent_change}% ({stock.net_change})
                        </div>
                    </div>

                    {stock.overall_rating && (
                        <div className="mt-4 text-xs text-muted">
                            Trend:{" "}
                            <span className="font-medium">
                                {stock.overall_rating}
                            </span>
                        </div>
                    )}
                </div>
            </WidgetState>
        );
    }


    if (variant === "financial" && fields.length === 0) {
        return (
            <WidgetState loading={false} error={null} empty>
                <div />
            </WidgetState>
        );
    }



    const primaryField = fields[0];
    const source = item?.raw;

    const primaryValue =
        source && primaryField
            ? primaryField.split(".").reduce((acc: any, k) => acc?.[k], source)
            : undefined;




    return (
        <WidgetState
            loading={loading}
            error={error}
            empty={!item}
        >
            <div className="flex flex-col h-full justify-between">
                {/* Header */}
                <div className="mb-3">
                    <div className="text-sm font-medium truncate">
                        {selectedMeta?.company ?? selectedTicker ?? "—"}
                    </div>
                    <div className="text-xs text-muted font-mono">
                        {selectedTicker ?? "—"}
                    </div>
                </div>

                {/* Primary metric */}
                <div>
                    <div className="text-xs uppercase tracking-wide text-muted">
                        {primaryField.split(".").pop()}
                    </div>

                    <div className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
                        {primaryValue !== undefined ? primaryValue : "—"}
                    </div>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-white/10" />

                {/* Secondary metrics */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {fields.slice(1, 5).map((field) => {
                        const value = item.raw
                            ? field.split(".").reduce((acc: any, k) => acc?.[k], item.raw)
                            : undefined;


                        return (
                            <div key={field}>
                                <div className="text-xs text-muted">
                                    {field.split(".").pop()}
                                </div>
                                <div className="font-medium tabular-nums">
                                    {value !== undefined ? value : "—"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </WidgetState>
    );


}
