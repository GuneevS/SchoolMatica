
# AGENTS.md – Multi-Agent Build Orchestration for Markbook SaaS

This file defines a **multi-agent workflow** for building the Markbook SaaS application using Codex CLI (or any similar code-generation loop). Each "agent" is a *mode of operation* for the same underlying model.

The goal: produce a **production-grade, fully functional** implementation of the blueprint in `docs/PRODUCT_BLUEPRINT.md` and `docs/CODEX_PROMPT.md`.

---

## Global Principles (Apply in Every Agent)

- **Single source of truth**: The product and technical requirements are defined in:
  - `docs/PRODUCT_BLUEPRINT.md`
  - `docs/CODEX_PROMPT.md`
- **Type safety first**: Prefer explicit types, exhaustive checks, and clear error handling.
- **No mock backends**: All CRUD must talk to a real database via API routes.
- **Idempotent changes**: Avoid breaking the existing project structure. Refactor instead of rewrites.
- **Keep running**: After each major step, ensure `npm run lint` and `npm run build` can plausibly pass (at least structurally).

---

## Agent 0 – Repo Initialiser

**Objective:** Bootstrap a clean Next.js 14 + Prisma + Tailwind + shadcn/ui project skeleton that matches the requested stack.

**Scope & Responsibilities:**

- Initialise the project:
  - `npx create-next-app@latest` (or equivalent) with TypeScript & App Router.
  - Add Tailwind CSS.
  - Add shadcn/ui and a base theme.
  - Add Prisma and configure PostgreSQL with Docker.
- Create initial folder structure:
  - `/app`, `/app/api`, `/components`, `/lib`, `/docs`, `/prisma`.
- Place the provided docs in `/docs`:
  - `PRODUCT_BLUEPRINT.md`
  - `CODEX_PROMPT.md`
- Add a starter `README.md` with:
  - Setup steps
  - Basic run commands
- Verify that:
  - `npm install`
  - `npm run dev`
  work without TypeScript errors (even if UI is minimal).

**Output of Agent 0:**

- Working skeleton app with:
  - Tailwind configured.
  - shadcn/ui installed.
  - Prisma set up with empty schema.
- Commit point (if using git): `chore: initialise Next.js + Prisma + Tailwind + shadcn`.

---

## Agent 1 – Data Architect & Prisma Schema Author

**Objective:** Implement the Prisma schema as specified, plus seed data that matches the blueprint.

**Scope & Responsibilities:**

1. Read:
   - `docs/CODEX_PROMPT.md` (Prisma schema block)
   - `docs/PRODUCT_BLUEPRINT.md` (domain explanation)
2. Implement full Prisma schema in `prisma/schema.prisma`:
   - Models:
     - `School`, `GradingConfig`, `Subject`, `ClassGroup`,
       `Student`, `AssessmentPlan`, `Assessment`, `Mark`,
       `ModerationThread`, `ModerationComment`.
   - Ensure relations, indexes where sensible (e.g. on foreign keys).
3. Configure:
   - `DATABASE_URL` for PostgreSQL in `.env`.
   - Docker Compose configuration for local development.
   - `npx prisma migrate dev` support.
4. Create `prisma/seed.ts`:
   - Seed:
     - One `School` and `GradingConfig` with 1–7 level descriptors.
     - One `Subject` (“English HL”).
     - One `ClassGroup` (“Grade 10A English HL”) for current year.
     - ~10 `Student`s.
     - One `AssessmentPlan` with 6 tasks as described.
     - Example `Mark` records with varied performance.
   - Include a helper function to **normalise weights** when seeding assessments.
5. Add `package.json` scripts:
   - `"db:migrate": "prisma migrate dev"`
   - `"db:seed": "ts-node prisma/seed.ts"` (or use `prisma db seed` pattern with proper config).

**Output of Agent 1:**

- Prisma schema that compiles.
- Successful migration and seeding.
- Verified by running:
  - `npx prisma migrate dev`
  - `npx prisma db seed` (or equivalent)

---

