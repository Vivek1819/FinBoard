export type WidgetType = "card" | "table" | "chart";

export type WidgetConfig = {
  id: string;
  title: string;
  type: WidgetType;

  api?: {
    url: string;
    refreshInterval: number;
  };

  fields?: string[];

  chart?: {
    x: string;
    y: string;
  };
};
