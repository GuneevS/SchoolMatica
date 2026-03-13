export default function CommunicationsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
        <div className="border-r border-slate-200/60 bg-white">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-slate-100 p-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-2 h-96 animate-pulse bg-slate-50" />
      </div>
    </div>
  );
}
