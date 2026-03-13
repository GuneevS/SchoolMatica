import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-8 w-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200/60 bg-white p-6">
            <div className="h-4 w-20 rounded bg-slate-100 mb-3" />
            <div className="h-8 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
        ))}
      </div>
    </div>
  );
}
