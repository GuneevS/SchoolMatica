import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading settings"
      className="space-y-6"
    >
      <span className="sr-only">Loading settings…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Section nav */}
        <nav className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </nav>

        {/* Form panel */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, c) => (
            <div
              key={c}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-72" />
              </div>
              <div className="mt-6 space-y-5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t border-border/60 pt-5">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
