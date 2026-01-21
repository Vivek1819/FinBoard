"use client";

import { X } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import TableWidget from "./TableWidget";
import CardWidget from "./CardWidget";
import ChartWidget from "./ChartWidget";

export default function WidgetShell({ widget }: { widget: WidgetConfig }) {
  const removeWidget = useDashboardStore((s) => s.removeWidget);

  return (
    <div className="relative rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{widget.title}</h4>
        <button
          onClick={() => removeWidget(widget.id)}
          className="text-muted hover:text-foreground transition"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-2">
        {widget.type === "card" && <CardWidget widget={widget} />}
        {widget.type === "table" && <TableWidget widget={widget} />}
        {widget.type === "chart" && <ChartWidget widget={widget} />}
      </div>
    </div>
  );
}
