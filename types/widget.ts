export type WidgetType = "card" | "table" | "chart";

export type ChartInterval = "daily" | "weekly" | "monthly";
export type ChartVariant = "line" | "candle";

export type WidgetConfig = {
  id: string;
  title: string;
  type: WidgetType;

  api?: {
    url: string;
    refreshInterval: number;
  };

  // TABLE + CARD
  fields?: string[];
  availableFields?: string[];

  chart?: {
    x: string;
    y: string;
    interval: ChartInterval;
    variant: ChartVariant;
  };
};
