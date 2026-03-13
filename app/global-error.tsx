"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary — catches errors in the root layout itself.
 * Must render its own <html> and <body> since the layout may have crashed.
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
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#fafafa" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
            Application Error
          </h1>
          <p style={{ color: "#64748b", maxWidth: "400px", marginTop: "0.75rem", fontSize: "0.875rem" }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
