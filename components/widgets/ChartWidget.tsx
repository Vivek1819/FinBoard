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
  ComposedChart,
  Bar,
} from "recharts";
import { normalizeAlphaVantage } from "@/lib/adapters/alphaVantage";
import WidgetState from "./WidgetState";
import { cachedFetch } from "@/lib/apiCache";

type Props = {
  widget: WidgetConfig;
};

function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;

  const isUp = close >= open;
  const color = isUp ? "rgb(var(--accent))" : "rgb(var(--destructive))";

  const centerX = x + width / 2;

  const scaleY = (value: number) =>
    y + height * (1 - (value - low) / (high - low || 1));

  const openY = scaleY(open);
  const closeY = scaleY(close);
  const highY = scaleY(high);
  const lowY = scaleY(low);

  return (
    <g>
      {/* Wick */}
      <line
        x1={centerX}
        x2={centerX}
        y1={highY}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />

      {/* Body */}
      <rect
        x={x}
        y={Math.min(openY, closeY)}
        width={width}
        height={Math.max(Math.abs(openY - closeY), 1)}
        fill={color}
        rx={1}
      />
    </g>
  );
}


export default function ChartWidget({ widget }: Props) {
  // Guard: only chart widgets reach here
  if (widget.type !== "chart" || !widget.chart || !widget.api) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted">
        Invalid chart configuration
      </div>
    );
  }

  const api = widget.api;
  const chart = widget.chart;
  const { interval, variant } = chart;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const ttlMs =
        (widget.api?.refreshInterval ?? 60) * 1000;

      // ✅ cached fetch
      const raw = await cachedFetch(api.url, ttlMs);

      const normalized = normalizeAlphaVantage(raw, interval);

      const windowed =
        interval === "daily"
          ? normalized.slice(-120)
          : interval === "weekly"
            ? normalized.slice(-104)
            : normalized.slice(-120);

      setData(windowed);
    } catch (err: any) {
      if (err.message === "HTTP_429" || err.message === "RATE_LIMIT") {
        setError("Rate limit reached. Try again later.");
      } else {
        setError("Failed to load chart data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [interval]);

  if (variant === "line") {
    return (
      <WidgetState
        loading={loading}
        error={error}
        empty={!data || data.length === 0}
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                stroke="rgb(var(--muted))"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="rgb(var(--muted))"
                domain={[
                  (min: number) => min * 0.98,
                  (max: number) => max * 1.02,
                ]}
              />

              <Tooltip
                contentStyle={{
                  background: "rgb(var(--card))",
                  border: "1px solid rgb(var(--border))",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="rgb(var(--accent))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </WidgetState>
    );
  }

  /* ---------- CANDLE CHART ---------- */
  return (
    <WidgetState
      loading={loading}
      error={error}
      empty={!data || data.length === 0}
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              stroke="rgb(var(--muted))"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="rgb(var(--muted))"
              domain={[
                (min: number) => min * 0.98,
                (max: number) => max * 1.02,
              ]}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--card))",
                border: "1px solid rgb(var(--border))",
                fontSize: "12px",
              }}
              formatter={(value: any, name?: string | number) => [
                value,
                typeof name === "string" ? name.toUpperCase() : name,
              ]}
            />
            <Bar
              dataKey="close"
              shape={<CandleShape />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </WidgetState>
  );
}
