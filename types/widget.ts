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

  /**
   * TABLE + CARD (existing)
   * Do NOT remove yet
   */
  fields?: string[];

  /**
   * CHART (new, proper)
   */
  chart?: {
    x: string;          // date / time field
    y: string;          // price / value field
    interval: ChartInterval;
    variant: ChartVariant;
  };
};
