# Backend Upgrade Plan

Focus: unlock SA-ready assessment workflows by extending the data layer, domain services, and APIs. UI changes will latch onto these contracts once the foundation is stable.

## Scope (Phase 1 – Foundations)
1. **Curriculum & Subject provisioning**
   - Add curriculum templates per grade/subject/phase with default assessment structures.
   - Support cloning templates into class-specific plans.
2. **Assessment management**
   - Drag-and-drop sequencing with transactional reorder endpoint.
   - File/document attachments with approval status and version history.
   - Term weighting guardrails and compliance validation.
3. **Moderation & Audit**
   - Multi-stage approval workflow (Draft → Teacher Submit → HOD Review → SMT Lock).
   - Assessment-level moderation threads referencing documents & decisions.
   - Central `AuditLog` capturing actor, role, entity, diff.
4. **Learner lifecycle**
   - Registration pipeline (single + bulk import), storing biographical + guardian details.
   - Transfer learners across class groups while keeping historical marks.
5. **Calculation services**
   - Weight renormalisation per student/term, SBA/PAT/exam splits, locked snapshots per term.

## Deliverables for current iteration
- Prisma schema + migration for new entities.
- Service layer modules (e.g., `/lib/domain/workflows.ts`, `/lib/domain/audit.ts`).
- API routes covering templates, documents, reorder, workflow transitions, learner intake.
- Updated `/docs` and README to describe new capabilities.

## Status – Phase 1
- Schema + migrations shipped (templates, documents, audit logs, registrations, snapshots).
- Services/APIs wired with workflow transitions, document approvals, registration pipeline, and drag-and-drop sequencing.
- UI hooks in place for plan metadata, template bootstrapping, and markbook analytics; remaining UI (document upload, registration console) slated for Phase 2.

## Status – Phase 1 (cont.)
- Document workflow now fully wired (API + UI) with reviewer inputs and audit logging per action.
- Registration intake module live with review/approval pipeline and automatic student creation post-approval.
- Dashboard exposes audit activity stream; production build verified to pass `npm run build`.
- Next focus: surface document uploads per assessment + build CSV importer for bulk registrations (Phase 2 backlog).
