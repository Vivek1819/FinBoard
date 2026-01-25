"use client";

import { X, Zap } from "lucide-react";
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

    function alphaFunction(interval: "daily" | "weekly" | "monthly") {
        switch (interval) {
            case "daily":
                return "TIME_SERIES_DAILY";
            case "weekly":
                return "TIME_SERIES_WEEKLY";
            case "monthly":
                return "TIME_SERIES_MONTHLY";
        }
    }



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
                        url: `/api/alpha-vantage?symbol=${chartTicker}&function=${alphaFunction(chartInterval)}`,
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

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card border border-border/50 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/5">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">Create Widget</h2>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Add a new data block to your dashboard</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-6 overflow-y-auto custom-scrollbar bg-card/50">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Widget Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm placeholder:text-muted-foreground/40"
                            placeholder="e.g., Portfolio Overview"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Widget Type
                        </label>
                        <div className="flex gap-2">
                            {(["card", "table", "chart"] as WidgetType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${type === t
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/50"
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === "card" && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                Card Style
                            </label>
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
                                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-center border ${cardVariant === value
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                            : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* API Provider */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            Data Source <span className="text-muted-foreground/40 font-normal normal-case ml-1">(Optional Preset)</span>
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
                                        className={`rounded-xl px-3 py-2.5 text-sm text-left border transition-all ${isDisabled
                                            ? "opacity-40 cursor-not-allowed bg-muted/10 border-transparent"
                                            : apiUrl === url
                                                ? "bg-primary/5 border-primary text-primary ring-1 ring-primary/20"
                                                : "bg-muted/20 border-border/50 hover:border-primary/50 hover:bg-muted/40"
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
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            API Endpoint
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <div className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none opacity-0 group-focus-within:opacity-100 ring-2 ring-primary/10 ${testStatus === "success" ? "ring-emerald-500/20" : testStatus === "error" ? "ring-destructive/20" : ""
                                    }`} />
                                <input
                                    value={apiUrl}
                                    onChange={(e) => {
                                        setApiUrl(e.target.value);
                                        setTestStatus("idle");
                                        setFields([]);
                                        setSelectedFields([]);
                                    }}
                                    className={`w-full rounded-xl px-4 py-2.5 bg-muted/30 border focus:bg-background outline-none transition-all text-sm placeholder:text-muted-foreground/40 ${testStatus === "success" ? "border-emerald-500/50" :
                                        testStatus === "error" ? "border-destructive/50" :
                                            "border-border/50 focus:border-primary/50"
                                        }`}
                                    placeholder="https://api.example.com/v1/data..."
                                />
                            </div>
                            <button
                                onClick={testApi}
                                disabled={!apiUrl || isTesting}
                                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${testStatus === "success"
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                    }`}
                            >
                                {isTesting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                        Testing
                                    </span>
                                ) : testStatus === "success" ? "Verified" : "Connect"}
                            </button>
                        </div>

                        {testStatus === "success" && (
                            <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-lg w-fit animate-in fade-in slide-in-from-top-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Connection successful
                            </div>
                        )}
                        {testStatus === "error" && (
                            <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg w-full animate-in fade-in slide-in-from-top-1 ${errorMessage.toLowerCase().includes("rate limit")
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-destructive/10 text-destructive"
                                }`}>
                                {errorMessage.toLowerCase().includes("rate limit") ? (
                                    <>
                                        <Zap size={14} className="flex-shrink-0" />
                                        <span>Rate limit reached. Please wait a moment.</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                        <span className="truncate">{errorMessage}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {type === "chart" && (
                        <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                            {/* Chart Type */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                    Chart Type
                                </label>
                                <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/50">
                                    {["line", "candle"].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setChartVariant(v as any)}
                                            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${chartVariant === v
                                                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {v.charAt(0).toUpperCase() + v.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    Stock
                                </label>
                                <CustomSelect
                                    value={chartTicker}
                                    onChange={setChartTicker}
                                    options={ALPHA_VANTAGE_SYMBOLS.map(s => ({
                                        value: s.ticker,
                                        label: s.company,
                                        sublabel: s.ticker
                                    }))}
                                    placeholder="Select stock..."
                                />
                            </div>

                            {/* Interval */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                    Time Interval
                                </label>
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

                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
                                    Available Data Fields
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
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                    Select Watchlist Items
                                </label>

                                <div className="max-h-48 overflow-auto rounded-xl border border-border/50 bg-muted/20 p-1.5 space-y-0.5 custom-scrollbar">
                                    {allTickers.map(({ ticker, company }, index) => {
                                        const selected = watchlistTickers.includes(ticker);

                                        return (
                                            <label
                                                key={`${ticker}-${index}`}
                                                className={`relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected ? "bg-primary border-primary" : "border-border bg-background"
                                                    }`}>
                                                    {selected && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium leading-none">{company}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{ticker}</span>
                                                </div>
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
                                                    className="sr-only"
                                                />
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
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                    Select Stock
                                </label>
                                <CustomSelect
                                    value={primaryTicker ?? ""}
                                    onChange={setPrimaryTicker}
                                    options={[
                                        ...stockOptions.map(({ ticker, company }) => ({
                                            value: ticker,
                                            label: company,
                                            sublabel: ticker
                                        }))
                                    ]}
                                    placeholder="Select a stock..."
                                />
                            </div>
                        )}


                    {/* Refresh */}
                    <div className="pt-2 border-t border-border/40">
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Refresh Rate
                        </label>
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
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none"
                    >
                        Create Widget
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
