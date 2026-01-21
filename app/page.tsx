"use client";

import AppHeader from "@/components/AppHeader";
import WidgetShell from "@/components/widgets/WidgetShell";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function Home() {
  const widgets = useDashboardStore((s) => s.widgets);

  return (
    <main>
      <AppHeader />

      <div className="p-10">
        {widgets.length === 0 ? (
          /* existing empty state stays */
          <></>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <WidgetShell key={widget.id} widget={widget} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
