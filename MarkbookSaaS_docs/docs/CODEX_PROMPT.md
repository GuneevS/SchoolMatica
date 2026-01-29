
# CODEX_PROMPT – Single Instruction for Building Markbook SaaS

> This file is intended to be used as a single, detailed prompt for Codex (or a similar code-generation model) from the repository root. It describes the full stack, architecture, and behaviour required.

(You can paste this entire file content into Codex CLI when prompted, or summarise it in your own words if needed.)

---

## High-level goal

Create a **school assessment and markbook SaaS prototype** that implements:

- Assessment configuration (like a “Config sheet”) for each class/subject.
- Spreadsheet-like markbook for capturing learner marks.
- Automatic weight normalisation and SBA % calculation when assessments are added/changed.
- Automatic calculation of Term % and Levels using configurable level descriptors.
- Capture and persist **students, classes, subjects, assessments and marks**.
- Light “role” handling (Teacher, HOD, SMT/Admin) via a UI selector – **no auth or passwords yet**.
- Moderation and approval flows with comment threads.
- Clean, modern UI using Tailwind + shadcn/ui.

This must be a **real application** – no mock APIs, no static JSON. All CRUD actions must hit a real database via API routes.

---

## Tech stack

Use the following stack **exactly**:

- **Framework:** Next.js 14 with App Router, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Forms & validation:** React Hook Form + Zod
- **ORM:** Prisma
- **Database:** PostgreSQL (containerized for all environments)
- **API:** Next.js route handlers under `app/api/**` using REST-style JSON

---

## Project structure

Create a standard Next.js app with App Router:

- `/app`
  - `/layout.tsx`, `/page.tsx`
  - `/dashboard`
  - `/classes`
  - `/classes/[classId]` (markbook)
  - `/assessment-plans`
  - `/assessment-plans/[planId]`
  - `/students`
  - `/students/[studentId]`
  - `/settings/grading`
- `/app/api`
  - `/subjects`
  - `/classes`
  - `/classes/[classId]/markbook`
  - `/assessment-plans`
  - `/assessment-plans/[planId]`
  - `/assessments`
  - `/marks`
  - `/moderation-threads`
- `/components`
  - Reusable UI components (tables, cards, charts, forms, etc.)

Include:

- `prisma/schema.prisma`
- Database initialisation + seed script
- `README.md` explaining how to run the app

---

## Data model (Prisma schema)

Implement at least the following Prisma models in `prisma/schema.prisma`:

```prisma
model School {
  id              String          @id @default(cuid())
  name            String
  shortCode       String?
  gradingConfig   GradingConfig?  @relation(fields: [gradingConfigId], references: [id])
  gradingConfigId String?
  classes         ClassGroup[]
  subjects        Subject[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model GradingConfig {
  id        String    @id @default(cuid())
  name      String
  // JSON field storing phase-based level bands:
  // {
  //   "FET": [
  //     { "minPercent": 0, "level": 1, "descriptor": "Not Achieved" },
  //     { "minPercent": 40, "level": 2, "descriptor": "Elementary" },
  //     ...
  //   ]
  // }
  phasesJson Json
  school     School?
}

model Subject {
  id        String       @id @default(cuid())
  name      String
  code      String
  phase     String       // e.g. "FET"
  school    School       @relation(fields: [schoolId], references: [id])
  schoolId  String
  classes   ClassGroup[]
}

model ClassGroup {
  id            String           @id @default(cuid())
  name          String           // e.g. "Grade 10A English HL"
  grade         Int
  year          Int
  subject       Subject          @relation(fields: [subjectId], references: [id])
  subjectId     String
  school        School           @relation(fields: [schoolId], references: [id])
  schoolId      String
  students      Student[]
  assessmentPlans AssessmentPlan[]
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

model Student {
  id            String      @id @default(cuid())
  admissionNumber String
  firstName     String
  lastName      String
  gender        String
  classGroup    ClassGroup  @relation(fields: [classGroupId], references: [id])
  classGroupId  String
  marks         Mark[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model AssessmentPlan {
  id           String        @id @default(cuid())
  name         String
  year         Int
  termCount    Int           // 3 or 4
  status       String        // "Draft" | "PendingApproval" | "Approved" | "Locked"
  classGroup   ClassGroup    @relation(fields: [classGroupId], references: [id])
  classGroupId String
  assessments  Assessment[]
  moderationThreads ModerationThread[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Assessment {
  id               String          @id @default(cuid())
  assessmentPlan   AssessmentPlan  @relation(fields: [assessmentPlanId], references: [id])
  assessmentPlanId String
  taskName         String
  term             String          // "T1" | "T2" | "T3" | "T4"
  totalMark        Int
  rawWeight        Float           // user editable
  weightPercent    Float           // normalised
  sequence         Int
  type             String?         // e.g. Test, Project, Exam
  status           String          // "Draft" | "Active" | "Archived"
  marks            Mark[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

model Mark {
  id           String     @id @default(cuid())
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  assessmentId String
  student      Student    @relation(fields: [studentId], references: [id])
  studentId    String
  rawMark      Float?     // null if not captured
  isAbsent     Boolean    @default(false)
  absenceCode  String?
  status       String     @default("Draft") // "Draft" | "Finalised"
  comment      String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model ModerationThread {
  id               String           @id @default(cuid())
  assessmentPlan   AssessmentPlan?  @relation(fields: [assessmentPlanId], references: [id])
  assessmentPlanId String?
  assessment       Assessment?      @relation(fields: [assessmentId], references: [id])
  assessmentId     String?
  status           String           // "Open" | "Resolved"
  createdByRole    String           // "Teacher" | "HOD" | "SMT"
  comments         ModerationComment[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model ModerationComment {
  id          String            @id @default(cuid())
  thread      ModerationThread  @relation(fields: [threadId], references: [id])
  threadId    String
  authorRole  String            // "Teacher" | "HOD" | "SMT"
  message     String
  createdAt   DateTime          @default(now())
}
```

