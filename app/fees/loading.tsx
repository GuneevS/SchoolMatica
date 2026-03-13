export default function FeesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
    </div>
  );
}
