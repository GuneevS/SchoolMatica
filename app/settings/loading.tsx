export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200/60 bg-white p-6">
            <div className="h-5 w-40 rounded bg-slate-100 mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
