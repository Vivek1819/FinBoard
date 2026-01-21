import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WidgetConfig } from "@/types/widget";

type DashboardState = {
  widgets: WidgetConfig[];

  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;

  updateWidget: (id: string, updater: (w: WidgetConfig) => WidgetConfig) => void;
};


export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: [],

      addWidget: (widget) =>
        set((state) => ({
          widgets: [...state.widgets, widget],
        })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      clearWidgets: () => set({ widgets: [] }),

      updateWidget: (id, updater) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? updater(w) : w
          ),
        }))
    }),
    {
      name: "finboard-dashboard",
    }
  )
);