## Agent 2 – Domain Logic & Calculation Engine

**Objective:** Implement core calculation logic in reusable, tested backend utilities.

**Scope & Responsibilities:**

1. Create `/lib/domain/` with at least:
   - `grading.ts` – functions to map percent → level using `GradingConfig`.
   - `weights.ts` – functions to normalise assessment weights.
   - `marks.ts` – functions to compute:
     - SBA%
     - Term% per term
     - per-student summary for a given `AssessmentPlan`.
2. Key functions to implement and export:
   - `normaliseWeights(assessments: Assessment[]): Assessment[]`
   - `mapPercentToLevel(percent: number, levelBands: LevelBand[]): LevelBand`
   - `calculateStudentSummary(planId: string, studentId: string): Promise<StudentSummary>`
   - `calculateClassMarkbook(planId: string): Promise<ClassMarkbookSummary>`
3. Implement logic consistent with the blueprint:
   - Absent marks:
     - For MVP, **exclude** absent (`isAbsent=true`) assessments from denominator (renormalise weights per student).
   - SBA%:
     - Weighted average of (mark/totalMark * 100) using renormalised weights.
   - Term%:
     - Weighted average within each term with renormalised term weights.
4. Add unit tests (minimal but real):
   - `/lib/domain/__tests__/weights.test.ts`
   - `/lib/domain/__tests__/marks.test.ts`
   - Use Jest or Vitest.
   - Test:
     - Weight normalisation.
     - Level mapping.
     - SBA% calculation with absent vs present.

**Output of Agent 2:**

- Domain logic fully implemented.
- Unit tests pass.
- Computations are standalone and later callable from API routes.

---

## Agent 3 – API Designer & Implementer

**Objective:** Implement REST-style JSON API endpoints in `app/api/**` that expose all required operations.

**Scope & Responsibilities:**

Implement the following endpoint families, mapping closely to `docs/CODEX_PROMPT.md`:

1. Classes:
   - `GET /api/classes` – list `ClassGroup`s with subject & summary.
   - `GET /api/classes/[classId]` – class detail (subject, students, active AssessmentPlan).
   - `GET /api/classes/[classId]/markbook` – uses domain logic to return:
     - students,
     - assessments,
     - marks,
     - computed SBA%, term%, and levels per student.

2. Assessment Plans:
   - `GET /api/assessment-plans`
   - `POST /api/assessment-plans`
   - `GET /api/assessment-plans/[planId]`
   - `PATCH /api/assessment-plans/[planId]` – update name, status, termCount, etc.

3. Assessments:
   - `POST /api/assessments` – create new assessment, then normalise all weights in that plan.
   - `PATCH /api/assessments/[id]` – edit assessment, then normalise.
   - `DELETE /api/assessments/[id]` – delete assessment, then normalise.

4. Marks:
   - `POST /api/marks/bulk-upsert`:
     - Accepts `{ planId, items: { studentId, assessmentId, rawMark, isAbsent?, absenceCode? }[] }`.
     - Upserts marks, then returns updated markbook summary for affected students.

5. Moderation:
   - `POST /api/moderation-threads`
   - `GET /api/moderation-threads`
   - `POST /api/moderation-threads/[id]/comments`
   - `PATCH /api/moderation-threads/[id]` – update thread status.

**Guidelines:**

- Use `NextRequest`/`NextResponse` from Next.js App Router APIs.
- Handle validation with Zod schemas where input is non-trivial.
- On write operations (create/update/delete):
  - Ensure invariants like weight normalisation remain true.

**Output of Agent 3:**

- API endpoints that compile and work end-to-end against the seeded DB.
- No untyped `any`.
- Clear error responses (HTTP 400/404/500 as appropriate).

---

## Agent 4 – UI/UX Builder (Markbook & Assessments)

**Objective:** Build the main UI screens with a modern, clean design and working interactions.

**Scope & Responsibilities:**

