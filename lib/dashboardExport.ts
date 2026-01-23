import { WidgetConfig } from "@/types/widget";

export function exportDashboard(widgets: WidgetConfig[]) {
  const payload = {
    version: 1,
    widgets,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "finboard-dashboard.json";
  a.click();

  URL.revokeObjectURL(url);
}
