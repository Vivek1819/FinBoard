"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { extractFields } from "@/lib/extractFields";
import type { Field } from "@/lib/extractFields";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { WidgetType } from "@/types/widget";

type AddWidgetModalProps = {
    open: boolean;
    onClose: () => void;
};

const API_PRESETS: Record<string, string> = {
    CoinGecko:
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,inr",
    "Alpha Vantage":
        "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo",
    Finnhub:
        "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY",
    "Indian API":
        "/api/indian-stock"
};

const PROVIDER_SUPPORT: Record<WidgetType, string[]> = {
    chart: ["Alpha Vantage"],
    table: ["CoinGecko", "Finnhub", "Indian API"],
    card: ["CoinGecko", "Finnhub", "Indian API"],
};


export default function AddWidgetModal({ open, onClose }: AddWidgetModalProps) {
    const addWidget = useDashboardStore((s) => s.addWidget);

    const [mounted, setMounted] = useState(false);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<WidgetType | null>(null);
    const [refreshInterval, setRefreshInterval] = useState(15);

    const [apiUrl, setApiUrl] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [apiResponse, setApiResponse] = useState<any>(null);
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const [chartVariant, setChartVariant] = useState<"line" | "candle">("line");
    const [chartInterval, setChartInterval] = useState<
        "daily" | "weekly" | "monthly"
    >("daily");
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);

    const [chartX, setChartX] = useState<string | null>(null);
    const [chartY, setChartY] = useState<string | null>(null);
    const [cardVariant, setCardVariant] = useState<
        "watchlist" | "gainers" | "performance" | "financial"
    >("watchlist");
    const [primaryTicker, setPrimaryTicker] = useState<string | undefined>(undefined);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isIdentityField = (path: string) =>
        ["ticker", "symbol", "company", "name"].some((k) =>
            path.toLowerCase().includes(k)
        );


    function resetForm() {
        setTitle("");
        setType(null);
        setApiUrl("");
        setTestStatus("idle");
        setErrorMessage("");
        setApiResponse(null);
        setFields([]);
        setSelectedFields([]);
        setRefreshInterval(15);

        // ADD THESE
        setChartX(null);
        setChartY(null);
        setChartVariant("line");
        setChartInterval("daily");
        setCardVariant("watchlist");
        setWatchlistTickers([]);
        setPrimaryTicker(undefined);
    }


    function inferTickerField(fields: Field[]) {
        return (
            fields.find((f) =>
                ["ticker", "symbol", "code"].some((k) =>
                    f.path.toLowerCase().includes(k)
                )
            )?.path
        );
    }


    const tickerField = inferTickerField(fields);

    const allTickers =
        tickerField && apiResponse
            ? (Array.isArray(apiResponse) ? apiResponse : apiResponse.data ?? [])
                .map((row: any) => {
                    const ticker = tickerField
                        .split(".")
                        .reduce((acc: any, k) => acc?.[k], row);

                    return ticker
                        ? {
                            ticker,
                            company: row.company ?? ticker,
                        }
                        : null;
                })
                .filter(Boolean) as { ticker: string; company: string }[]
            : [];

    useEffect(() => {
        if (testStatus === "success" && apiResponse) {
            setFields(extractFields(apiResponse));
        }
    }, [testStatus, apiResponse]);


    if (!open || !mounted) return null;

    async function testApi() {
        if (!apiUrl) return;

        setIsTesting(true);
        setTestStatus("idle");
        setErrorMessage("");

        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (typeof data !== "object") throw new Error("Response is not JSON");

            setApiResponse(data);
            setTestStatus("success");
        } catch (err: any) {
            setTestStatus("error");
            setErrorMessage(err.message || "Failed to fetch API");
        } finally {
            setIsTesting(false);
        }
    }

    function handleAddWidget() {
        if (!type) return;

        const extractedTickers =
            Array.isArray(apiResponse)
                ? apiResponse
                    .map((row: any) => row.ticker)
                    .filter(Boolean)
                : [];


        addWidget({
            id: crypto.randomUUID(),
            title,
            type,
            api: {
                url: apiUrl,
                refreshInterval,
            },
            ...(type === "chart"
                ? {
                    chart: {
                        x: chartX!,
                        y: chartY!,
                        interval: chartInterval,
                        variant: chartVariant,
                    },
                }
                : {
                    fields: selectedFields,
                    availableFields: fields
                        .map((f) => f.path)
                        .filter((path) => !isIdentityField(path)),

                    card: {
                        variant: cardVariant,
                        tickerField: tickerField ?? "ticker",
                        availableTickers: allTickers,
                        watchlistTickers:
                            cardVariant === "watchlist"
                                ? watchlistTickers.length > 0
                                    ? watchlistTickers
                                    : allTickers.slice(0, 3).map(t => t.ticker)
                                : undefined,
                        primaryTicker:
                            cardVariant === "financial" || cardVariant === "performance"
                                ? primaryTicker ?? undefined
                                : undefined,
                    },
                }),
        });

        resetForm();
        onClose();
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    resetForm();
                    onClose();
                }}
            />


            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Create Widget</h2>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                    >
                        <X size={16} />
                    </button>

                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm mb-1">Widget name</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md px-3 py-2 bg-background border border-border"
                        />
                    </div>
                    {/* Type */}
                    <div>
                        <label className="block text-sm mb-2">Display type</label>
                        <div className="flex gap-2">
                            {(["card", "table", "chart"] as WidgetType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm ${type === t
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : "bg-background border border-border"
                                        }`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === "card" && (
                        <div>
                            <label className="block text-sm mb-2">Card type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ["watchlist", "Watchlist"],
                                    ["gainers", "Market Gainers"],
                                    ["performance", "Performance"],
                                    ["financial", "Financial Data"],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => setCardVariant(value as any)}
                                        className={`px-3 py-2 rounded-md text-sm border ${cardVariant === value
                                            ? "bg-emerald-500/15 text-emerald-400"
                                            : "bg-background border-border"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* API Provider */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            API Provider (optional)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(API_PRESETS).map(([name, url]) => {
                                const isDisabled =
                                    type ? !PROVIDER_SUPPORT[type]?.includes(name) : false;

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            setApiUrl(url);
                                            setTestStatus("idle");
                                            setFields([]);
                                            setSelectedFields([]);
                                        }}
                                        className={`rounded-md px-3 py-2 text-sm text-left border transition ${isDisabled
                                            ? "opacity-40 cursor-not-allowed bg-background"
                                            : "bg-background border-border hover:bg-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        {name}

                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API URL */}
                    <div>
                        <label className="block text-sm mb-1">API Endpoint</label>
                        <div className="flex gap-2">
                            <input
                                value={apiUrl}
                                onChange={(e) => {
                                    setApiUrl(e.target.value);
                                    setTestStatus("idle");
                                    setFields([]);
                                    setSelectedFields([]);
                                }}
                                className="flex-1 rounded-md px-3 py-2 bg-background border border-border"
                            />
                            <button
                                onClick={testApi}
                                disabled={!apiUrl || isTesting}
                                className="px-4 py-2 rounded-md bg-emerald-600 text-white"
                            >
                                {isTesting ? "Testing…" : "Test"}
                            </button>
                        </div>

                        {testStatus === "success" && (
                            <div className="mt-2 text-sm text-emerald-400">API connection successful</div>
                        )}
                        {testStatus === "error" && (
                            <div className="mt-2 text-sm text-red-400">{errorMessage}</div>
                        )}
                    </div>

                    {type === "chart" && (
                        <div className="space-y-4">
                            {/* Chart Type */}
                            <div>
                                <label className="block text-sm mb-2">Chart type</label>
                                <div className="flex gap-2">
                                    {["line", "candle"].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setChartVariant(v as any)}
                                            className={`flex-1 px-3 py-2 rounded-md text-sm ${chartVariant === v
                                                ? "bg-emerald-500/15 text-emerald-400"
                                                : "bg-background border border-border"
                                                }`}
                                        >
                                            {v.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            {/* Interval */}
                            <div>
                                <label className="block text-sm mb-1">Interval</label>
                                <select
                                    value={chartInterval}
                                    onChange={(e) => setChartInterval(e.target.value as any)}
                                    className="w-full rounded-md px-3 py-2 bg-background border border-border"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Fields for TABLE / CARD */}
                    {testStatus === "success" &&
                        fields.length > 0 &&
                        (type === "table" ||
                            (type === "card" && cardVariant === "financial" )) && (

                            <div className="space-y-3">
                                <label className="block text-sm font-medium">
                                    Select fields
                                </label>

                                <div className="max-h-48 overflow-auto rounded-md border border-border p-2 space-y-2">
                                    {fields
                                        .filter((f) => !isIdentityField(f.path))
                                        .map((f) => (
                                            <label key={f.path} className="flex items-center gap-2 text-sm">

                                                <input
                                                    type="checkbox"
                                                    checked={selectedFields.includes(f.path)}
                                                    onChange={() =>
                                                        setSelectedFields((prev) =>
                                                            prev.includes(f.path)
                                                                ? prev.filter((x) => x !== f.path)
                                                                : [...prev, f.path]
                                                        )
                                                    }
                                                />
                                                <span className="truncate">{f.path}</span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        )}

                    {type === "card" &&
                        cardVariant === "watchlist" &&
                        testStatus === "success" &&
                        allTickers.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">
                                    Select watchlist items
                                </label>

                                <div className="max-h-48 overflow-auto rounded-md border border-border p-2 space-y-2">
                                    {allTickers.map(({ ticker, company }) => {
                                        const selected = watchlistTickers.includes(ticker);

                                        return (
                                            <label key={ticker} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        setWatchlistTickers(prev =>
                                                            selected
                                                                ? prev.filter(t => t !== ticker)
                                                                : [...prev, ticker]
                                                        )
                                                    }
                                                />
                                                <span>{company} ({ticker})</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    {type === "card" &&
                        (cardVariant === "financial" || cardVariant === "performance") &&
                        testStatus === "success" &&
                        allTickers.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">
                                    Select stock
                                </label>

                                <select
                                    value={primaryTicker ?? ""}
                                    onChange={(e) => setPrimaryTicker(e.target.value)}
                                    className="w-full rounded-md px-3 py-2 bg-background border border-border"
                                >
                                    <option value="">Select Stock</option>
                                    {allTickers.map(({ ticker, company }) => (
                                        <option key={ticker} value={ticker}>
                                            {company} ({ticker})
                                        </option>
                                    ))}

                                </select>
                            </div>
                        )}
                    {/* Fields */}
                    {testStatus === "success" && fields.length > 0 && type === "chart" && (
                        <div className="space-y-4">
                            {/* X Axis */}
                            <div>
                                <label className="block text-sm mb-1">Date / Time field (X axis)</label>
                                <select
                                    value={chartX ?? ""}
                                    onChange={(e) => setChartX(e.target.value)}
                                    className="w-full rounded-md px-3 py-2 bg-background border border-border"
                                >
                                    <option value="">Select field</option>
                                    {fields.map((f) => (
                                        <option key={f.path} value={f.path}>
                                            {f.path}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Y Axis */}
                            <div>
                                <label className="block text-sm mb-1">Value field (Y axis)</label>
                                <select
                                    value={chartY ?? ""}
                                    onChange={(e) => setChartY(e.target.value)}
                                    className="w-full rounded-md px-3 py-2 bg-background border border-border"
                                >
                                    <option value="">Select field</option>
                                    {fields.map((f) => (
                                        <option key={f.path} value={f.path}>
                                            {f.path}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}


                    {/* Refresh */}
                    <div>
                        <label className="block text-sm mb-1">Refresh interval</label>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="w-full rounded-md px-3 py-2 bg-background border border-border
"
                        >
                            <option value={15}>15 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={300}>5 minutes</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleAddWidget}
                        disabled={
                            !title ||
                            !type ||
                            testStatus !== "success" ||
                            (type === "chart" && (!chartX || !chartY)) ||
                            (type === "table" && selectedFields.length === 0) ||
                            (type === "card" &&
                                cardVariant === "financial" &&
                                selectedFields.length === 0) ||
                            (type === "card" &&
                                cardVariant === "watchlist" &&
                                watchlistTickers.length === 0)
                        }
                        className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-40"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
