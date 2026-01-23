"use client";

import ThemeToggle from "./ThemeToggle";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useState } from "react";
import AddWidgetModal from "@/components/widgets/AddWidgetModal";
import DashboardActions from "@/components/dashboard/DashboardActions";

export default function AppHeader() {
    const addWidget = useDashboardStore((s) => s.addWidget);
    const [open, setOpen] = useState(false);

    return (
        <header className="flex items-center justify-between px-10 py-5 border-b border-border bg-card/70 backdrop-blur-md">
            <div>
                <h1 className="text-lg font-semibold tracking-tight">
                    Finance Dashboard
                </h1>
                <p className="text-sm text-muted">
                    Connect APIs and build your custom dashboard
                </p>
            </div>

            <div className="flex items-center gap-3">
                <DashboardActions />
                <button
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition"
                >
                    + Add Widget
                </button>
                <ThemeToggle />
            </div>
            <AddWidgetModal open={open} onClose={() => setOpen(false)} />
        </header>
    );
}