Run `npx prisma migrate dev` and ensure migrations work.

---

## Seeding

Implement a seed script that:

- Creates one `School` with a `GradingConfig` that matches a typical FET 1–7 scale.
- Creates:
  - One Subject: “English HL” (FET).
  - One ClassGroup: “Grade 10A English HL”, year = current year.
  - ~10 demo Students with realistic names.
  - One AssessmentPlan with example assessments:
    - Listening & Speaking (T1, total 10, rawWeight 10)
    - Reading & Viewing (T1, total 30, rawWeight 15)
    - Writing (T2, total 20, rawWeight 25)
    - Mid-Year Exam (T2, total 100, rawWeight 25)
    - Project (T3, total 50, rawWeight 15)
    - Final Exam (T4, total 100, rawWeight 10)
  - Marks for a few students.

The seed script should auto-normalise `weightPercent` across assessments in each `AssessmentPlan`.

---

## Core logic

### Weight normalisation

Whenever assessments in a given `AssessmentPlan` are created, updated, or deleted:

- Recalculate `weightPercent`:

```ts
function normaliseWeights(assessments: Assessment[]): Assessment[] {
  const totalRaw = assessments.reduce((sum, a) => sum + a.rawWeight, 0);
  return assessments.map(a => ({
    ...a,
    weightPercent: totalRaw === 0 ? 0 : (a.rawWeight / totalRaw) * 100,
  }));
}
```

### SBA % calculation

Implement functions that compute SBA % for a given student in a given `AssessmentPlan`:

- Ignore absent tasks (`isAbsent = true`) and tasks with no mark.
- Re-normalise weights among remaining tasks.
- Compute a weighted average of `(rawMark / totalMark * 100)`.

### Term % calculation

For each term T1–T4:

- Filter assessments by `term`.
- Apply the same absent logic.
- Restrict weights to that term and renormalise.
- Compute term %.

### Level mapping

Use the `GradingConfig` to map `(phase, percent)` → `{ level, descriptor }` by choosing the highest band whose `minPercent` is <= `percent`.

---

## API endpoints

Implement REST endpoints in `app/api/**`:

- `GET /api/classes`
- `GET /api/classes/[classId]`
- `GET /api/classes/[classId]/markbook`
- `GET /api/assessment-plans`
- `POST /api/assessment-plans`
- `GET /api/assessment-plans/[planId]`
- `PATCH /api/assessment-plans/[planId]`
- `POST /api/assessments`
- `PATCH /api/assessments/[id]`
- `DELETE /api/assessments/[id]`
- `POST /api/marks/bulk-upsert`
- `POST /api/moderation-threads`
- `GET /api/moderation-threads`
- `POST /api/moderation-threads/[id]/comments`
- `PATCH /api/moderation-threads/[id]`

Use TypeScript + Zod validation where appropriate.

---

## Frontend pages and UX

### Layout

- Sidebar with:
  - Dashboard
  - Classes
  - Assessment Plans
  - Students
  - Settings
- Top bar:
  - App name
  - School name (from the single seeded school)
  - Role Selector: Teacher / HOD / SMT/Admin (no real auth yet).

### Dashboard

- For Teacher:
  - Show “Your classes” (all classes for now).
  - Link to markbook for each.

- For HOD / SMT:
  - Simple statistics (class counts, average SBA across plans).

### Assessment Plans

- List all plans.
- Detail view:
  - Editable assessment table:
    - Task Name, Term, Total Mark, Raw Weight, Weight %, Type.
  - Live weight summary (should show 100%).
  - Moderation panel with threads & comments.
  - Buttons: Save, Send for Approval, Approve & Lock (behaviour based on selected role).

### Class Markbook

- Tabular grid:
  - Columns: Admission No, Learner, Gender, Assessments..., SBA %, Level, Term1–4 %.
- Editable cells for marks:
  - Validate against total mark (error styling if invalid).
  - Recognise `-1` as absent and mark cell with yellow highlight.
- Row selection shows learner detail panel on the right.

### Students

- List of students.
- Detail view showing all assessments and marks.

### Settings – Grading

- UI for editing level descriptors in `GradingConfig`.
- For now, focus on one phase (e.g. FET).

---

## Non-goals (for now)

- No real authentication, passwords, or multi-tenant routing.
- No complex reporting/export (beyond JSON responses and basic UI).

---

## Deliverables

End state when the app is built:

1. `npm install`
2. `npx prisma migrate dev`
3. `npx prisma db seed`
4. `npm run dev`

Visiting `http://localhost:3000` should allow:

- Navigating to Dashboard → Classes → Markbook.
- Editing marks and seeing SBA %, levels, and term % update.
- Editing AssessmentPlans and seeing weightPercent auto-normalise.
- Creating and commenting on moderation threads.
