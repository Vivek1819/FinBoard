import AppHeader from "@/components/AppHeader";

export default function Home() {
  const hasWidgets = false;

  return (
    <main>
      <AppHeader />

      <div className="p-8">
        {!hasWidgets ? (
          <div className="flex items-center justify-center h-[65vh]">
            <div className="max-w-sm w-full rounded-2xl border border-dashed border-emerald-500/30 bg-card/80 backdrop-blur p-10 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-lg">
                +
              </div>

              <h3 className="text-base font-medium mb-1">
                Create your first widget
              </h3>

              <p className="text-sm text-muted mb-6 leading-relaxed">
                Connect a finance API and visualize real-time market data in one place.
              </p>

              <button className="w-full px-4 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">
                Add Widget
              </button>
            </div>
          </div>
        ) : (
          <div>{/* Widgets grid will come later */}</div>
        )}
      </div>
    </main>
  );
}
