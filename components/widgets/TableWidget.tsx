"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";

type Props = {
  widget: WidgetConfig;
};

export default function TableWidget({ widget }: Props) {
  const [data, setData] = useState<any[]>([]);
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

      const rows = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
        ? json.data
        : [];

      setData(rows);
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
        Loading data…
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

  if (!data.length) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="relative h-56 overflow-hidden rounded-lg border border-border">
      <div className="max-h-full overflow-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-card border-b border-border">
            <tr>
              {widget.fields?.map((field) => (
                <th
                  key={field}
                  className="px-3 py-2 text-left font-medium text-muted uppercase text-xs tracking-wide"
                >
                  {field.split(".").pop()}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr
                key={idx}
                className="odd:bg-background even:bg-background/50 hover:bg-emerald-500/5 transition"
              >
                {widget.fields?.map((field) => {
                  const value = field
                    .split(".")
                    .reduce((acc: any, key) => acc?.[key], row);

                  const isNumber = typeof value === "number";

                  return (
                    <td
                      key={field}
                      className={`px-3 py-2 ${
                        isNumber ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {value !== undefined
                        ? isNumber
                          ? value.toLocaleString()
                          : String(value)
                        : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
