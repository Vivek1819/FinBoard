export type CandlePoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function normalizeAlphaVantage(
  raw: any,
  interval: "daily" | "weekly" | "monthly"
): CandlePoint[] {
  const keyMap: Record<string, string[]> = {
    daily: ["Time Series (Daily)", "Time Series (Daily Adjusted)"],
    weekly: ["Weekly Time Series", "Weekly Adjusted Time Series"],
    monthly: ["Monthly Time Series"],
  };


  const possibleKeys = keyMap[interval];
  const seriesKey = possibleKeys.find((k) => raw?.[k]);
  const series = seriesKey ? raw[seriesKey] : null;


  if (!series) return [];

  console.log("AlphaVantage keys:", Object.keys(raw));


  return Object.entries(series)
    .map(([time, values]: any) => ({
      time,
      open: Number(values["1. open"]),
      high: Number(values["2. high"]),
      low: Number(values["3. low"]),
      close: Number(values["4. close"]),
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
