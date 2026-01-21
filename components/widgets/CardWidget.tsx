"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";

type Props = {
    widget: WidgetConfig;
};

export default function CardWidget({ widget }: Props) {
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        if (!widget.api?.url) return;

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(widget.api.url);

            if (res.status === 429) {
                throw new Error("RATE_LIMIT");
            }

            if (!res.ok) {
                throw new Error(`HTTP_${res.status}`);
            }

            const json = await res.json();

            const first =
                Array.isArray(json) ? json[0] :
                    Array.isArray(json?.data) ? json.data[0] :
                        json;

            setItem(first);
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
    }, [widget.api?.url, widget.api?.refreshInterval]);

    if (loading) {
        return (
            <div className="h-32 flex items-center justify-center text-sm text-muted">
                Loading…
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-32 flex items-center justify-center text-sm text-yellow-400">
                {error}
            </div>
        );
    }

    if (!item || !widget.fields?.length) {
        return (
            <div className="h-32 flex items-center justify-center text-sm text-muted">
                No data available
            </div>
        );
    }

    const primaryField = widget.fields[0];
    const primaryValue = primaryField
        .split(".")
        .reduce((acc: any, key) => acc?.[key], item);

    return (
        <div className="flex h-full flex-col justify-between">
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
                {widget.fields.slice(1, 5).map((field) => {
                    const value = field
                        .split(".")
                        .reduce((acc: any, key) => acc?.[key], item);

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
    );
}
