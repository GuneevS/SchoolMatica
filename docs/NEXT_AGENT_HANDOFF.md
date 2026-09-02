# SchoolMatica — Next-Agent Handoff

**Branch:** `TheBEEEGFix` (pushed to `origin`, tip `1480bc2`)
**Last verified:** `npx tsc --noEmit` exits 0; ESLint clean on all changed files (the only remaining lint warnings are pre-existing unused-vars in `components/plans/unified-assessment-workspace.tsx`, inherited from the remote — non-blocking).
**Stack:** Next.js 16 (App Router) · React 19 · Prisma 6 (Postgres) · NextAuth 5 beta · Tailwind 4 · Radix UI · Zustand · Pusher · sonner.

---

## What just happened (context you need)

Two things were integrated into `TheBEEEGFix` and pushed:

1. **A large refinement commit (`266ee6e`)** — frontend a11y/UX hardening, a new shared API layer, demo-gated RBAC, and several bug fixes. Full detail in `docs/COMPREHENSIVE_REVIEW_2026-05-26.md` (read this first — it has the complete 12-agent review + the phase-by-phase change log).
2. **A merge (`1480bc2`)** with 3 remote commits that had landed independently: **dark-mode support**, a **Moderation Hub** (`app/moderation/*`), a **create-event dialog**, and a login-form simplification.

### ⚠️ One merge decision you MUST be aware of
`components/plans/unified-assessment-workspace.tsx` had a genuine **algorithm divergence** in `updateAssessmentByPercentage` (term/assessment weight balancing). Two independent implementations existed:
- The **remote's** version (cleaner, proportional redistribution) — **this is what's now in the tree.**
- A local-only version from commit `35a1504` ("Enhance assessment weight percentage calculation and persistence") that handled more edge cases (single-assessment → 100%, 100%/0% zeroing). It is **preserved in git history** but no longer in the working tree.

**Action for you:** before trusting markbook weight entry, manually verify the remote's algorithm handles these cases correctly: (a) a term with exactly one assessment, (b) setting one assessment to 100%, (c) setting one to 0%, (d) redistributing when all others are currently 0. If any regress, compare against `git show 35a1504:components/plans/unified-assessment-workspace.tsx`.

### Theme system note
The merge adopted the **remote's Zustand-based dark mode** (`lib/stores/theme-store.ts` + `components/theme/theme-provider.tsx` + `theme-toggle.tsx`). `next-themes` is still a dependency but is **no longer the active theme driver**. The earlier audit recommended consolidating to one — that's still open (see below). Do **not** reintroduce `next-themes` props to `<ThemeProvider>`; it now only takes `children`.

---

## New shared infrastructure available to you (use it, don't reinvent)

| File | Purpose |
|------|---------|
| `lib/api/` (`envelope.ts`, `errors.ts`, `client.ts`, `with-api.ts`, `index.ts`) | Standard response envelope `{data,meta}` / `{error:{code,message,details}}`, `ApiError` class, `apiFetch<T>()` client, `withApi()` route wrapper. Import from `@/lib/api`. |
| `lib/hooks/use-api-mutation.ts` | `useApiMutation({ mutationFn, onSuccess, successMessage, form })` — fetch + toast + react-hook-form field-error mapping. |
| `components/ui/form.tsx` | shadcn-style `Form/FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage` (a11y-correct, `role="alert"`). |
| `components/ui/confirm-dialog.tsx` | `<ConfirmDialog>` — destructive-action confirmation w/ loading state + optional typed confirmation. Replaces `window.confirm`. |
| `components/ui/alert-dialog.tsx` | Radix AlertDialog primitive. |
| `lib/demo-mode.ts` | `isDemoMode()` / `isRbacEnforced()` gated on `NEXT_PUBLIC_DEMO_MODE` (default `"true"`). |
| `POST /api/behavior/notify-parents` | Reference implementation of the `withApi` + envelope + Zod + school-scope pattern. Copy its shape when migrating other routes. |

---

## Prioritized next steps

Work top-down. Each item says **why** and **how**. Keep all existing functionality — these are methodology upgrades, never scope removal. Verify with `npx tsc --noEmit` after every few files and run the app where possible.

### P0 — Correctness / safety (do first)
1. **Verify the assessment-weight algorithm** (see ⚠️ above). This gates a core feature.
2. **Money is stored as `Float`** across `Invoice`, `Payment`, `AccountLedger`, `CreditNote`, `FeeStructure`, `FeeDiscount`. This silently loses cents (reconciliation already uses `Math.abs(x) < 0.01` workarounds). Migrate to `Decimal @db.Decimal(12,2)`. Requires: a Prisma migration, a data backfill, and re-checking every `.toFixed`/arithmetic site in `app/api/fees/*` and the finance components. Plan it as its own branch.
3. **AccountLedger running balance is computed non-atomically** (`app/api/fees/invoices/route.ts` ~L165, `payments/route.ts` ~L206). Concurrent writes for the same student corrupt the balance. Wrap in `prisma.$transaction` with `Serializable` isolation or a `SELECT … FOR UPDATE` on a per-student row.

