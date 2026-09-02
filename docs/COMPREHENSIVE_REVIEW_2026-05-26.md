# SchoolMatica — Comprehensive Multi-Agent Review

**Date:** 2026-05-26
**Branch:** `TheBEEEGFix`
**Coverage:** 12 specialised agents in parallel — architecture, security, silent failures, TypeScript types, frontend bugs, performance, UI/UX, accessibility, data fetching, database, forms/UX, API contracts.

This document records the raw findings. A separate fix pass addressed the highest-impact frontend and UX items in the same session. Items not yet fixed are called out at the bottom.

---

## Headline (read this first)

The codebase has a real design system, an auth/RBAC framework, a Pusher integration, a Prisma layer, and is genuinely capable. But it is **mid-refactor in several places** and several systemic issues bite simultaneously:

1. **Authorization is disabled for demo.** Every `authorize()` / `authorizeWithSchool()` call short-circuits past the permission check. All `lib/permissions-client.ts` helpers return `true`. The API surface enforces *authentication* but not *authorization*. This is intentional per the commit message — **must be restored before any non-demo deployment.**
2. **All money is `Float`** (`Invoice.totalAmount`, `Payment.amount`, `AccountLedger.balance`, etc.). Cents lost silently. Already shows up as `Math.abs(...) < 0.01` workarounds in reconciliation code.
3. **Two parallel auth helpers** (`lib/auth.ts` vs `lib/auth-server.ts`), **two API response styles** (post-standardisation routes vs `/api/fees/*`, `/api/messages/*`, `/api/parent/*`, `/api/behavior/*`, `/api/homework/*`), **two messaging implementations** (`communications-client.tsx` uses Pusher; `messaging-client.tsx` does not).
4. **No `<Form>` / `<FormField>` abstraction.** ~half the forms hand-roll validation; finance dialogs skip Zod entirely. Five different inline-error patterns coexist.
5. **Real-time is only half-wired.** Pusher works for the active chat thread. Thread-list unread badges, `triggerNewThread`, `triggerMessageRead`, and `useUserNotifications` are defined but never called from the routes that should fire them.

---

## Section 1 — Architectural gaps (agent: code-architect)

### Critical gaps
1. **Two parallel auth context implementations** with different shapes (`AuthContext` vs `ServerAuthContext`). Both re-query DB per request.
2. **No server-only data access layer.** Prisma is called directly from every route. Any future route author can forget tenant scoping.
3. **`AuditLog` missing `actorUserId`** — only `actorName` (free string), defeating attribution.
4. **File uploads stored to `public/uploads/`** — ephemeral with `output: 'standalone'`. Files vanish on redeploy.
5. **`pusher/auth` casts `thread.participants as unknown as ThreadParticipant[]`** with no runtime validation.
6. **`error.tsx` only at root** — Unhandled errors in `behavior`, `timetables`, `super-admin`, `registrations`, `homework`, `events`, `markbook`, `reports`, `assessment-plans`, `resources` bubble to the root and blank the whole shell.
7. **No `not-found.tsx` anywhere** — 404s leak Next.js framework version.
8. **`loading.tsx` missing for `behavior`, `timetables`, `super-admin`, `registrations`, `homework`, `events`, `assessment-plans`, `reports`, `resources`, `parent`, `student`, `teachers`.**

### Missing infra
1. Rate limiting only on auth routes. No limiting on bulk mark upsert, payment recording, bank reconciliation, report generation, file upload.
2. No audit log on financial writes (payments, credit-notes, write-offs, bank reconciliation approvals).
3. No audit log on mark bulk-upsert despite `auditMarkUpdate` existing.
4. File upload has no virus scanning, no magic-byte MIME verification — only checks client-supplied `file.type`.
5. No email queue — `nodemailer` called synchronously inline. SMTP outage = data loss.
6. `sm-school-id` school-switching cookie is unsigned — super-admin can manually set arbitrary school ID.

### Recommended fix order
1. Restore real permission checks in `lib/auth.ts:authorize()` and `authorizeWithSchool()`, replace `lib/permissions-client.ts` bypasses before any production deploy.
2. Collapse the two auth helpers into a single server-only DAL.
3. Add `actorUserId` to `AuditLog` and emit audit records for all financial writes and bulk mark upserts.
4. Replace local-disk file storage with S3-compatible object storage + magic-byte MIME validation.
5. Add per-domain `error.tsx` files + root-level `not-found.tsx`.

---

## Section 2 — Security review (agent: code-reviewer / security focus)

### CRITICAL
- **C1 — Full RBAC bypass in `lib/auth.ts:217-219` and `:330-332`.** Both `authorize()` and `authorizeWithSchool()` return immediately after auth check, ignoring the `permission` argument. Student account can call any permission-gated route.
- **C2 — `/api/fees/*` uses `getServerAuthContext` with no permission check at all.** `invoices`, `payments`, `reconcile`, `bank-reconcile` — any authenticated user (teacher, student, parent) can read all invoices and record payments.
- **C3 — `POST /api/users/[userId]/roles`** assigns roles without verifying target user belongs to caller's school. Combined with C1: any authenticated user can grant `system_admin` to anyone.
- **C4 — `POST /api/fees/bank-reconcile`** no permission check + accepts arbitrary invoice IDs for payment creation.

