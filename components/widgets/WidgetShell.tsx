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
import CardConfigModal from "./CardConfigModal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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
      className={`relative rounded-xl border border-border bg-card p-4
      flex flex-col h-[420px]
      transition-shadow
      ${isDragging ? "shadow-2xl scale-[1.02]" : "shadow-sm"}
      ${widget.type === "table" ? "col-span-2" : "col-span-1"}`}
    >

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle */}
          <button
            {...listeners}
            className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag widget"
          >
            <GripVertical size={16} />
          </button>

          {/* Title */}
          <h4 className="text-sm font-medium truncate">
            {widget.title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            className="text-muted hover:text-foreground transition"
          >
            <Settings size={14} />
          </button>

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
