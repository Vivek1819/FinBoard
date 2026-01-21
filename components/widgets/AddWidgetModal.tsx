"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";

type AddWidgetModalProps = {
    open: boolean;
    onClose: () => void;
};

export default function AddWidgetModal({
    open,
    onClose,
}: AddWidgetModalProps) {
    if (!open) return null;
    const [apiUrl, setApiUrl] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<
        "idle" | "success" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState("");

    async function testApi() {
        if (!apiUrl) return;

        setIsTesting(true);
        setTestStatus("idle");
        setErrorMessage("");

        try {
            const res = await fetch(apiUrl);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();

            if (typeof data !== "object") {
                throw new Error("Response is not JSON");
            }

            setTestStatus("success");
        } catch (err: any) {
            setTestStatus("error");
            setErrorMessage(err.message || "Failed to fetch API");
        } finally {
            setIsTesting(false);
        }
    }


    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop — softened */}
            <div
                className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Modal container — premium surface */}
            <div
                className="relative z-10 w-full max-w-lg rounded-2xl
                   bg-card/95 border border-white/10
                   shadow-2xl backdrop-blur-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold tracking-tight">
                        Create Widget
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-foreground transition"
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                    {/* Widget Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Widget name
                        </label>
                        <input
                            placeholder="e.g. Bitcoin Price Tracker"
                            className="w-full rounded-md px-3 py-2 text-sm
                         bg-white/5 border border-white/10
                         hover:bg-white/10 focus:bg-white/10
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* API Provider */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            API Provider
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {["CoinGecko", "Alpha Vantage", "Finnhub", "Indian API"].map(
                                (provider) => (
                                    <button
                                        key={provider}
                                        type="button"
                                        className="rounded-md px-3 py-2 text-sm text-left
                               bg-white/5 border border-white/10
                               hover:bg-white/10 hover:border-white/20
                               transition"
                                    >
                                        {provider}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* API Endpoint */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            API Endpoint
                        </label>

                        <div className="flex gap-2">
                            <input
                                value={apiUrl}
                                onChange={(e) => {
                                    setApiUrl(e.target.value);
                                    setTestStatus("idle");
                                }}
                                placeholder="https://api.example.com/data"
                                className="flex-1 rounded-md px-3 py-2 text-sm
                                bg-white/5 border border-white/10
                                hover:bg-white/10 focus:bg-white/10
                                focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />

                            <button
                                type="button"
                                onClick={testApi}
                                disabled={!apiUrl || isTesting}
                                className="shrink-0 px-4 py-2 text-sm rounded-md bg-green-600/90 text-white
                                border border-white/10
                                hover:bg-green-600/80 transition
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTesting ? "Testing…" : "Test"}
                            </button>
                        </div>

                        <p className="mt-1 text-xs text-muted">
                            The API must return JSON data
                        </p>
                    </div>



                    {/* Refresh Interval */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Refresh interval
                        </label>
                        <select
                            className="w-full rounded-md px-3 py-2 text-sm
                         bg-white/5 border border-white/10
                         hover:bg-white/10 focus:bg-white/10"
                        >
                            <option>15 seconds</option>
                            <option>30 seconds</option>
                            <option>1 minute</option>
                            <option>5 minutes</option>
                        </select>
                    </div>

                    {/* Display Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Display type
                        </label>
                        <div className="flex gap-2">
                            {["Card", "Table", "Chart"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className="flex-1 rounded-md px-3 py-2 text-sm
                             bg-white/5 border border-white/10
                             hover:bg-white/10 hover:border-white/20
                             transition"
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md
                       border border-white/10 hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={testStatus !== "success"}
                        className="px-4 py-2 text-sm rounded-md
                       bg-emerald-600/90 text-white
                       opacity-60 cursor-not-allowed"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