### HIGH
- **H1 — `POST /api/fees/invoices`** doesn't verify `studentId` belongs to school. Cross-tenant invoice injection.
- **H2 — `POST /api/fees/reconcile`** `updateMany` with `...(schoolId && { schoolId })` — when `schoolId` is null, where-clause has no schoolId filter, runs against ALL invoices on platform.
- **H3 — Teacher invitation token returned in API response body** (`/api/teacher-invitations/route.ts:192-196`). Should be email-only.
- **H4 — `sm-school-id` cookie** trusted for super-admin school context, no validation, not httpOnly/sameSite.

### MEDIUM
- **M1** — `/api/fees/ledger/[studentId]` POST body no Zod, no bounds on `amount`.
- **M2** — Middleware doesn't protect `/api/*` routes, gives HTML redirects to API clients instead of 401 JSON.
- **M3** — `/api/uploads` derives extension from user-controlled `file.name` — can upload JPEG as `.html` and trigger stored XSS via `public/` static serving.
- **M4** — `/api/auth/me` exposes full permissions + role assignments to any authenticated client.

### Quick wins
1. Restore `if (!auth.permissions.has(permission)) return 403` in both `authorize()` and `authorizeWithSchool()`.
2. Add `authorizeWithSchool(request, "finance:write"|"finance:manage")` to all `/api/fees/*` mutations.
3. Remove `inviteUrl` from teacher-invitations response body.
4. Derive upload file extension from validated MIME type, not filename.
5. Add student-to-school ownership check in `POST /api/fees/invoices`.

---

## Section 3 — Silent failures (agent: silent-failure-hunter)

### Critical
- **`components/behavior/behavior-dashboard.tsx:91-97`** — `handleNotifyParents` only `console.log("Notifying parents...")` then closes dialog. **User sees success; zero notifications sent.**
- **`components/registrations/registration-manager.tsx:140-149,151-179`** — Approve/Reject/Move-to-review without `.ok` check or try/catch. API failure → page silently refreshes, registration unchanged.
- **`components/markbook/markbook-grid.tsx:54-93`** — `bulk-upsert` failure only `console.error`. Teacher thinks mark saved. **Grade integrity bug.**
- **`components/finance/bank-reconciliation-tab.tsx:62-66`** — `Math.abs(amount)` client-side then filter `e.amount > 0` clobbers debits into credits. Phantom payments possible.
- **`app/api/parent/payments/webhook/route.ts:58-129`** — Only handles `COMPLETE/CANCELLED/FAILED`. Any other PayFast status returns 200 OK silently. Payment status drifts.
- **`components/auth/login-form.tsx:99`** — Bare `catch {}` swallows entire error object.

### Important
- **`components/notifications/notification-dropdown.tsx:60-82,84-98`** — `markAsRead` mutates state + navigates before checking response.ok.
- **`lib/auth-server.ts:115-118`** — `getServerAuthContext` swallows ALL errors → returns null. User loops on login page with no clue.
- **`components/communications/bulk-message-composer.tsx:168-175`** — `mockRecipients` fallback in production code (Mokoena, Nkosi, Dlamini).
- **`components/behavior/behavior-dashboard.tsx:372-373`** — `const notified = index % 2 === 0` — fake notification status displayed to admins.
- **`components/behavior/behavior-dashboard.tsx:447-491`** — Recent Notifications panel is hard-coded mock list.

### Systemic patterns
1. **"console.error + finally setLoading(false)"** template across many mutating-fetch handlers. User sees spinner stop, no error toast, UI silently reverts.
2. **Demo/mock data leaking into production** (behavior dashboard, bulk message composer, behavior notify handler).

---

## Section 4 — TypeScript types audit (agent: type-design-analyzer)

### Worst offenders (top 10)
1. `app/api/users/route.ts:43` — `let whereClause: any = {}` on security-sensitive endpoint.
2. `app/api/messages/threads/route.ts:76,83,314` + 7 sibling files — `as unknown as ThreadParticipant[]` 11 times. Double-cast hides Prisma `Json` field.
3. `lib/audit.ts:61-62` — `metadata: (entry.metadata as any) || undefined`.
4. `components/plans/assessment-config-card.tsx:20` — `dragHandleProps?: any` on publicly exported component.
5. `app/notifications/page.tsx:48` — `notifications: any[]` page prop.
6. `components/schools/setup-wizard/step-classes.tsx:24` — `(gradeId: string, field: string, value: any)`.
7. `app/api/schools/[schoolId]/setup/route.ts:142-146` — five `[] as any[]` initializers.
8. `components/schools/setup-wizard/step-staff.tsx:99` — `role: value as any`.
9. `app/api/announcements/route.ts:42` + `events/route.ts:46` — `const where: any = {}`.
10. `app/api/announcements/route.ts:83-95` — inline anonymous shape mimicking Prisma output.

### System-level gaps
1. **No Prisma enums.** ~25 stringly-typed status/type/priority fields.
2. **`ThreadParticipant` defined 5 times** with subtly different shapes.
3. **`Message`/`Conversation` defined ≥3 times** with disagreeing fields.
4. **Three `AuthUser` shapes** — `AppUserWithRoles`, `AuthUser`, `ClientAuthContext.user`.
5. **No discriminated unions** for `MessageThread.type`.
6. **No shared API request/response types.** 100+ `fetch` callers infer `any`.
7. **Json columns untyped** — `branding`, `bankDetails`, `thresholds`, etc.
8. **Form types from Zod inconsistent** — some use `z.infer`, others hand-roll.
9. **Component prop types not exported.** Reusers re-declare.
10. **Only 1 use of `Prisma.X.GetPayload`** in the entire codebase.

