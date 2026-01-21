"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  widget: WidgetConfig;
};

export default function ChartWidget({ widget }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!widget.fields || widget.fields.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted">
        Select at least 2 fields for chart
      </div>
    );
  }

  const [xField, yField] = widget.fields;

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
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setData(rows);
    } catch (err: any) {
      if (err.message === "RATE_LIMIT") {
        setError("Rate limit reached. Refreshing later.");
      } else {
        setError("Failed to load chart data.");
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
      <div className="h-40 flex items-center justify-center text-sm text-muted">
        Loading chart…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-yellow-400">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted">
        No chart data available
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey={(row) =>
              String(
                xField
                  .split(".")
                  .reduce((acc: any, key) => acc?.[key], row)
              )
            }
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted))"
          />

          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted))" />

          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              fontSize: "12px",
            }}
          />

          <Line
            type="monotone"
            dataKey={(row: any) =>
              yField
                .split(".")
                .reduce((acc: any, key) => acc?.[key], row)
            }
            stroke="hsl(var(--emerald-500))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
