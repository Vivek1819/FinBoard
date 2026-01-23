import { WidgetConfig } from "@/types/widget";

export function parseDashboardFile(
  text: string
): { widgets: WidgetConfig[] } {
  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid file format");
  }

  if (!Array.isArray(parsed.widgets)) {
    throw new Error("Invalid dashboard structure");
  }

  return {
    widgets: parsed.widgets,
  };
}
