/**
 * Demo-mode flag controlling whether RBAC checks are bypassed.
 *
 * SchoolMatica is currently demo-able with a "log in as anyone, see
 * everything" UX so reviewers can explore the entire surface. Real RBAC
 * checks are wired through `lib/auth.ts` and `lib/permissions-client.ts` but
 * skip when demo mode is on.
 *
 * Toggle via `NEXT_PUBLIC_DEMO_MODE`:
 *   - unset / "true" / any non-"false" value → demo mode ON (current default)
 *   - "false"                                  → demo mode OFF (real RBAC)
 *
 * The variable is intentionally `NEXT_PUBLIC_*` so both server and client
 * code agree on the same value. For production deployments set:
 *
 *   NEXT_PUBLIC_DEMO_MODE=false
 *
 * in your environment before building.
 */

const DEMO_MODE_ENV = "NEXT_PUBLIC_DEMO_MODE";

/**
 * Read the raw env value. Server reads from process.env directly. Client
 * reads from the value Next.js inlined at build time (same source).
 */
function readDemoModeRaw(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[DEMO_MODE_ENV];
}

/** True when the demo-mode bypass is active. */
export function isDemoMode(): boolean {
  const value = readDemoModeRaw();
  if (value === undefined) return true; // default ON
  return value.toLowerCase() !== "false";
}

/** Symmetric helper for the inverse, kept for readability at call sites. */
export function isRbacEnforced(): boolean {
  return !isDemoMode();
}