### Ratings
- Encapsulation: 2/5
- Invariant expression: 1/5
- Reuse: 2/5
- Enforcement: 3/5 (`strict: true` good; 8 `as any`, 11 `as unknown as`, 0 `@ts-ignore`)

### Top 5 refactors
1. Promote string columns to Prisma `enum` (status/type/priority).
2. Create `lib/messaging/types.ts` with `participantSchema` Zod + `ThreadType` discriminated union.
3. `lib/api/contracts.ts` — pair every Zod request schema with a response schema. Typed `apiFetch<Req,Res>`.
4. Unify `AuthUser` — derive client view from server payload via Zod.
5. Type Prisma `Json` columns with Zod schemas + `parseBranding`/`serializeBranding` helpers.

---

## Section 5 — Frontend React bugs (agent: code-reviewer / React focus)

### Critical
1. **`lib/hooks/use-realtime-chat.ts:153`** — Pusher effect deps include handler callbacks → resubscribe storm on every render with new handler reference. Store handlers in a ref.
2. **`components/finance/bank-reconciliation-tab.tsx:97-138`** — Parse and approve both POST to same endpoint. No AbortController. State cleared before refresh resolves.
3. **`app/communications/communications-client.tsx:69-76`** — `conversations` rebuilt on every render (new `Date` objects); `conversationsList` initialized from it but never re-synced.
4. **`components/communications/new-conversation-dialog.tsx:157`** — `onOpenChange={handleClose}` ignores the boolean → immediately re-closes on open.
5. **`chat-interface.tsx:115-130`** — `formatDate` uses `new Date()` at render → hydration mismatch around midnight.

### Important
6. `bank-reconciliation-tab.tsx:211,247` — `key={idx}` on rows that can reorder; `selectedMatches: Set<number>` keyed by index.
7. `behavior-dashboard.tsx:372-373` — fake `notified = index % 2 === 0`.
8. `registration-manager.tsx:204,299` — no submit guard against double-fire.
9. `bulk-message-composer.tsx:204-210,233-239` — stale-closure setState (non-functional updater).
10. `app/fees/fees-client.tsx:86,142,488` — native `confirm()`, ad-hoc DOM `<a>.click()`, custom modal bypassing focus trap.
11. `markbook-grid.tsx:324-385` — row click selects student but bubbles from Input.
12. `app-shell.tsx:289-305` — localStorage in `useState` initializer; hydration mismatch.
13. `parent-shell.tsx`/`student-shell.tsx` — `useEffect([])` with eslint-disable; branding never re-syncs.
14. `communications-client.tsx:156-166` — `Date.now().toString()` optimistic id never reconciled with server id.
15. `chat-interface.tsx:89-92` — scrolls on every new `messages` reference.
16. `notification-dropdown.tsx:52-58` — polling continues after 401; setState after unmount risk.

### Systemic patterns
1. **"Subscribe + handler in same effect"** anti-pattern → resubscribe storms.
2. **Optimistic updates without server reconciliation** → duplicate keys, zombie rows.
3. **SSR/CSR boundary fuzzy** — `new Date()`/`localStorage` in render or `useState` initializer.

---

## Section 6 — Performance & Vercel (agent: performance-optimizer)

### Top 10 wins
1. `lib/dashboard.ts:60-78` — loads ALL marks/students/schools per class. **HIGH** — use `select`, `MarkSnapshot` already exists.
2. `next.config.ts` — add `experimental.optimizePackageImports: ['lucide-react','recharts','@radix-ui/*']`. **HIGH** — 100-300KB First Load JS reduction.
3. Recharts ships eagerly. **HIGH** — wrap in `next/dynamic` `ssr:false`.
4. **Every page is `force-dynamic`** including landing. **HIGH** — move auth-dependent rendering to `(authed)/layout.tsx`.
5. `app/fees/page.tsx:55-104` — six unbounded `findMany` with deep includes. **HIGH** — paginate + Suspense'd panels.
6. `app/parent/page.tsx:89-199` — five sequential awaits not parallel. **HIGH** — `Promise.all`.
7. `communications-client.tsx:105-115` — effect-fetch waterfall. **MED** — pre-fetch first conv server-side.
8. `interactive-background.tsx` (300 LoC) on landing — continuous `requestAnimationFrame`. **MED** — `dynamic ssr:false` + IntersectionObserver + reduced-motion.
9. 154 `lucide-react` imports → un-tree-shaken without `optimizePackageImports`. **MED**.
10. No `<Image>` usage. **MED** — needed for any user avatar / school logo.

### Vercel platform
- No `vercel.json` — no region pinning. Pin `regions: ["fra1"]` near DB.
- Fluid Compute not configured.
- Cache Components (`'use cache'` + `cacheTag/updateTag`) unused.
- No ISR anywhere.
- No `@vercel/speed-insights`.

