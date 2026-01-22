export type WidgetType = "card" | "table" | "chart";

export type ChartInterval = "daily" | "weekly" | "monthly";
export type ChartVariant = "line" | "candle";

export type CardVariant =
  | "watchlist"
  | "gainers"
  | "performance"
  | "financial";

export type TickerOption = {
  ticker: string;
  company: string;
};

export type CardConfig = {
  variant: CardVariant;
  tickerField?: string;
  availableTickers?: TickerOption[];
  watchlistTickers?: string[];
  primaryTicker?: string;
};

export type WidgetConfig = {
  id: string;
  title: string;
  type: WidgetType;

  api?: {
    url: string;
    refreshInterval: number;
  };

  fields?: string[];
  availableFields?: string[];

  card?: CardConfig;

  chart?: {
    x: string;
    y: string;
    interval: ChartInterval;
    variant: ChartVariant;
  };
};

// ✅ REQUIRED FOR VERCEL / NEXT BUILD
export {};
