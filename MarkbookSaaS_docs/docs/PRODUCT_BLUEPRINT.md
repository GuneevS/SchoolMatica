
# PRODUCT_BLUEPRINT – Markbook SaaS

This document summarises the product and technical direction for the Markbook SaaS. It is a companion to `CODEX_PROMPT.md`, which provides a highly detailed build instruction for the code generator.

---

## Vision

Build a **modern SaaS web application** that replaces manual, spreadsheet-based markbooks with a structured, policy-aware, school-wide platform.

Key characteristics:

- Works like a spreadsheet for teachers, but with guardrails.
- Encodes assessment plans, weightings, and level descriptors centrally.
- Provides clear overviews for HODs and SMT (subject and school-wide).
- Ready to plug into proper auth and multi-tenant hosting later.

---

## Personas

### Teacher

- Wants to set up and capture marks fast.
- Needs automatic calculations (SBA %, term %, level).
- Wants to see which learners are at risk.

### HOD

- Designs or approves assessment plans per subject/grade.
- Checks that weightings and task types are compliant.
- Uses dashboards to compare classes and escalate interventions.

### SMT/Admin

- Oversees the entire academic picture.
- Requires standardised policies and reporting.
- Needs auditability (moderation threads, approvals, etc.).

---

## Core Concepts

### Assessment Plan

Equivalent of the paper/Google Sheet **Config** section:

- One per `ClassGroup` (subject + grade + year).
- Contains multiple **Assessments**, each with:
  - Task Name.
  - Term (T1–T4).
  - Total Mark.
  - Raw Weight.
  - Normalised `weightPercent`.
  - Type (Test, Project, Exam, etc.).
- Has a status lifecycle:
  - Draft → PendingApproval → Approved → Locked.

### Assessment

A specific graded task:

- Belongs to one `AssessmentPlan`.
- Used as a column in the Markbook grid.
- Has `Mark` rows for each student.

### Markbook (Class-level view)

The grid view for a single `ClassGroup`:

- Columns:
  - Admission No, Learner, Gender
  - One column per Assessment
  - SBA %
  - Level
  - Term1–4 %
- Teachers interact here most of the time.

### Grading Config & Level Descriptors

The central definition of level scales:

- A set of `minPercent` / `level` / `descriptor` triples.
- Example FET scale:
  - 0–39% = Level 1 (Not Achieved)
  - 40–49% = Level 2 (Elementary)
  - ...
  - 90–100% = Level 7 (Outstanding)
- Stored as JSON, but edit-able through a Settings UI.

---

## Domain Rules

### Weight Normalisation

- Assessment weights are managed via `rawWeight` and `weightPercent`.
- The system normalises:

  `weightPercent_i = rawWeight_i / sum(rawWeight_all) * 100`

- Normalisation is triggered whenever an Assessment is created, updated, or deleted in an AssessmentPlan.

### SBA % Calculation

For each student and plan:

- Ignore absent tasks for that student (for MVP).
- For remaining tasks:

  `taskPercent = (mark / totalMark) * 100`

- Renormalise weights across non-absent tasks for that student.
- SBA % is the weighted average:

  `SBA% = sum( normalisedWeight_i / 100 * taskPercent_i )`

### Term % Calculation

For a given term Tn:

- Filter assessments where `term === "Tn"`.
- Apply the same absent rule as SBA.
- Restrict to term weights and renormalise within that term.
- Compute term % as weighted average of term taskPercent values.

### Level Mapping

- Use `GradingConfig` to map percent → level.
- A simple rule: choose the **highest band** whose `minPercent` is `<= percent`.

---

## Moderation & Approvals

Two layers of moderation:

1. **AssessmentPlan moderation**
   - Thread attached to the plan.
   - Allows back-and-forth between Teacher, HOD, SMT.
   - Concludes with plan status = Approved/Locked.

2. **Assessment moderation**
   - Thread attached to a specific assessment.
   - Used when distributions look suspicious; to document rescaling or other changes.

Threads have:

- Status: Open / Resolved.
- Comments: written by Teacher/HOD/SMT with timestamps.

---

## UI Overview

### Dashboard

- Teacher view:
  - Their classes.
  - Quick stats on average SBA per class.

- HOD / SMT view:
  - Subject/grade tiles with average performance.
  - Basic flags for classes with many at-risk learners.

### Assessment Plans

- List view:
  - All plans with class, year, status.

- Detail view:
  - Editable table of assessments (when not locked).
  - Weight gauge and distribution.
  - Moderation panel with threads & comments.
  - Actions:
    - Save, send for approval, approve/lock.

### Class Markbook

- Spreadsheet-style table:
  - Learners rows, assessments columns, summary columns.
- In-cell editing:
  - Validate against total mark.
  - `-1` and/or absent toggle to mark absent.
- Sticky headings and first columns.
- Right-hand panel showing selected learner details.

### Students

- Directory view of students.
- Individual student performance overview.

### Settings – Grading

- UI to adjust level descriptors.
- For now, manage a single FET scale for the seeded school.

---

## Technical Direction

- Next.js 14 (App Router) with TypeScript.
- Tailwind + shadcn/ui for UI.
- Prisma + SQLite now; Postgres-ready schema.
- Domain logic in `/lib/domain/*`.
- API in `app/api/**`.
- Tests for core calculations.

This blueprint is intentionally high-level and conceptual; see `CODEX_PROMPT.md` for concrete instructions on what Codex should generate and how.
