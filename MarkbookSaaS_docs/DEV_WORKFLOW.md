
# DEV_WORKFLOW – How to Use AGENTS.md with Codex CLI

This file explains **how to drive the build process** using `AGENTS.md` and the project docs, assuming you are orchestrating Codex CLI locally.

---

## Pre-req: Repo Layout

The zipped folder you received contains:

- `AGENTS.md`
- `docs/PRODUCT_BLUEPRINT.md`
- `docs/CODEX_PROMPT.md`
- `DEV_WORKFLOW.md`

You should:

1. Create a new project folder on your machine.
2. Unzip this pack into the repo root.
3. Then drive Codex CLI from this directory.

---

## High-level Strategy

You will build the app in **passes**, each pass telling Codex which "Agent" from `AGENTS.md` it is acting as.

For example:

- Pass 0: “Act as Agent 0 – Repo Initialiser.”
- Pass 1: “Act as Agent 1 – Data Architect & Prisma Schema Author.”
- etc.

The idea is to keep Codex **focused** and **incremental**, avoiding big-bang prompts that cause chaos.

---

## Suggested Pass Sequence

### Pass 0 – Initialise Project

**Your CLI prompt to Codex might look like:**

> You are acting as Agent 0 from AGENTS.md.  
> Read AGENTS.md and docs/PRODUCT_BLUEPRINT.md.  
> Initialise a Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + SQLite project in this repo.  
> Create the basic folder structure and a placeholder README.md.  
> Do not yet implement the Prisma schema – leave it empty.

After Codex finishes:

- Run:
  - `npm install`
  - `npm run dev` (ensure it starts)
- Commit (optional).

---

### Pass 1 – Prisma Schema & Seed

**Prompt:**

> You are acting as Agent 1 from AGENTS.md.  
> Implement the Prisma schema as described in docs/CODEX_PROMPT.md.  
> Add a seed script that sets up the default school, grading config, subject, class, students, assessment plan and marks.  
> Ensure migrations and seeding work.

Then run:

- `npx prisma migrate dev`
- `npx prisma db seed`

Fix any errors (by re-invoking Codex for this pass if needed).

---

### Pass 2 – Domain Logic

**Prompt:**

> You are Agent 2 from AGENTS.md.  
> Read docs/CODEX_PROMPT.md and docs/PRODUCT_BLUEPRINT.md.  
> Implement core domain logic in /lib/domain (grading, weights, marks).  
> Add minimal Jest/Vitest tests to validate weight normalisation and SBA/term calculations.

Then run:

- `npm test` (or equivalent test command you define).

---

### Pass 3 – API Layer

**Prompt:**

> You are Agent 3 from AGENTS.md.  
> Implement REST endpoints in app/api/** for classes, assessment plans, assessments, marks and moderation threads.  
> Use the domain logic from /lib/domain for all calculated responses.  
> Ensure TypeScript types are correct and no any’s are left untyped.

Afterwards:

- Sanity-check some endpoints with curl or a REST client.

---

### Pass 4 – UI (Markbook & Assessment Plans)

**Prompt:**

> You are Agent 4 from AGENTS.md.  
> Build the core UI pages: Dashboard, Assessment Plans list/detail, Class Markbook.  
> Use Tailwind + shadcn/ui for a polished, modern look.  
> Wire all pages to the API endpoints so that the seeded data can be viewed and edited.

Then:

- Run `npm run dev`.
- Navigate through:
  - `/dashboard`
  - `/assessment-plans`
  - `/classes/[classId]`

---

### Pass 5 – Grading Settings

**Prompt:**

> You are Agent 5 from AGENTS.md.  
> Build the Grading Settings UI at /settings/grading.  
> Allow editing of the single FET grading scale in GradingConfig.  
> Ensure mapPercentToLevel uses this persisted config.

---

### Pass 6 – QA & Polish

**Prompt:**

> You are Agent 6 from AGENTS.md.  
> Do a QA pass across the app.  
> Fix obvious bugs, type errors, and poor UX.  
> Refine layout, extract shared components, and update README with clear setup instructions.

---

## General Tips for Calling Codex

- Always remind Codex which **Agent** it is and what files it should focus on.
- Keep prompts anchored in `AGENTS.md` and the docs – mention specific file paths.
- After each pass:
  - Run the relevant commands (migrations, tests, dev server).
  - Only move to the next pass when the previous one is stable.

---

This workflow, combined with `AGENTS.md` and the blueprint docs, should steer Codex towards a robust, production-grade implementation of the Markbook SaaS.
