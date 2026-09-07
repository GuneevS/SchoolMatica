import { Skeleton } from "@/components/ui/skeleton";

export default function CommunicationsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading communications"
      className="space-y-5"
    >
      <span className="sr-only">Loading conversations…</span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="border-b border-border/60 lg:border-b-0 lg:border-r">
          <div className="border-b border-border/60 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="divide-y divide-border/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread pane */}
        <div className="flex h-[60vh] min-h-[480px] flex-col">
          <div className="border-b border-border/60 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-hidden p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton
                  className="h-12 rounded-2xl"
                  style={{ width: `${40 + Math.sin(i * 1.7) * 25 + 25}%` }}
                />
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 p-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
