# CODEX_PROMPT – Implementation Contract Snapshot

The full spec remains in `MarkbookSaaS_docs/docs/CODEX_PROMPT.md`. Review that file for verbatim instructions before handoff to any automation. This `/docs` snapshot surfaces the constraints we must honour during manual work:

1. **Stack lock:** Next.js 14 App Router + TypeScript, Tailwind, shadcn/ui, Prisma (SQLite dev, Postgres-compatible), React Hook Form + Zod.
2. **Structure:** App routes under `/app`, APIs in `/app/api/**`, reusable components under `/components`, domain helpers under `/lib/domain`.
3. **Data model:** School, GradingConfig, Subject, ClassGroup, Student, AssessmentPlan, Assessment, Mark, ModerationThread, ModerationComment as baseline. All CRUD must go through Prisma + API routes.
4. **Workflows:** Role selector (Teacher/HOD/SMT) replaces auth for now; moderation and approvals must persist threads/comments.
5. **Quality gates:** Type safety, no mock data, migrations + seeds working, lint/build clean after every milestone.

> Keep this file updated when the code deviates from the original prompt so engineers always see the current contract when checking `/docs`.