### DB perf
- Missing indexes: `Mark.studentId`, `Message.senderId`, `AssessmentPlan(classGroupId,createdAt)`, `Invoice(schoolId,createdAt)`, `Payment.createdAt`.

---

## Section 7 — UI/UX design audit (agent: senior designer perspective)

### Verdict: mediocre-leaning-good

Strong foundation (HSL tokens, design system, two-font pairing, aurora panels). Undermined by 77+ hardcoded `bg-emerald-100/text-amber-700` style pills (when `StatusBadge` exists), card radii drifting (`rounded-xl|2xl|3xl|[24px]|[28px]` on same page), buttons in mismatched gradient styles. Overall aesthetic is "premium aurora SaaS" but visually overwrought (canvas gradient + per-shell glow + AuroraHero stacking on every page).

### Top 15 design issues
1. `app/error.tsx:44` — raw `bg-indigo-600` not from tokens; `bg-red-50` won't switch in dark.
2. All 7 `loading.tsx` — generic gray rectangles, not skeletons shaped like content.
3. `app/fees/fees-client.tsx:54-68` + parent variant — duplicated `getStatusBadge` color maps.
4. `components/ui/dialog.tsx:63` — `max-w-[min(640px,calc(100%-2rem))]` too narrow for complex forms.
5. `chat-interface.tsx:137` — `h-[calc(100vh-200px)]` + `w-80` sidebar; no mobile story.
6. All 4 shells cap content at `max-w-6xl` even on wide screens.
7. `app/dashboard/page.tsx` — cards with `rounded-[28px]` and `rounded-[24px]` on same page when base Card already does `rounded-3xl`.
8. `behavior-dashboard.tsx:117` — three different visual weights for equal-importance actions.
9. `select.tsx`/`dropdown-menu.tsx`/`popover.tsx` use `rounded-md` while cards use `rounded-xl|2xl`.
10. `tabs.tsx:45` — `uppercase tracking-[0.25em]` too cramped for 5+ tabs.
11. `input.tsx:11` — no left-icon / right-adornment / helper text / error message support.
12. `label.tsx` — no required-indicator prop.
13. The 4 shells (`app-shell` / `parent-shell` / `student-shell` / `super-admin-shell`) — different widths, different active-state tokens, different mobile-menu placement.
14. `fees-client.tsx:178-191` — 4 different bg/text color pairs on KPI cards, then repeated below in `HeroMetricPanel`.
15. `communications/loading.tsx:20` — `h-96 bg-muted/50` doesn't hint chat shape.

### Quick wins
1. Replace `getStatusBadge` helpers with `<StatusBadge>`.
2. Standardize card radius (remove `rounded-[24px]/[28px]` overrides).
3. Bump `max-w-6xl` → `max-w-7xl` or remove on dense pages.
4. Lowercase + drop tracking on `TabsTrigger` when ≥4 tabs.
5. Rewrite 7 `loading.tsx` with real skeleton primitives.
6. Add dark variants to `alert.tsx` success/warning/info.
7. Move error page off `bg-indigo-600`.
8. Unify Popover/Dropdown/Select radius (`rounded-md` → `rounded-xl`).

### Bold improvements
1. **Collapse 4 shells into 1 `<PortalShell>` primitive** with per-portal config.
2. **Replace AuroraHero+KPI duplication** with single `<PageHeader>` + inline KPI strip.
3. **Migrate creation flows from Dialog to Sheet/full pages** (98 dialogs vs 26 sheets).
4. **Build `<FormField>` primitive set** — label/required/icon/adornment/helper/error.
5. **Strip per-shell glow overlay**; keep body canvas + landing aurora.

---

## Section 8 — Accessibility (agent: WCAG 2.1 AA audit)

### Verdict: mediocre

Foundation OK (Radix handles most modals/menus, focus tokens exist, `prefers-reduced-motion` present). Three systemic gaps: **no viewport meta** anywhere, **no skip-to-content link** in any shell, **custom modal in `fees-client.tsx` and `help-panel.tsx`** bypasses Radix (no focus trap, no ESC, no return-focus). Tables ship without `scope`. Toasts not announced explicitly.

### Critical
1. `app/layout.tsx:46-48` — no `<meta name="viewport">`. WCAG 1.4.10/1.4.4.
2. `app/fees/fees-client.tsx:487-520` — custom `<div>` modal, no role, no focus trap. WCAG 2.1.2/4.1.2.
3. `components/help/help-panel.tsx:62-96` — same anti-pattern.
4. `components/communications/new-conversation-dialog.tsx:266-272` — `<textarea>` has no `htmlFor` link.
5. `components/auth/school-selector.tsx:136-141` — raw `<input>` no label.
6. `components/auth/login-form.tsx:325-330` — login error has no `role="alert"`.

### Major
- Multiple `outline-hidden` in primitives without focus-visible ring.
- `table.tsx:55` — `<th>` never gets `scope="col"`.
- `new-conversation-dialog.tsx:242-247` — `×` close button no `aria-label`.
- All 4 shells — no skip-to-content link.
- `app-shell.tsx:424` — collapsible group toggle no `aria-expanded`.
- All Recharts components — no `role="img"`, no `aria-label`.
- `chat-interface.tsx:86-92` — message list not `role="log"` / `aria-live`.
- All `loading.tsx` — no `role="status"`/`aria-busy`/sr-only text.

