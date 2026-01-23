"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { extractFields } from "@/lib/extractFields";
import type { Field } from "@/lib/extractFields";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { WidgetType } from "@/types/widget";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import { FINNHUB_POPULAR } from "@/lib/finnhubPopular";
import { ALPHA_VANTAGE_SYMBOLS } from "@/lib/alphaVantageSymbols";
import FieldSelector from "@/components/field-selector/FieldSelector";
import CustomSelect from "@/components/ui/CustomSelect";

type AddWidgetModalProps = {
    open: boolean;
    onClose: () => void;
};

const API_PRESETS: Record<string, string> = {
    CoinGecko:
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=100&page=1&sparkline=false",
    "Alpha Vantage":
        "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo",
    Finnhub:
        "/api/finnhub/quote",
    "Indian API":
        "/api/indian-stock"
};

const PROVIDER_SUPPORT: Record<WidgetType, string[]> = {
    chart: ["Alpha Vantage"],
    table: ["CoinGecko", "Indian API"],
    card: ["CoinGecko", "Indian API", "Finnhub"],
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
    const [cardVariant, setCardVariant] = useState<
        "watchlist" | "gainers" | "performance" | "financial"
    >("watchlist");
    const [primaryTicker, setPrimaryTicker] = useState<string | undefined>(undefined);

    const isFinnhub = apiUrl.includes("/finnhub");
    const [chartTicker, setChartTicker] = useState<string>("IBM");

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
        setChartTicker("IBM");

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


    const normalized =
        testStatus === "success" && apiResponse
            ? normalizeApiResponse(apiUrl, apiResponse)
            : { rows: [], tickers: [] };

    const stockOptions =
        cardVariant === "performance" || cardVariant === "financial"
            ? isFinnhub
                ? FINNHUB_POPULAR
                : apiUrl.includes("coingecko")
                    ? normalized.tickers
                    : apiUrl.includes("indian")
                        ? normalized.tickers
                        : []
            : [];


    const allTickers = isFinnhub ? FINNHUB_POPULAR : normalized.tickers;

    useEffect(() => {
        if (testStatus === "success" && apiResponse) {
            const extracted = extractFields(apiResponse).map(f => ({
                ...f,
                path: f.path.replace(/^data\./, ""),
            }));

            setFields(extracted);
        }
    }, [testStatus, apiResponse]);



    if (!open || !mounted) return null;

    async function testApi() {
        if (!apiUrl) return;

        setIsTesting(true);
        setTestStatus("idle");
        setErrorMessage("");

        try {
            const testUrl =
                isFinnhub
                    ? "/api/finnhub/quote?symbol=AAPL"
                    : apiUrl;

            const res = await fetch(testUrl);

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

        const finalApiUrl =
            isFinnhub && primaryTicker
                ? `/api/finnhub/quote?symbol=${primaryTicker}`
                : apiUrl;


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

            ...(type === "chart"
                ? {
                    api: {
                        url: `/api/alpha-vantage?symbol=${chartTicker}&interval=${chartInterval}`,
                        refreshInterval,
                    },
                    chart: {
                        interval: chartInterval,
                        variant: chartVariant,
                    },
                }
                : {
                    api: {
                        url: finalApiUrl,
                        refreshInterval,
                    },
                    fields: selectedFields.map(f => f.replace(/^data\./, "")),
                    availableFields: fields
                        .map((f) => f.path)
                        .filter((path) => !isIdentityField(path)),
                    card: {
                        variant: cardVariant,
                        tickerField: "ticker",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={() => {
                    resetForm();
                    onClose();
                }}
            />


            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold tracking-tight">Create Widget</h2>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>

                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">Widget name</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-lg px-3 py-2 bg-background border border-border focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="My Widget"
                        />
                    </div>
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Display type</label>
                        <div className="flex gap-2">
                            {(["card", "table", "chart"] as WidgetType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${type === t
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === "card" && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Card type</label>
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${cardVariant === value
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border bg-background hover:bg-muted/50"
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
                        <label className="block text-sm font-medium mb-2 text-foreground">
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
                                        className={`rounded-lg px-3 py-2 text-sm text-left border transition-all ${isDisabled
                                            ? "opacity-40 cursor-not-allowed bg-muted/20"
                                            : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
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
                        <label className="block text-sm font-medium mb-1.5 text-foreground">API Endpoint</label>
                        <div className="flex gap-2">
                            <input
                                value={apiUrl}
                                onChange={(e) => {
                                    setApiUrl(e.target.value);
                                    setTestStatus("idle");
                                    setFields([]);
                                    setSelectedFields([]);
                                }}
                                className="flex-1 rounded-lg px-3 py-2 bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="https://api.example.com..."
                            />
                            <button
                                onClick={testApi}
                                disabled={!apiUrl || isTesting}
                                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors disabled:opacity-50"
                            >
                                {isTesting ? "Testing…" : "Test"}
                            </button>
                        </div>

                        {testStatus === "success" && (
                            <div className="mt-2 text-xs font-medium text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                API connection successful
                            </div>
                        )}
                        {testStatus === "error" && (
                            <div className="mt-2 text-xs font-medium text-destructive flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    {type === "chart" && (
                        <div className="space-y-4">
                            {/* Chart Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground">Chart type</label>
                                <div className="flex gap-2">
                                    {["line", "candle"].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setChartVariant(v as any)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${chartVariant === v
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {v.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Select stock
                                </label>
                                <CustomSelect
                                    value={chartTicker}
                                    onChange={setChartTicker}
                                    options={ALPHA_VANTAGE_SYMBOLS.map(s => ({
                                        value: s.ticker,
                                        label: `${s.company} (${s.ticker})`
                                    }))}
                                />
                            </div>



                            {/* Interval */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-foreground">Interval</label>
                                <CustomSelect
                                    value={chartInterval}
                                    onChange={(v) => setChartInterval(v as any)}
                                    options={[
                                        { value: "daily", label: "Daily" },
                                        { value: "weekly", label: "Weekly" },
                                        { value: "monthly", label: "Monthly" },
                                    ]}
                                />
                            </div>
                        </div>
                    )}

                    {/* Fields for TABLE / CARD */}
                    {testStatus === "success" &&
                        fields.length > 0 &&
                        (type === "table" ||
                            (type === "card" && cardVariant === "financial")) && (

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground">
                                    Select fields
                                </label>

                                <FieldSelector
                                    fields={fields}
                                    sample={normalized.rows[0]}
                                    selected={selectedFields}
                                    onChange={setSelectedFields}
                                    filter={(path) => !isIdentityField(path)}
                                />
                            </div>
                        )}


                    {type === "card" &&
                        cardVariant === "watchlist" &&
                        testStatus === "success" &&
                        allTickers.length > 0 && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground">
                                    Select watchlist items
                                </label>

                                <div className="max-h-48 overflow-auto rounded-lg border border-border p-2 space-y-1 custom-scrollbar">
                                    {allTickers.map(({ ticker, company }, index) => {
                                        const selected = watchlistTickers.includes(ticker);

                                        return (
                                            <label key={`${ticker}-${index}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
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
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <span className="font-medium">{ticker}</span>
                                                <span className="text-muted-foreground text-xs truncate">{company}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    {type === "card" &&
                        (cardVariant === "performance" || cardVariant === "financial") &&
                        testStatus === "success" &&
                        stockOptions.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Select stock
                                </label>
                                <CustomSelect
                                    value={primaryTicker ?? ""}
                                    onChange={setPrimaryTicker}
                                    options={[
                                        { value: "", label: "Select stock" },
                                        ...stockOptions.map(({ ticker, company }) => ({
                                            value: ticker,
                                            label: `${company} (${ticker})`
                                        }))
                                    ]}
                                />
                            </div>
                        )}


                    {/* Refresh */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-foreground">Refresh interval</label>
                        <CustomSelect
                            value={String(refreshInterval)}
                            onChange={(v) => setRefreshInterval(Number(v))}
                            options={[
                                { value: "15", label: "15 seconds" },
                                { value: "30", label: "30 seconds" },
                                { value: "60", label: "1 minute" },
                                { value: "300", label: "5 minutes" },
                            ]}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddWidget}
                        disabled={
                            !title ||
                            !type ||
                            testStatus !== "success" ||
                            (type === "table" && selectedFields.length === 0) ||
                            (type === "card" &&
                                cardVariant === "financial" &&
                                selectedFields.length === 0) ||
                            (type === "card" &&
                                cardVariant === "watchlist" &&
                                watchlistTickers.length === 0)
                        }
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
