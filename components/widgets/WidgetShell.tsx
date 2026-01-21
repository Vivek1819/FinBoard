"use client";

import { X, Settings } from "lucide-react";
import { useState } from "react";
import ChartConfigModal from "./ChartConfigModal";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import TableWidget from "./TableWidget";
import CardWidget from "./CardWidget";
import ChartWidget from "./ChartWidget";
import TableConfigModal from "./TableConfigModal";

export default function WidgetShell({ widget }: { widget: WidgetConfig }) {
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div
      className={`relative rounded-xl border border-border bg-card p-4
  flex flex-col h-[420px]
  ${widget.type === "table" ? "col-span-2" : "col-span-1"}
`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium truncate">
          {widget.title}
        </h4>

        <div className="flex items-center gap-2">
          {(widget.type === "chart" || widget.type === "table") && (
            <button
              onClick={() => setConfigOpen(true)}
              className="text-muted hover:text-foreground transition"
            >
              <Settings size={14} />
            </button>
          )}


          <button
            onClick={() => removeWidget(widget.id)}
            className="text-muted hover:text-foreground transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex-1 min-h-0">
        {widget.type === "card" && <CardWidget widget={widget} />}
        {widget.type === "table" && <TableWidget widget={widget} />}
        {widget.type === "chart" && <ChartWidget widget={widget} />}
      </div>

      {widget.type === "chart" && (
        <ChartConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          widget={widget}
        />
      )}

      {widget.type === "table" && (
        <TableConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          widget={widget}
        />
      )}
    </div>
  );
}