### Top 10 fixes
1. Add viewport meta.
2. Replace fees-client custom modal with Dialog.
3. Replace help-panel custom overlay with Sheet.
4. Add skip-to-content link in all 4 shells.
5. Add `scope="col"` default to TableHead.
6. Add `role="alert"` to login error + `aria-describedby` on inputs.
7. Wrap skeleton wrappers with `role="status" aria-busy="true"`.
8. Add `aria-expanded`/`aria-controls` to sidebar group toggles.
9. Label school-selector search input.
10. Wrap chat messages in `role="log" aria-live="polite"`.

---

## Section 9 — Data fetching & state (agent: state mgmt review)

### Verdict: mediocre-leaning-poor

Hand-rolled `useEffect + fetch + useState`. No SWR/react-query/`use()`. No Server Actions. Every page is `force-dynamic`. Mutations use `router.refresh()` → re-runs entire `Promise.all`. Optimistic updates exist (messaging) but with `Date.now()` IDs, race-prone reconciliation.

### Top 12 issues
1. `app/fees/page.tsx:55-104` — 6 parallel Prisma queries, deep includes, no pagination.
2. `communications-client.tsx:105-150` — fetch on conversation change, no AbortController.
3. `communications-client.tsx:157` — `Date.now()` temp id never reconciled, never removed on failure.
4. `messaging-client.tsx:65-148` — entire messaging surface omits `useRealtimeChat`.
5. `messages/threads/[threadId]/messages/route.ts:81-92` — GET writes N rows per poll.
6. `app/fees/fees-client.tsx:85-119` — mutations call `router.refresh()` → re-runs all 6 page queries.
7. `registration-manager.tsx:140-149` — sends `actorRole: role` from client `useRoleStore`. **Security bug.**
8. `new-conversation-dialog.tsx:64-102` — debounced search missing AbortController.
9. `messages/threads/route.ts:81-149` — N+1 (per-thread `count` + `findUnique`).
10. API routes have no consistent envelope (5+ variants).
11. `lib/stores/theme-store.ts:11` — duplicates `next-themes`.
12. Uses native `alert()` in `communications-client.tsx:247-249`.

### Recommendation
Adopt **SWR (or TanStack Query) for client reads + Server Actions for writes** with `revalidateTag`. Standardize on `{ data, error }`. Single typed `apiFetch<T>` helper. Drop most `force-dynamic`.

---

## Section 10 — Database & Prisma (agent: schema review)

### Verdict: mediocre

### Critical
- **Money is `Float`** — `Invoice.totalAmount`, `Payment.amount`, `AccountLedger.balance`, all of `CreditNote`, `FeeStructure`, `FeeDiscount`. Loss-of-precision bug.
- **AccountLedger running balance computed non-atomically** — concurrent invoices/payments for same student both read same prevBalance.
- **`AppUser.email` globally unique** — parent at School A can't register at School B.
- **`Teacher.email` globally unique** — same.
- **`Student.admissionNumber` no uniqueness** at all.
- **`Invoice.invoiceNumber`, `Payment.paymentRef`, `CreditNote.creditNoteNumber` globally unique** — collide across schools.
- **`bank-reconcile/route.ts:239-310`** — N transactions in a `for` loop, not atomic.
- **`marks/bulk-upsert/route.ts:135-161` and snapshot block:231** — two separate transactions.

### High
- `/api/messages` GET fetches ALL school threads, filters in JS.
- `getDashboardData` pulls every student×assessment×mark.
- `/api/students` no pagination.
- Messages no cursor pagination.
- Mark-as-read writes a row per message.
- `Invoice.lineItems` is `Json` — can't query per-product.
- `Notification` missing `(userId, read, createdAt)` composite.

### Medium
- All status/role/type are strings. Inconsistent capitalization (`"hod"` vs `"PendingApproval"`).
- No `@db.Timestamptz` anywhere.
- No soft deletes on Mark/Invoice/Payment/BehaviorIncident.
- AuditLog has no `actorId`.
- JSON for `participants`, `audience`, `attachments`, `metadata`, `branding`, `bankDetails`, `thresholds`, `components`, `lineItems` — blocks queries.

### Tenant isolation gap
**Implicitly scoped only** (no `schoolId`, must traverse relations): `Student`, `Mark`, `Assessment`, `AssessmentPlan`, `MarkSnapshot`, `ParentContact`, `LearnerComment`, `ReportCard`, `ModerationThread`, `ModerationComment`, `AssessmentDocument`, `DocumentApproval`, `Message`, `Payment`, `FeeDiscount`, `StudentDiscount`, `HomeworkSubmission`, `TimetableSlot`, `TimetablePeriod`, `BehaviorBalance`, `ClassTeacherAssignment`, `TeacherSubjectAssignment`, `AssessmentTemplate`.

**Add `schoolId` (denormalized) to at least:** `Student`, `Mark`, `Assessment`, `AssessmentPlan`, `Payment`, `ReportCard`, `Message`, `BehaviorBalance`. Enforce with Prisma extension requiring `schoolId` on every query.