### P1 — Tenant isolation & DB hardening
4. **Re-scope global `@unique` constraints to per-school**: `AppUser.email`, `Teacher.email`, `Invoice.invoiceNumber`, `Payment.paymentRef`, `CreditNote.creditNoteNumber` are globally unique → collide across schools. Move to `@@unique([schoolId, …])`. Needs data-dedup check before migrating.
5. **Denormalize `schoolId`** onto `Student`, `Mark`, `Assessment`, `AssessmentPlan`, `Payment`, `ReportCard`, `Message`, `BehaviorBalance` so tenant filtering doesn't require 3-hop joins. Add the columns, backfill, then add a Prisma extension that requires `schoolId` on those models' queries.
6. **Add missing indexes** (see "Top 10 indexes" in `docs/COMPREHENSIVE_REVIEW_2026-05-26.md` §10) — esp. `Mark.studentId`, `Notification(userId,read,createdAt)`, `Invoice(schoolId,status,dueDate)`, `MessageThread(schoolId,lastMessageAt)`.

### P2 — API consistency (incremental, low-risk in batches)
7. **Migrate legacy routes to `withApi` + envelope.** ~60 routes still return ad-hoc `{error:"..."}` or raw bodies. `apiFetch` already tolerates the legacy shape, so migrate in **small batches** and verify each batch's client consumers. Suggested order: `app/api/fees/*`, then `app/api/messages/*`, then `app/api/parent/*`, then `behavior/homework/notifications`. The compatibility means you can do this safely without a big-bang.
8. **Add Zod validation** to routes still hand-rolling checks: `notifications` (POST/PATCH), `messages` (POST), `behavior/incidents`, `reports/generate`, `parent/payments/initiate`, `pusher/auth`, `fees/ledger/[studentId]`.
9. **Add pagination** to list endpoints that grow with tenant size (`/api/students`, `/api/teachers`, `/api/fees/invoices`, `/api/messages/threads`, `/api/registrations`, `/api/announcements`, `/api/events`). Currently only `super-admin/users` paginates.

### P3 — Security (decide deployment posture)
10. **RBAC is demo-gated, defaulting OPEN.** `NEXT_PUBLIC_DEMO_MODE` defaults to `"true"` → any signed-in user can do anything (keeps the demo browsable). The real checks are wired in `lib/auth.ts` (`authorize`/`authorizeWithSchool`) and `lib/permissions-client.ts`. **Before any non-demo deployment, set `NEXT_PUBLIC_DEMO_MODE=false`** and smoke-test each role. Then audit the IDOR/tenant-leak findings in the review doc §2 (esp. the `schoolId && !isSuperAdmin && { schoolId }` pattern that collapses to no-filter when `schoolId` is null — fix those to explicit 403s).
11. **File uploads** go to local disk `public/uploads/` (ephemeral on serverless; extension derived from user-supplied filename → stored-XSS risk). Move to object storage (Vercel Blob or S3) and derive the extension from validated MIME magic bytes.
12. **PayFast webhook** (`app/api/parent/payments/webhook`) has no idempotency → retries double-credit. Dedupe on `pf_payment_id` before mutating ledger/invoice.

### P4 — Quality of life
13. **Adopt `useApiMutation` + `<FormField>` across forms.** The finance dialogs (`create-invoice`, `record-payment`, `create-fee-structure`, `create-discount`) still hand-roll validation and skip Zod — migrate them to `react-hook-form` + the new `<Form>` primitive + `useApiMutation`. Add `min={0} step="0.01"` to all money inputs.
14. **Consolidate theming** — pick Zustand-store OR `next-themes` and remove the other (currently both exist; Zustand is active). If keeping Zustand, remove `next-themes` from `package.json`.
15. **Wire Sentry** (the project has the Sentry plugin available) into `app/error.tsx`, `app/global-error.tsx`, and `useApiMutation` so the "this has been logged" copy becomes true and error IDs are actionable.
16. **Address the 66 Dependabot vulnerabilities** GitHub flagged (1 critical, 30 high). Run `npm audit`, triage, and bump.

---

## How to verify your work
```bash
npx tsc --noEmit            # must exit 0
npx eslint <changed files>  # no new errors
npm run dev                 # http://0.0.0.0:44777 — smoke-test the touched flow
```
Commit on `TheBEEEGFix` (or a child branch). End commit messages with the Co-Authored-By line. Push only when asked.

## Key reading
- `docs/COMPREHENSIVE_REVIEW_2026-05-26.md` — full 12-agent audit + every change made so far (THE reference).
- This file — the prioritized roadmap.
