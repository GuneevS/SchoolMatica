"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SchoolMatica] Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. This has been logged and our team will look into it.
          {error.digest && (
            <span className="mt-1 block text-xs text-muted-foreground/60">
              Error ID: {error.digest}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