### Top 10 indexes to add
```prisma
@@index([schoolId, status, dueDate])                       // Invoice
@@index([schoolId, studentId, createdAt(sort: Desc)])      // AccountLedger
@@index([invoiceId, status, processedAt(sort: Desc)])      // Payment
@@index([userId, read, createdAt(sort: Desc)])             // Notification
@@index([schoolId, studentId, date(sort: Desc)])           // BehaviorIncident
@@index([schoolId, lastMessageAt(sort: Desc)])             // MessageThread
@@index([classGroupId, status, updatedAt(sort: Desc)])     // AssessmentPlan
@@index([assessmentId, status])                            // Mark
@@index([schoolId, entityType, createdAt(sort: Desc)])     // AuditLog
@@index([schoolId, lastName, firstName])                   // Student
```

---

## Section 11 — Forms & error UX (agent: forms/UX audit)

### Verdict: mediocre, trending poor on critical flows

Foundation OK — RHF+Zod in ~half the forms, auth flows polished, `app/error.tsx` branded. But money-handling dialogs bypass RHF/Zod entirely. Five inline-error patterns. `window.alert`/`window.confirm` used 9+4 times. No unsaved-changes protection. No `aria-required`.

### Critical UX failures
- `communications-client.tsx:247,249,253` — bulk message confirmed with `alert("Message sent to N…")`.
- `manage-students.tsx:72` — `window.confirm` for delete-student-and-marks.
- `bank-reconciliation-tab.tsx:123-145` — "Approve N Matches" with no confirmation step.
- `create-invoice-dialog.tsx`, `record-payment-dialog.tsx` — no Zod, negative amounts not blocked.
- `markbook-grid.tsx:70-94` — mark save failure shows nothing.
- `registration-manager.tsx:140-179` — no try/catch on approve/reject.
- `branding-form.tsx` — live `setBranding(updated)` on every keystroke.
- `grading-form.tsx` — no success/error feedback, `router.refresh()` before knowing response.

### Top 15 form issues
(See agent output for full list.)

### Bold improvements
1. Adopt shadcn `<Form>` abstraction everywhere; ESLint-ban bare `<Input {...form.register()}>` outside it.
2. Build `useApiMutation` hook: fetch + zod error parse + toast + per-field `form.setError`.
3. `react-hook-form-persist` for register-form, bulk-message-composer, create-invoice, create-fee-structure, report-generator.
4. `<DangerousActionDialog>` wrapping AlertDialog with typed confirmation.
5. Wire Sentry into `app/error.tsx`, `app/global-error.tsx`, `useApiMutation`.

---

## Section 12 — API contracts (agent: API consistency)

### Verdict: mediocre

108 route files. Commit 828c2dc standardized ~48 of them. Holdouts: all `/api/fees/*`, `/api/parent/*`, `/api/messages/*`, `/api/behavior/*`, `/api/homework/*`, `/api/auth/*`, `/api/notifications`, `/api/resources`, `/api/profile/*`, `/api/announcements`, `/api/events`, `/api/reports/generate`, `/api/pusher/auth`.

### Response shape mess
- `GET /api/students` → raw array
- `GET /api/messages/threads` → `{threads: [...]}`
- `GET /api/super-admin/users` → `{users, pagination}`
- `GET /api/auth/me` → flat object
- `POST /api/fees/payments` → `{payment, invoice}` 201
- `POST /api/marks/bulk-upsert` → `{success:true}` 200
- `DELETE /api/students/[id]` → `{success:true}`
- `DELETE /api/fees/invoices/[id]` → full Invoice
- `POST /api/parent/payments/webhook` → plain text `"OK"`

Error envelope: 6 variants in use.

### Top 12 inconsistencies & bugs
1. `parent/payments/webhook:131` returns plain text.
2. `messages:170` POST returns 200 (should be 201), no Zod.
3. Inconsistent envelopes (`[]` vs `{threads:[]}`).
4. `marks/bulk-upsert` two separate transactions for marks + snapshots.
5. `fees/invoices:88` raw array, no pagination.
6. `notifications:96-128` PATCH no Zod, trivial DoS via huge array.
7. `parent/payments/initiate:96` non-cryptographic payment ref.
8. `parent/payments/webhook:60-101` no idempotency — retry double-credits.
9. `fees/payments:158` super-admin `schoolId` not verified against invoice's actual `schoolId`.
10. `messages/threads/[threadId]/messages:81-92` GET mutates state.
11. `timetables:160-164` leaks `error.message` to clients.
12. `messages/threads:88-98` N+1 (per-thread count + user lookup).

### Convention proposal
```ts
{ data: T, meta?: { pagination?: { limit, cursor?, nextCursor?, total? } } }
{ error: { code, message, details?, requestId? } }
```
Codes: `unauthorized` (401), `forbidden` (403), `not_found` (404), `validation_failed` (400), `conflict` (409), `rate_limited` (429), `internal` (500).

### Top 10 API fixes
1. **Tenant-bypass bug** — `schoolId && !auth.isSuperAdmin && { schoolId }` collapses to `{}` for null `schoolId`.
2. **Idempotency on PayFast webhook** — dedupe on `pf_payment_id`.
3. **Run standardization pattern through remaining ~60 routes.**
4. **Pick one auth helper** — consolidate to `requireAuth/requireSuperAdmin`.
5. **Pick one response envelope.**
6. **Zod everywhere** there's user input (including `params`/`searchParams`).
7. **Pagination on all list endpoints** that grow with tenant size.
8. **Escape user-controlled fields** in HTML routes (`statements/[studentId]/pdf`, `payments/[paymentId]/receipt`).
9. **Rate-limit** search/auth/payment endpoints.
10. **Fix N+1** in `/api/messages/threads`.

