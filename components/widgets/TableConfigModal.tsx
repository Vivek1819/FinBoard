"use client";

import { X } from "lucide-react";
import { WidgetConfig } from "@/types/widget";
import { useDashboardStore } from "@/store/useDashboardStore";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import FieldSelector from "../field-selector/FieldSelector";

type Props = {
    open: boolean;
    onClose: () => void;
    widget: WidgetConfig;
};

export default function TableConfigModal({ open, onClose, widget }: Props) {
    const updateWidget = useDashboardStore((s) => s.updateWidget);

    const [title, setTitle] = useState(widget.title);
    const [selectedFields, setSelectedFields] = useState<string[]>(
        widget.fields ?? []
    );

    useEffect(() => {
        if (!open) return;
        setTitle(widget.title);
        setSelectedFields(widget.fields ?? []);
    }, [open, widget]);

    if (!open || widget.type !== "table" || !widget.availableFields) {
        return null;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-2xl bg-card border border-border/50 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">Table Settings</h3>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Configure your table widget</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Widget Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl px-3 py-2.5 bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                            placeholder="Enter title..."
                        />
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                            Visible Columns ({selectedFields.length} selected)
                        </label>
                        <FieldSelector
                            fields={widget.availableFields.map(path => ({ path }))}
                            selected={selectedFields}
                            onChange={setSelectedFields}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/50 bg-muted/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={selectedFields.length === 0}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
