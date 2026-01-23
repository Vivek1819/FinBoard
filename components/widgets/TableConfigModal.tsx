"use client";

import { X } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  widget: WidgetConfig;
};

export default function TableConfigModal({ open, onClose, widget }: Props) {
  const updateWidget = useDashboardStore((s) => s.updateWidget);

  // ✅ Local editable state
  const [title, setTitle] = useState(widget.title);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    widget.fields ?? []
  );

  // ✅ Sync when modal opens or widget changes
  useEffect(() => {
    if (!open) return;
    setTitle(widget.title);
    setSelectedFields(widget.fields ?? []);
  }, [open, widget]);

  // ✅ Hooks done — safe early return
  if (!open || widget.type !== "table" || !widget.availableFields) {
    return null;
  }

  function toggleField(field: string) {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  }

  function save() {
    updateWidget(widget.id, (w) => ({
      ...w,
      title,
      fields: selectedFields,
    }));
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Edit Table</h3>
          <button onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md px-3 py-2 bg-background border border-border"
          />
        </div>

        {/* Fields */}
        <div className="space-y-2 max-h-64 overflow-auto">
          {widget.availableFields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedFields.includes(field)}
                onChange={() => toggleField(field)} // ✅ FIXED
              />
              <span className="truncate">{field.split(".").pop()}</span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-muted">
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
