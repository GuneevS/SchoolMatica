import { Skeleton } from "@/components/ui/skeleton";

export default function MarkbookLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading markbook"
      className="space-y-6"
    >
      <span className="sr-only">Loading markbook…</span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        {/* Grid header */}
        <div className="grid grid-cols-[200px_repeat(6,1fr)_80px] gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
          <Skeleton className="h-4 w-12 justify-self-end" />
        </div>
        {/* Grid rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[200px_repeat(6,1fr)_80px] items-center gap-2 border-b border-border/40 px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-9 rounded-lg" />
            ))}
            <Skeleton className="h-6 w-12 justify-self-end rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
