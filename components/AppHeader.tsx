"use client";

import { ChartNoAxesCombined, Plus, LayoutTemplate } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import DashboardActions from "@/components/dashboard/DashboardActions";

type Props = {
    onAddClick: () => void;
    onTemplatesClick: () => void;
};

export default function AppHeader({ onAddClick, onTemplatesClick }: Props) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6 max-w-[1920px] mx-auto">
                {/* Brand */}
                <div className="flex items-center gap-3 select-none">

                    <ChartNoAxesCombined size={26} strokeWidth={2.5} />

                    <div className="flex flex-col justify-center">
                        <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                            FinBoard
                        </h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                                Financial Dashboard
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:block">
                        <DashboardActions />
                    </div>

                    <div className="hidden md:block h-6 w-px bg-border/50" />

                    <button
                        onClick={onTemplatesClick}
                        className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-card border border-border px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/50 transition-all hover:-translate-y-0.5"
                        title="Templates"
                    >
                        <LayoutTemplate size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="hidden sm:inline">Templates</span>
                    </button>

                    <button
                        onClick={onAddClick}
                        className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={16} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
                        <span className="hidden sm:inline">Add Widget</span>
                        <span className="sm:hidden">Add</span>
                    </button>

                    <div className="pl-1 border-l border-border/50 ml-1">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
