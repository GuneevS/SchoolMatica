export default function ClassesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200/60 bg-white p-5">
            <div className="h-5 w-32 rounded bg-slate-100 mb-3" />
            <div className="h-4 w-24 rounded bg-slate-100 mb-2" />
            <div className="h-4 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
