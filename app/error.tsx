"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[SchoolMatica] Page error:", error);
  }, [error]);

  const copyErrorId = async () => {
    if (!error.digest) return;
    try {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle aria-hidden="true" className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="font-mono">{error.digest}</span>
            <button
              type="button"
              onClick={copyErrorId}
              aria-label={copied ? "Error ID copied" : "Copy error ID"}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? (
                <Check aria-hidden="true" className="h-3 w-3" />
              ) : (
                <Copy aria-hidden="true" className="h-3 w-3" />
              )}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home aria-hidden="true" className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
