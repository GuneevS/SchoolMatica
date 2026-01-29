# PRODUCT_BLUEPRINT – Summary Pointer

The full, canonical blueprint currently lives in `MarkbookSaaS_docs/docs/PRODUCT_BLUEPRINT.md`. Consult it for the exhaustive copy. This summary highlights the minimum context to keep in mind before touching the codebase:

- **Vision:** Spreadsheet-speed workflows with policy guardrails, covering assessment configuration, capture, and oversight for Teachers, HODs, and SMT/Admin.
- **Core concepts:** Assessment Plans (per class/year), Assessments (columns), Markbook grid, Grading Config bands, Moderation threads.
- **Domain rules:** Raw → normalised weight pipeline, SBA/Term % calculations excluding absent entries, level mapping via grading config.
- **Moderation:** Plan thread lifecycle (Draft → Pending → Approved → Locked) and assessment-level moderation threads with comments and status.
- **UI pillars:** Dashboard tiles, Assessment Plan editor, Class Markbook grid, Students directory, Grading settings.
- **Tech stack:** Next.js 16 App Router, Tailwind + shadcn/ui, Prisma (PostgreSQL), Docker, API routes, domain logic in `/lib`.

> Whenever requirements evolve, update this summary and sync it with the canonical file to ensure `/docs` remains the first stop for direction.
