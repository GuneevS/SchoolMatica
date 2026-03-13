export default function StudentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-50 p-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
