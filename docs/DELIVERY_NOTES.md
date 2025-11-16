# DELIVERY_NOTES

Use this log to capture milestones, architectural decisions, and follow-up items. Update it whenever we finish a meaningful slice of work.

## 2025-11-16
- Initialised `/docs` as the canonical reference hub (mirrors Markbook blueprint/prompt and adds delivery log).
- Re-confirmed high-level feature goals: advanced assessment planning, moderation workflow, audit trails, learner registration, drag-and-drop weighting, SA-specific reporting.
- Next milestone: extend Prisma schema + APIs to support templates, documents, audit logs, and learner onboarding.

## 2025-11-16 (Backend foundations)
- Extended Prisma schema with curriculum templates, assessment documents + approvals, learner registrations, audit logs, and mark snapshots.
- Seeded demo data covering templates, moderation docs, audit events, and registration workflow.
- Added reusable domain helpers for audit logging, workflows, templates, and enhanced calculation outputs (PAT vs SBA splits, snapshots).
- Implemented new API surface: curriculum templates, document approvals, workflow transitions, learner registrations, audit logs, drag-and-drop reorder, and richer assessment mutations.
- Updated UI touch points (Plan Editor drag-and-drop, plan metadata cards, summary stats) to leverage the new services.

## 2025-11-16 (Workflow polish)
- Added moderation document manager with upload metadata, approvals, and status controls directly on the plan detail view.
- Built learner registration workspace (capture form, placement controls, approvals, linked student creation) plus navigation entry.
- Surfaced audit log stream + richer dashboards (template-aware plan cards, live thread labels) to close the QA loop.
- Ran `npm run lint` and `npm run build` to ensure production compilation success.
- Added automatic `prisma generate` step to `npm run dev`/`npm run build` so environments stay in sync with schema changes (prevents runtime `findMany` errors when new models are added).

## 2025-11-16 (UX & Help System)
- Implemented comprehensive help system with floating help button and contextual help panel on every page.
- Created detailed help content for Dashboard, Assessment Plans, Markbook, Registrations, and Settings pages.
- Added interactive tooltips with info icons on summary statistics and complex UI elements.
- Built dismissible welcome banner with key tips and direct link to help panel.
- Enhanced visual design with smooth animations and micro-interactions:
  - Button hover/active states with scale and shadow effects
  - Card hover animations with subtle scale and shadow transitions
  - Navigation link slide animations on hover
  - Table row hover effects for better interactivity
  - Gradient background and backdrop blur effects throughout
- Improved layout with sticky header, enhanced sidebar, and better visual hierarchy.
- Added Alert component with multiple variants (info, success, warning, destructive).
- Implemented ScrollArea and Tooltip components from Radix UI.
- Created comprehensive documentation in `/docs/HELP_SYSTEM.md` and `/docs/UX_IMPROVEMENTS.md`.
- All animations are hardware-accelerated and respect user preferences (prefers-reduced-motion).
- Accessibility improvements: keyboard navigation, ARIA labels, proper focus states, and WCAG AA color contrast.
