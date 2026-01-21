"use client";

import { X } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";

type Props = {
    open: boolean;
    onClose: () => void;
    widget: WidgetConfig;
};

export default function TableConfigModal({ open, onClose, widget }: Props) {
    const updateWidget = useDashboardStore((s) => s.updateWidget);

    if (!open || widget.type !== "table" || !widget.availableFields) return null;

    const allFields = widget.availableFields;
    const selected = widget.fields ?? [];


    function toggleField(field: string) {
        updateWidget(widget.id, (w) => ({
            ...w,
            fields: w.fields!.includes(field)
                ? w.fields!.filter((f) => f !== field)
                : [...w.fields!, field],
        }));
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Edit Table</h3>
                    <button onClick={onClose}>
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                    {allFields.map((field) => (
                        <label key={field} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={selected.includes(field)}
                                onChange={() => toggleField(field)}
                            />
                            <span className="truncate">{field.split(".").pop()}</span>
                        </label>
                    ))}

                </div>
            </div>
        </div>,
        document.body
    );
}
