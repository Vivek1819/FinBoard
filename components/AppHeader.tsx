"use client"
import ThemeToggle from "./ThemeToggle";

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/80 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          FinBoard
        </h1>
        <p className="text-sm text-muted">
          Connect APIs and build your custom dashboard
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">
          + Add Widget
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