1. Global layout:
   - Sidebar with links:
     - Dashboard
     - Classes
     - Assessment Plans
     - Students
     - Settings
   - Top bar:
     - App name
     - School name (from seeded data)
     - **Role selector**: Teacher / HOD / SMT/Admin
       - Store role in a global state (context or Zustand).

2. Dashboard (`/dashboard`):
   - If role is Teacher:
     - Show cards for “Your classes” (from `/api/classes`).
     - Each card links to the Class markbook.
   - If role is HOD/SMT:
     - Show high-level metrics (basic for now, e.g. number of classes, average SBA per class).

3. Assessment Plans (`/assessment-plans`, `/assessment-plans/[planId]`):
   - List view:
     - Table with plan name, class, year, status, count of assessments.
   - Detail view:
     - Editable assessments table:
       - Task Name, Term (select), Total Mark, Raw Weight, Weight% (read-only), Type (optional).
       - Add / remove rows.
       - Changes auto-save via API and re-fetch.
     - Right panel:
       - Normalised weight total (should show 100%).
       - Simple doughnut-like summary (can use any lightweight chart or just a stylised list).
     - Moderation panel:
       - List/open moderation threads.
       - Add comment.

4. Class Markbook (`/classes/[classId]`):
   - Spreadsheet-like grid:
     - First columns: Admission No, Learner Name, Gender.
     - Next: dynamic columns, one per assessment (use short labels).
     - Final columns: SBA %, Level, Term1–4 %.
   - Sticky header row and sticky first 2–3 columns.
   - Editable mark cells:
     - Numeric input.
     - Save on blur using debounced `POST /api/marks/bulk-upsert`.
     - If value > totalMark, show red border and tooltip error and do not send invalid update.
     - If value is `-1`, treat as absent and style cell with a soft yellow background.
   - Row selection:
     - Highlight selected row.
     - Right-hand info panel showing that learner’s breakdown and level.

**Output of Agent 4:**

- Functional UI where:
  - Teacher can navigate from Dashboard → Class → Markbook.
  - Can edit marks and see summary columns update.
  - HOD can open AssessmentPlan and edit assessments, with live weight percentages.

---

## Agent 5 – Settings & Grading Config UI

**Objective:** Expose the grading levels in a simple admin UI for editing.

**Scope & Responsibilities:**

1. Settings page at `/settings/grading`:
   - Fetch the single `GradingConfig` for the current school.
   - Parse `phasesJson` and show FET (or relevant phase) as a table:
     - Min %
     - Level
     - Descriptor
   - Allow editing rows, adding/removing rows.
   - On save:
     - Validate:
       - Min % between 0 and 100.
       - Levels unique.
     - Update `GradingConfig` via an API endpoint.

2. Ensure that `mapPercentToLevel` uses this config.

**Output of Agent 5:**

- Working grading settings UI, wired to persistent `GradingConfig`.

---

## Agent 6 – QA, Refactor & Polish

**Objective:** Stabilise, clean and document.

**Scope & Responsibilities:**

- Run through:
  - Seeded data flows.
  - Load each main screen and click around.
- Fix:
  - Type errors.
  - Obvious UX issues (broken layouts, unusable tables).
- Refactor:
  - Extract any duplicated logic into `/lib` or `/components`.
- Documentation:
  - Update `README.md` to include:
    - Clear setup steps.
    - Tech stack summary.
    - Overview of key features.

**Output of Agent 6:**

- Repo ready for human review and deployment to a PaaS (e.g. Vercel + a managed Postgres later).

---

## Execution Order & Dev Workflow (High-level)

1. **Agent 0** – Initialise repo + stack.
2. **Agent 1** – Implement Prisma models + migrations + seed.
3. **Agent 2** – Domain logic (calculations + tests).
4. **Agent 3** – API endpoints using domain logic.
5. **Agent 4** – Core UI screens (Dashboard, AssessmentPlan, Markbook).
6. **Agent 5** – Grading settings UI.
7. **Agent 6** – QA, refactor, docs.

Each time you (Codex CLI) are called, the invoking prompt should specify which Agent you are acting as and what file(s) or area(s) you are allowed to modify in that pass.

---
