---
description: Perform a deep code review and security audit on specific files.
---

# Code Review & Audit Workflow

## Step 1: Analysis
**Agent**: [GuardRail (QA)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\GuardRail.md)

**Instructions**:
1.  Read the target files.
2.  Look for:
    -   **Security**: IDOR, Injection, Unprotected Routes.
    -   **Performance**: N+1 queries, large re-renders.
    -   **Logic**: Race conditions, unhandled errors.
    -   **Style**: Inconsistent naming, poor typing (`any`).

## Step 2: Reporting
**Agent**: [GuardRail (QA)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\GuardRail.md)

**Instructions**:
1.  Generate a list of critical issues.
2.  Rate the code "Health" on a scale of 1-10.
3.  Propose specific refactors.

## Step 3: Refactoring (Optional)
**Agent**: [CodeSmith (Builder)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\CodeSmith.md)

**Instructions**:
1.  Apply the fixes suggested by GuardRail.
2.  Verify the prompt fixes the issue without regression.
