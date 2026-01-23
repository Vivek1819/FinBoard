"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertTriangle } from "lucide-react";
import { DASHBOARD_TEMPLATES, DashboardTemplate } from "@/data/templates";

type TemplateSelectorModalProps = {
    open: boolean;
    onClose: () => void;
    onSelectTemplate: (template: DashboardTemplate) => void;
};

export default function TemplateSelectorModal({
    open,
    onClose,
    onSelectTemplate,
}: TemplateSelectorModalProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            // Reset state on close
            setTimeout(() => {
                setSelectedId(null);
                setConfirming(false);
            }, 300);
        }
    }, [open]);

    if (!mounted || !open) return null;

    const handleApply = () => {
        if (selectedId) {
            const template = DASHBOARD_TEMPLATES.find((t) => t.id === selectedId);
            if (template) {
                onSelectTemplate(template);
                onClose();
            }
        }
    };

    const selectedTemplate = DASHBOARD_TEMPLATES.find((t) => t.id === selectedId);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Dashboard Templates
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Choose a pre-configured layout to get started quickly.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {confirming ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in slide-in-from-right-8 duration-300">
                            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 text-yellow-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Replace current dashboard?
                            </h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Applying the <strong>{selectedTemplate?.name}</strong> template will remove all your current widgets. This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirming(false)}
                                    className="px-6 py-2 rounded-lg border border-border hover:bg-muted font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                                >
                                    Confirm & Apply
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {DASHBOARD_TEMPLATES.map((template) => {
                                const isSelected = selectedId === template.id;
                                const Icon = template.icon;
                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedId(template.id)}
                                        className={`group relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${isSelected
                                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div
                                                className={`p-3 rounded-lg ${isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                                    }`}
                                            >
                                                <Icon size={24} />
                                            </div>
                                            {isSelected && (
                                                <div className="bg-primary text-primary-foreground p-1 rounded-full animate-in zoom-in spin-in-180 duration-300">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {template.description}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                                            {template.widgets.map((w, i) => (
                                                <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-background border border-border/50 text-muted-foreground/70">
                                                    {w.type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!confirming && (
                    <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!selectedId}
                            onClick={() => setConfirming(true)}
                            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                            Use Template
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