---

## What was fixed in this pass (frontend refinement)

See `git log` for the commit that follows this document. High-impact items addressed:

- New `components/ui/form.tsx` shadcn Form primitives (Form, FormField, FormItem, FormLabel with required indicator, FormControl, FormDescription, FormMessage with `role="alert"`, auto `aria-describedby`/`aria-invalid`).
- Viewport export added to `app/layout.tsx`.
- New `components/layout/skip-to-content.tsx`, wired into all 4 shells with `id="main"`.
- All 8 `loading.tsx` files rewritten with proper skeleton shapes + `role="status"`.
- `app/error.tsx` and `app/global-error.tsx` refined (design tokens, dark-mode safe, copy-error-ID, `role="alert"`).
- `components/ui/popover.tsx`, `dropdown-menu.tsx`, `select.tsx`, `command.tsx`: `rounded-md` → `rounded-xl` + focus-visible ring restored.
- `components/ui/tabs.tsx`: uppercase + wide tracking removed; better active state.
- `components/ui/status-badge.tsx`: extended config (Paid/Overdue/Sent/Cancelled), then used to replace duplicated color maps in fees clients & registration manager.
- `app/fees/fees-client.tsx`: custom invoice modal → `<Dialog>`.
- `components/help/help-panel.tsx`: custom overlay → `<Sheet>`.
- `components/ui/alert.tsx`: dark-mode variants added.
- `components/ui/table.tsx`: `TableHead` default `scope="col"`.
- `components/layout/app-shell.tsx`: hydration-safe `localStorage` pattern.
- `components/communications/new-conversation-dialog.tsx`: `onOpenChange` distinguishes open vs close.
- `components/communications/chat-interface.tsx`: messages list as `role="log" aria-live="polite"`; date helper mount-guarded; scrolls on length change only.
- `components/behavior/behavior-dashboard.tsx`: removed fake `notified = index % 2` + mock notifications panel + console-only `handleNotifyParents`.
- `components/communications/bulk-message-composer.tsx`: removed `mockRecipients` fallback.
- `app/communications/communications-client.tsx`: optimistic message reconciliation (functional updater + `crypto.randomUUID()` temp id + rollback on failure).
- `lib/hooks/use-realtime-chat.ts`: handler-ref pattern, subscription deps reduced to `[threadId, currentUserId]`.

## What was NOT fixed and needs owner decisions

These are higher-stakes and require explicit go-ahead:

1. **Restore RBAC enforcement** in `lib/auth.ts:authorize()`/`authorizeWithSchool()` and `lib/permissions-client.ts`. The demo bypass was deliberate; restoring before the demo would break it. **Required before any non-demo deployment.**
2. **Migrate money fields from `Float` to `Decimal(12,2)`** — needs migration + reconciliation code review.
3. **Re-scope global `@unique` on email/admission/invoice numbers** to per-school. Breaks existing data if any cross-school duplicates exist.
4. **Drop `force-dynamic` from landing/auth pages** — needs the `(authed)/layout.tsx` route-group refactor.
5. **Adopt SWR or TanStack Query** for client reads — significant footprint, worth a separate planning pass.
6. **Standardize API response envelope** to `{ data, error, meta }` — touches client + server; sequence as: server first, then client wrapper, then per-route migration.
7. **Pick one messaging implementation** (`communications-client.tsx` vs `messaging-client.tsx`) and delete the other.
8. **Add `schoolId` denormalization** to `Student`, `Mark`, `Assessment`, `AssessmentPlan`, `Payment`, `ReportCard`, `Message`, `BehaviorBalance`.
9. **Object storage for uploads** (S3-compatible) + magic-byte MIME validation.
10. **Wire Sentry** into error boundaries + a `useApiMutation` hook to give users actionable error IDs.

---

## Autonomous deep refinement (added later)

Eight further phases were carried out in a single autonomous session. **All
existing functionality was retained** — only the methodology behind features
changed. New/changed files are typecheck-clean and ESLint-clean.

### Phase A — Foundation primitives
- `components/ui/alert-dialog.tsx` — Radix-backed AlertDialog primitive (focus
  trap, ESC, return-focus). Installed `@radix-ui/react-alert-dialog`.
- `components/ui/confirm-dialog.tsx` — high-level `<ConfirmDialog>` wrapper
  with loading state, destructive variant, and optional **typed
  confirmation** ("type the student's name to confirm").
- `lib/api/envelope.ts` — `{ data, meta }` / `{ error: { code, message,
  details, requestId } }` envelope types + `apiSuccess()` / `apiError()`
  helpers + `statusForCode()` mapping (401/403/404/400/409/429/500).
- `lib/api/errors.ts` — `ApiError` class with `.isValidation`, `.isAuth`,
  `.fromEnvelope()`, `.network()`.
- `lib/api/client.ts` — `apiFetch<T>()` typed fetch wrapper. Auto JSON
  serialization, envelope-aware error handling, legacy `{error: "..."}`
  fallback, throws `ApiError` on failure. `apiFetchEnvelope<T>()` for cases
  needing `meta`.
