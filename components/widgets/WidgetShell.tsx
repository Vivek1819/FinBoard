"use client";

import { X, Settings, GripVertical } from "lucide-react";
import { useState } from "react";
import ChartConfigModal from "./ChartConfigModal";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import TableWidget from "./TableWidget";
import CardWidget from "./CardWidget";
import ChartWidget from "./ChartWidget";
import TableConfigModal from "./TableConfigModal";
import CardConfigModal from "./CardConfigModal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function WidgetShell({ widget }: { widget: WidgetConfig }) {
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const [configOpen, setConfigOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
    willChange: "transform",
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        relative rounded-2xl p-5 flex flex-col h-[450px]
        transition-all duration-300 ease-out group
        bg-card border border-border
        shadow-md
        ${isDragging
          ? "shadow-2xl scale-[1.02] z-50 ring-2 ring-primary/30"
          : "hover:shadow-lg hover:-translate-y-0.5 hover:border-border/80"
        }
        ${widget.type === "table" ? "col-span-2" : "col-span-1"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle */}
          <button
            {...listeners}
            className={`p-1 -ml-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            aria-label="Drag widget"
          >
            <GripVertical size={16} />
          </button>

          {/* Title */}
          <h4 className="text-sm font-semibold tracking-tight truncate text-foreground">
            {widget.title}
          </h4>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-0.5 transition-opacity duration-200 ${isDragging ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}>
          <button
            onClick={() => setConfigOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Settings"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={() => removeWidget(widget.id)}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Remove widget"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {widget.type === "card" && <CardWidget widget={widget} />}
        {widget.type === "table" && <TableWidget widget={widget} />}
        {widget.type === "chart" && <ChartWidget widget={widget} />}
      </div>

      {/* Config Modals */}
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

      {widget.type === "card" && (
        <CardConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          widget={widget}
        />
      )}
    </div>
  );
}
