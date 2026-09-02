"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary — catches errors in the root layout itself.
 * Must render its own <html> and <body> since the layout may have crashed,
 * and inline-styles only (no CSS from layout is loaded here).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SchoolMatica] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main
          role="alert"
          aria-live="assertive"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "4rem",
              height: "4rem",
              borderRadius: "1rem",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              marginBottom: "1.5rem",
            }}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: 0,
              color: "#0f172a",
            }}
          >
            Application error
          </h1>
          <p
            style={{
              color: "#475569",
              maxWidth: "26rem",
              marginTop: "0.75rem",
              fontSize: "0.95rem",
              lineHeight: 1.55,
            }}
          >
            Something went wrong and the page could not be displayed. Try
            reloading — if the problem keeps happening, our team has been notified.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.75rem",
                marginTop: "0.75rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1.75rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "#0f172a",
              }}
            >
              Try again
            </button>
            {/* Plain <a> intentional — root layout has crashed, so soft
                navigation via next/link would render into the broken tree.
                A full reload via <a> is the safer recovery path. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
