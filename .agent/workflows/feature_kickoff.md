---
description: Start a new feature development cycle using the Architect and CodeSmith agents.
---

# Feature Kickoff Workflow

This workflow is designed to take a high-level user request and turn it into a fully implemented feature.

## Step 1: Architectural Planning
**Agent**: [System Architect](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\SysArchitect.md)

**Instructions**:
1.  Read the user's request carefully.
2.  Review the existing `schema.prisma` and project structure.
3.  Create an `implementation_plan.md` that details:
    -   Data Model changes (if any).
    -   API Routes to be created.
    -   New Components required.
    -   Verification plan (how to test).
4.  **STOP** and ask the user for approval of the plan.

## Step 2: Implementation
**Agent**: [CodeSmith (Builder)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\CodeSmith.md)

**Instructions**:
1.  Read the approved `implementation_plan.md`.
2.  Execute the plan step-by-step.
    -   Run database migrations if needed (`npx prisma migrate dev`).
    -   Create backend logic first.
    -   Create frontend components second.
3.  Ensure strictly typed code.

## Step 3: Verification & Self-Correction
**Agent**: [GuardRail (QA)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\GuardRail.md)

**Instructions**:
1.  **Test**: Execute manual or automated tests.
2.  **Analyze**: If a failure occurs, identify the root cause (Logic vs. Syntax).
3.  **Loop**:
    -   If failure is minor -> Direct [CodeSmith] to fix.
    -   If failure is structural -> Direct [System Architect] to revise the plan.
    -   **CRITICAL**: If the same error occurs twice, STOP and request User intervention or deeper analysis.
4.  **Optimize**: Once functional, check performance bounds (e.g., query speed). If slow, reject and send back to implemented.

## Step 4: Knowledge Capture (Self-Improvement)
**Agent**: [System Architect](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\SysArchitect.md)

**Instructions**:
1.  Did we encounter a new class of bug?
2.  If yes, output a "Rule Update" to be added to the project's coding standards.
3.  Create/Update `walkthrough.md`.
