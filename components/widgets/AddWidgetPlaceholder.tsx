"use client";

import { Plus, LayoutDashboard } from "lucide-react";

type Props = {
    onClick: () => void;
    variant?: "default" | "large";
};

export default function AddWidgetPlaceholder({ onClick, variant = "default" }: Props) {
    if (variant === "large") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                    <LayoutDashboard size={40} className="text-primary opacity-80" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Your Dashboard is Empty
                </h2>
                <p className="text-muted-foreground/60 max-w-sm mb-8 text-sm leading-relaxed">
                    Start building your personal financial dashboard by adding your first widget. Track stocks, crypto, and more.
                </p>
                <button
                    onClick={onClick}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ring-offset-2 focus:ring-2 ring-primary/50"
                >
                    <Plus size={18} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                    <span>Add First Widget</span>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center gap-3 h-[450px] rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] transition-all duration-300"
        >
            <div className="w-12 h-12 rounded-xl bg-muted/40 group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-300">
                <Plus size={24} className="text-muted-foreground group-hover:text-primary transition-colors duration-300 transition-transform group-hover:rotate-90" />
            </div>
            <p className="font-semibold text-muted-foreground/60 group-hover:text-primary transition-colors duration-300">
                Add New Widget
            </p>
        </button>
    );
}
