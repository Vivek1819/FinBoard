import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WidgetConfig } from "@/types/widget";

type DashboardState = {
  widgets: WidgetConfig[];

  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
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
    }),
    {
      name: "finboard-dashboard",
    }
  )
);
