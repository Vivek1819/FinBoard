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

    useEffect(() => {
        setMounted(true);
    }, []);

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

        addWidget({
            id: crypto.randomUUID(),
            title,
            type,
            api: {
                url: apiUrl,
                refreshInterval,
            },
            fields: selectedFields,
        });

        onClose();
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/15" onClick={onClose} />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card/95 border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Create Widget</h2>
                    <button onClick={onClose}>
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
                            className="w-full rounded-md px-3 py-2 bg-white/5 border border-white/10"
                        />
                    </div>

                    {/* API Provider */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            API Provider (optional)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(API_PRESETS).map(([name, url]) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => {
                                        setApiUrl(url);
                                        setTestStatus("idle");
                                        setFields([]);
                                        setSelectedFields([]);
                                    }}
                                    className="rounded-md px-3 py-2 text-sm text-left
          bg-white/5 border border-white/10
          hover:bg-white/10 hover:border-white/20 transition"
                                >
                                    {name}
                                </button>
                            ))}
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
                                className="flex-1 rounded-md px-3 py-2 bg-white/5 border border-white/10"
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

                    {/* Fields */}
                    {testStatus === "success" && fields.length > 0 && (
                        <div>
                            <label className="block text-sm mb-2">Select fields</label>
                            <div className="max-h-40 overflow-auto border border-white/10 rounded-md">
                                {fields.map((f) => (
                                    <button
                                        key={f.path}
                                        onClick={() =>
                                            setSelectedFields((prev) =>
                                                prev.includes(f.path)
                                                    ? prev.filter((x) => x !== f.path)
                                                    : [...prev, f.path]
                                            )
                                        }
                                        className={`w-full px-3 py-2 text-left text-sm ${selectedFields.includes(f.path)
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "hover:bg-white/5"
                                            }`}
                                    >
                                        {f.path}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Refresh */}
                    <div>
                        <label className="block text-sm mb-1">Refresh interval</label>
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="w-full rounded-md px-3 py-2 bg-white/5 border border-white/10"
                        >
                            <option value={15}>15 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={300}>5 minutes</option>
                        </select>
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
                                        : "bg-white/5 border border-white/10"
                                        }`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleAddWidget}
                        disabled={
                            !title || !type || testStatus !== "success" || selectedFields.length === 0
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