- `lib/hooks/use-api-mutation.ts` — generic mutation hook integrating
  `apiFetch` + `sonner` toasts + `react-hook-form` per-field error mapping
  for `validation_failed` envelopes.

### Phase B — Remaining four `window.confirm` calls converted
All call sites now use `<ConfirmDialog>` — full a11y, themed, deferred-action
loading spinner, destructive variant:
- `app/fees/fees-client.tsx` — deactivate fee structure
- `components/classes/manage-students.tsx` — remove student from class (with
  **typed confirmation** of student name for irreversibility)
- `components/classes/manage-teachers.tsx` — remove teacher from class
- `app/notifications/page.tsx` — clear all notifications

### Phase C — New endpoint: `POST /api/behavior/notify-parents`
Backs the existing "Notify Parents" button in `components/behavior/behavior-dashboard.tsx`.
- Zod-validated body (`studentIds`, `type`, `message`, `title?`, `actionUrl?`)
- School-scoped lookup of students + their `ParentContact`s
- Creates `Notification` rows for every linked `parentUserId`
- Returns `{ data: { notifiedUserCount, processedStudentCount,
  unreachableStudentIds } }` so the UI can report "5 sent, 2 students had
  no linked parent account"
- The dashboard's `handleNotifyParents` now uses `apiFetch`, surfaces the
  unreachable count via `toast.warning`, and rolls back cleanly on `ApiError`

### Phase D — DB-skip optimisation for landing/auth
- `middleware.ts` injects an `x-pathname` header on every passthrough so
  server components can adapt.
- `app/layout.tsx` reads the header via `next/headers` and **skips the
  `getActiveSchool() + getServerAuthContext()` round trip entirely** for
  `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`. This
  removes two DB queries per landing/auth page load.
- Full route-group restructure (true static landing) deliberately deferred —
  moving 25+ folders into `(authed)/` is invasive and unsafe to do
  autonomously. Documented as a follow-up.

### Phase F — `NEXT_PUBLIC_DEMO_MODE` flag + RBAC restored
- New `lib/demo-mode.ts` with `isDemoMode()` / `isRbacEnforced()`.
- `lib/auth.ts` — `authorize()` and `authorizeWithSchool()` now run real
  permission checks (`isSystemAdmin(auth) || auth.permissions.has(permission)`)
  when demo mode is off. School-scope check applies in all modes. Returns
  the envelope `{ error: { code: "forbidden", message: "Missing permission:
  X" } }`.
- `lib/permissions-client.ts` — every helper (`hasPermission`,
  `hasAnyPermission`, `hasAllPermissions`, `isSystemAdmin`, `hasSchoolAccess`,
  `getFeatureAccess`, `filterBySchoolAccess`) now evaluates real permissions
  when demo mode is off, with super-admin / system-admin wildcards intact.
- **Default is demo mode ON** so the live demo keeps working unchanged.
  Flip `NEXT_PUBLIC_DEMO_MODE=false` in production to enforce RBAC.
- Documented in `.env.example`.

### Phase G — Parent / student messaging gains realtime
- `components/messaging/messaging-client.tsx` now subscribes to the same
  `useRealtimeChat` Pusher hook used by the staff client. Incoming messages
  are deduped by id, appended optimistically, and the conversation preview
  is updated in place. Both messaging clients remain in place — neither
  was removed, but the parent/student experience now matches staff for
  live delivery.

### Phase H — `withApi()` route wrapper
- `lib/api/with-api.ts` — wraps a route handler with the standard error
  mapping: `ZodError` → 400 + flattened details; Prisma `P2002` → 409 +
  field info; `P2025` → 404; `P2003` → 409. Unknown throws → 500 with
  message redacted (logged to server console).
- `app/api/behavior/notify-parents/route.ts` adopts `withApi` as the
  canonical pattern.
- **Migration of the ~60 legacy routes is intentionally not done in this
  autonomous run** — each route has client consumers that may be parsing
  the legacy `{error: "..."}` shape. The wrapper is now available; route
  migration should be done in batches with per-batch verification.

### What this run still does NOT change
- Money fields are still `Float`. Migration drafted but not run.
- Global `@unique` on email / admission / invoice number is still global.
  Re-scoping needs data backfill review.
- `schoolId` denormalisation not added — needs migration + backfill.
- File uploads still on local disk (`public/uploads/`).
- No Sentry wiring yet — requires DSN.
- The two messaging implementations remain side-by-side (now both with
  realtime). Full consolidation deferred.
- ~60 legacy API routes still use ad-hoc error shapes. The new envelope
  pattern is available for incremental migration.

### Files added this run
- `components/ui/alert-dialog.tsx`
- `components/ui/confirm-dialog.tsx`
- `lib/api/envelope.ts`
- `lib/api/errors.ts`
- `lib/api/client.ts`
- `lib/api/with-api.ts`
- `lib/api/index.ts`
- `lib/hooks/use-api-mutation.ts`
- `lib/demo-mode.ts`
- `app/api/behavior/notify-parents/route.ts`

### Dependencies added
- `@radix-ui/react-alert-dialog ^1.1.15`

### Env vars added
- `NEXT_PUBLIC_DEMO_MODE` (defaults to `"true"`)
