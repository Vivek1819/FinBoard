"use client";

import AppHeader from "@/components/AppHeader";
import WidgetShell from "@/components/widgets/WidgetShell";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function Home() {
  const widgets = useDashboardStore((s) => s.widgets);
  const reorderWidgets = useDashboardStore((s) => s.reorderWidgets);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    reorderWidgets(oldIndex, newIndex);
  }


  return (
    <main className="min-h-screen bg-background/50">
      <AppHeader />

      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        {widgets.length === 0 ? (
          /* existing empty state stays */
          <></>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
                {widgets.map((widget) => (
                  <WidgetShell key={widget.id} widget={widget} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </main>
  );
}
