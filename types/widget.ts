export type WidgetType = "card" | "table" | "chart";

export type ChartInterval = "daily" | "weekly" | "monthly";
export type ChartVariant = "line" | "candle";

export type CardVariant =
  | "watchlist"
  | "gainers"
  | "performance"
  | "financial";

export type CardConfig = {
  variant: CardVariant;

  // watchlist-only
  tickerField?: string;
  availableTickers?: string[];
  watchlistTickers?: string[];
};

export type WidgetConfig = {
  id: string;
  title: string;
  type: WidgetType;

  api?: {
    url: string;
    refreshInterval: number;
  };

  // only for table & financial card
  fields?: string[];
  availableFields?: string[];

  // only for card widgets
  card?: CardConfig;

  // only for chart widgets
  chart?: {
    x: string;
    y: string;
    interval: ChartInterval;
    variant: ChartVariant;
  };
};
