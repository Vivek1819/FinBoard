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
  Area,
} from "recharts";
import { normalizeAlphaVantage } from "@/lib/adapters/alphaVantage";
import WidgetState from "./WidgetState";
import { cachedFetch } from "@/lib/apiCache";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  widget: WidgetConfig;
};

function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;

  const isUp = close >= open;
  const color = isUp ? "#10b981" : "#f43f5e";

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
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Body */}
      <rect
        x={x}
        y={Math.min(openY, closeY)}
        width={width}
        height={Math.max(Math.abs(openY - closeY), 1)}
        fill={color}
        rx={1.5}
      />
    </g>
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const isCandle = data?.open !== undefined;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">{label}</p>

      {isCandle ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground text-xs">Open</span>
            <span className="font-semibold tabular-nums text-foreground">₹{data.open}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground text-xs">High</span>
            <span className="font-semibold tabular-nums text-emerald-500">₹{data.high}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground text-xs">Close</span>
            <span className="font-semibold tabular-nums text-foreground">₹{data.close}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground text-xs">Low</span>
            <span className="font-semibold tabular-nums text-rose-500">₹{data.low}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Close</span>
          <span className="font-bold tabular-nums text-foreground">₹{payload[0]?.value}</span>
        </div>
      )}
    </div>
  );
}


export default function ChartWidget({ widget }: Props) {
  if (widget.type !== "chart" || !widget.chart || !widget.api) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
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
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const ttlMs = (widget.api?.refreshInterval ?? 60) * 1000;

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
      setLastRefreshed(new Date());
    }
  }

  useEffect(() => {
    fetchData();
  }, [interval, api.url]);

  // Calculate trend for display
  const firstClose = data[0]?.close;
  const lastClose = data[data.length - 1]?.close;
  const priceChange = lastClose && firstClose ? lastClose - firstClose : 0;
  const percentChange = firstClose ? ((priceChange / firstClose) * 100).toFixed(2) : "0";
  const isPositive = priceChange >= 0;

  if (variant === "line") {
    return (
      <WidgetState
        loading={loading}
        error={error}
        empty={!data || data.length === 0}
        lastUpdated={lastRefreshed}
      >
        <div className="h-full w-full flex flex-col">
          {/* Stats Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                ₹{lastClose?.toLocaleString() ?? "—"}
              </span>
              <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive
                ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-400"
                }`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? "+" : ""}{percentChange}%
              </div>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
              {interval}
            </span>
          </div>

          {/* Chart */}
          <div className="flex-1 -ml-2 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                  domain={[
                    (min: number) => min * 0.995,
                    (max: number) => max * 1.005,
                  ]}
                  width={45}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="transparent"
                  fill="url(#lineGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? "#10b981" : "#f43f5e"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: "var(--background)",
                    fill: isPositive ? "#10b981" : "#f43f5e"
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
      lastUpdated={lastRefreshed}
    >
      <div className="h-full w-full flex flex-col">
        {/* Stats Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              ₹{lastClose?.toLocaleString() ?? "—"}
            </span>
            <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive
              ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-400"
              }`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? "+" : ""}{percentChange}%
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
            {interval}
          </span>
        </div>

        {/* Chart */}
        <div className="flex-1 -ml-2 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                dy={8}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
                domain={[
                  (min: number) => min * 0.995,
                  (max: number) => max * 1.005,
                ]}
                width={45}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="close"
                shape={<CandleShape />}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetState>
  );
}
