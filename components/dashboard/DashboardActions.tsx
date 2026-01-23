"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { exportDashboard } from "@/lib/dashboardExport";
import { parseDashboardFile } from "@/lib/dashboardImport";
import { Download, Upload } from "lucide-react";

export default function DashboardActions() {
    const widgets = useDashboardStore((s) => s.widgets);
    const replaceWidgets = useDashboardStore((s) => s.replaceWidgets);

    function handleExport() {
        exportDashboard(widgets);
    }

    function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const { widgets } = parseDashboardFile(
                    reader.result as string
                );
                replaceWidgets(widgets);
            } catch (err) {
                alert("Invalid dashboard file");
            }
        };

        reader.readAsText(file);
        e.target.value = "";
    }

    return (
        <div className="flex items-center gap-2">
            {/* Export */}
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-accent transition"
            >
                <Download size={14} />
                Export
            </button>

            {/* Import */}
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-accent cursor-pointer transition">
                <Upload size={14} />
                Import
                <input
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                    className="hidden"
                />
            </label>
        </div>

    );
}
