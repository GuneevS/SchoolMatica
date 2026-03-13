export default function MarkbookLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="h-[500px] animate-pulse rounded-2xl border border-slate-200/60 bg-white" />
    </div>
  );
}
