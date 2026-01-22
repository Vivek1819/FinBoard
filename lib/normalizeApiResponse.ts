import type { TickerOption } from "@/types/widget";

export type NormalizedRow = {
  ticker: string;
  company: string;
  price?: number;
  percent_change?: number;
  raw: any;
};

type NormalizeResult = {
  rows: NormalizedRow[];
  tickers: TickerOption[];
};

export function normalizeApiResponse(
  apiUrl: string,
  json: any
): NormalizeResult {
  // -------------------------------
  // COINGECKO
  // -------------------------------
  if (apiUrl.includes("coingecko.com")) {
    const rows = (Array.isArray(json) ? json : []).map((coin: any) => ({
      ticker: coin.symbol?.toUpperCase(),
      company: coin.name,
      price: coin.current_price,
      percent_change: coin.price_change_percentage_24h,
      raw: coin,
    }));

    return {
      rows,
      tickers: rows.map((r) => ({
        ticker: r.ticker,
        company: r.company,
      })),
    };
  }

  // -------------------------------
  // INDIAN API (fallback – already compatible)
  // -------------------------------
  if (Array.isArray(json?.data)) {
    return {
      rows: json.data.map((row: any) => ({
        ticker: row.ticker,
        company: row.company,
        price: row.price,
        percent_change: row.percent_change,
        raw: row,
      })),
      tickers: json.data.map((row: any) => ({
        ticker: row.ticker,
        company: row.company,
      })),
    };
  }

  // -------------------------------
  // DEFAULT (safe fallback)
  // -------------------------------
  return { rows: [], tickers: [] };
}
