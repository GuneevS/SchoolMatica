# Auto-Fixer

*Autonomous issue fixing with self-correction protocol.*

---

## Purpose

Automatically fix issues with:
1. **Safe auto-fixes** - Apply without approval
2. **Proposed fixes** - Generate and request approval
3. **Self-correction** - Retry on failure (max 3 attempts)
4. **Documentation** - Log all changes

---

## Issue Categories

### Category 1: Auto-Fixable (Apply Immediately)

These are safe to fix without user approval:

```yaml
auto_fixable:
  missing_imports:
    description: "Add missing import statements"
    detection: "Cannot find name 'X'" error
    fix: Add import from correct module

  type_annotations:
    description: "Add simple type annotations"
    detection: "implicitly has 'any' type" error
    fix: Add explicit type based on usage

  lint_errors:
    description: "ESLint auto-fixable issues"
    detection: eslint output
    fix: Run eslint --fix

  path_aliases:
    description: "Replace relative paths with @ aliases"
    detection: Import using "../../../"
    fix: Replace with "@/path"

  formatting:
    description: "Code formatting issues"
    detection: Prettier/ESLint formatting rules
    fix: Run formatter

  unused_imports:
    description: "Remove unused import statements"
    detection: "'X' is declared but never used"
    fix: Remove import line
```

### Category 2: Semi-Auto (Propose, Request Approval)

These need user review before applying:

```yaml
semi_auto:
  authorization_pattern:
    description: "Add authorization to API routes"
    severity: CRITICAL
    template: See fix-templates.md

  multi_tenancy_filter:
    description: "Add school filtering to queries"
    severity: CRITICAL
    template: See fix-templates.md

  transaction_wrapping:
    description: "Wrap multi-step operations in transaction"
    severity: HIGH
    template: See fix-templates.md

  null_checks:
    description: "Add null checks with 404 responses"
    severity: HIGH
    template: See fix-templates.md

  loading_states:
    description: "Add loading state to components"
    severity: MEDIUM
    template: See fix-templates.md

  error_handling:
    description: "Add error handling to components"
    severity: MEDIUM
    template: See fix-templates.md

  zod_validation:
    description: "Add Zod schema validation"
    severity: HIGH
    template: See fix-templates.md
```

### Category 3: Manual (Log for Review)

These require human decision:

```yaml
manual:
  business_logic:
    description: "Changes to calculations or workflows"
    reason: "May have unintended side effects"

  schema_changes:
    description: "Database schema modifications"
    reason: "Requires migration planning"

  architectural_decisions:
    description: "Structural changes to codebase"
    reason: "May affect multiple systems"

  security_policy:
    description: "Security-related design decisions"
    reason: "Requires security review"

  performance_refactoring:
    description: "Major refactoring for performance"
    reason: "May introduce regressions"
```

---

## Self-Correction Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SELF-CORRECTION PROTOCOL                              │
└─────────────────────────────────────────────────────────────────────────┘

Issue Detected
     │
     ▼
Categorize (auto/semi-auto/manual)
     │
     ├─── Manual ────────────────────▶ Log for review, SKIP
     │
     ├─── Semi-Auto ─────────────────▶ Propose fix, wait for approval
     │                                        │
     │                                   ┌────┴────┐
     │                                 Approved  Rejected
     │                                   │          │
     │                                   ▼          ▼
     │                              Apply fix    SKIP
     │                                   │
     └─── Auto-Fix ──────────────────────┤
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │  ATTEMPT 1  │
                                  │             │
                                  │ Apply fix   │
                                  │ Run verify  │
                                  └──────┬──────┘
                                         │
                                    ┌────┴────┐
                                  Pass      Fail
                                    │         │
                                    ▼         ▼
                                  DONE   ┌─────────────┐
                                         │  ATTEMPT 2  │
                                         │             │
                                         │ Analyze err │
                                         │ Alt fix     │
                                         │ Run verify  │
                                         └──────┬──────┘
                                                │
                                           ┌────┴────┐
                                         Pass      Fail
                                           │         │
                                           ▼         ▼
                                         DONE   ┌─────────────┐
                                                │  ATTEMPT 3  │
                                                │             │
                                                │ Pattern fix │
                                                │ Run verify  │
                                                └──────┬──────┘
                                                       │
                                                  ┌────┴────┐
                                                Pass      Fail
                                                  │         │
                                                  ▼         ▼
                                                DONE    ESCALATE
                                                           │
                                                           ▼
                                                   ┌─────────────┐
                                                   │ Document    │
                                                   │ all attempts│
                                                   │ STOP        │
                                                   │ Notify user │
                                                   └─────────────┘
```

---

## Attempt Strategies

### Attempt 1: Standard Fix

```yaml
strategy: "Apply template-based fix"

steps:
  1. Read fix template for issue type
  2. Identify insertion/modification points
  3. Apply fix
  4. Run verification:
     - npm run build
     - npm run lint
  5. Check for new errors

on_success:
  - Log fix to fixes_log.md
  - Update project_intelligence.md if new pattern

on_failure:
  - Capture error message
  - Proceed to Attempt 2
```

### Attempt 2: Context-Aware Fix

```yaml
strategy: "Analyze broader context, try alternative"

steps:
  1. Parse error message from Attempt 1
  2. Read surrounding code (5-10 lines before/after)
  3. Read related files (imports, types)
  4. Identify why Attempt 1 failed
  5. Apply alternative fix:
     - Different import path
     - Different type annotation
     - Additional code needed
  6. Run verification

on_success:
  - Log fix with "Attempt 2" note
  - Document what was different

on_failure:
  - Capture error
  - Proceed to Attempt 3
```

### Attempt 3: Pattern-Based Fix

```yaml
strategy: "Use learned patterns from codebase"

steps:
  1. Read project_intelligence.md
  2. Search codebase for similar working code
  3. Identify pattern that works
  4. Apply pattern-based fix
  5. Run verification

on_success:
  - Log fix with pattern reference
  - Update project_intelligence.md

on_failure:
  - Document all 3 attempts
  - Generate escalation report
  - STOP and notify user
```

---

## Verification Commands

### For TypeScript/JavaScript Projects

```bash
# Build verification (catches type errors)
npm run build

# Lint verification (catches style issues)
npm run lint

# Type check only (faster)
npx tsc --noEmit

# Test run (if tests exist)
npx vitest run
```

### Success Criteria

```yaml
verification_pass:
  - Build exits with code 0
  - No new TypeScript errors
  - No new lint errors
  - Existing tests still pass
```

### Verification Output Parsing

```typescript
// Parse build output for errors
const buildOutput = await runBuild();

if (buildOutput.exitCode !== 0) {
  // Extract error details
  const errors = parseBuildErrors(buildOutput.stderr);
  // errors: [{ file, line, message }]
  return { success: false, errors };
}

return { success: true };
```

---

## Fix Application

### Code Modification Pattern

```typescript
// Read original file
const original = await readFile(filePath);

// Find insertion point
const insertionPoint = findInsertionPoint(original, pattern);

// Generate fix code
const fixCode = generateFix(template, context);

// Apply modification
const modified = applyModification(original, insertionPoint, fixCode);

// Write back
await writeFile(filePath, modified);

// Verify
const result = await runVerification();

if (!result.success) {
  // Revert
  await writeFile(filePath, original);
  throw new FixFailedError(result.errors);
}
```

### Modification Types

```yaml
modification_types:
  insert_at_start:
    description: "Add import or authorization at file start"
    use_for: "Missing imports, authorization pattern"

  insert_before:
    description: "Insert code before specific line"
    use_for: "Null checks, early returns"

  wrap_with:
    description: "Wrap existing code with new code"
    use_for: "Transaction wrapping, try/catch"

  replace:
    description: "Replace specific code pattern"
    use_for: "Fix type annotations, rename"

  insert_after:
    description: "Insert code after specific pattern"
    use_for: "Add validation after parsing"
```

---

## Logging and Documentation

### Fix Log Entry Format

```yaml
# Entry in .agent/reports/fixes_log.md

entry:
  timestamp: "2026-01-25T12:00:00Z"
  issue_id: "SEC-001"
  category: "authorization"
  severity: "CRITICAL"
  file: "app/api/grading-config/route.ts"
  line: 5

  issue_description: "GET handler missing authorization check"

  fix_applied: |
    Added authorization at start of handler:
    ```typescript
    const authResult = await authorizeWithSchool(request, "gradingConfig:read");
    if ("error" in authResult) return authResult.error;
    ```

  attempts: 1
  verification: "Build passed, lint passed"

  changes:
    - type: "insert_at_start"
      code: "[authorization code]"
```

### Escalation Report Format

```markdown
# Fix Escalation Report

**Issue**: SEC-003
**File**: app/api/assessment-plans/[planId]/route.ts
**Severity**: CRITICAL

## Problem

Status update and audit log not wrapped in transaction.

## Attempts Made

### Attempt 1
- **Strategy**: Standard transaction wrapping
- **Result**: Failed
- **Error**: "Cannot read property 'status' of undefined"

### Attempt 2
- **Strategy**: Added null check before transaction
- **Result**: Failed
- **Error**: "Transaction already started"

### Attempt 3
- **Strategy**: Used $transaction callback pattern
- **Result**: Failed
- **Error**: "Audit function not compatible with transaction"

## Analysis

The audit logging function `auditFromAuth` creates its own database connection,
which conflicts with the transaction context. This requires architectural
decision on how to handle audit logging within transactions.

## Recommendation

Manual fix required. Options:
1. Modify auditFromAuth to accept transaction client
2. Move audit logging outside transaction (accept eventual consistency)
3. Use a different audit approach (event-based)

## User Action Required

Please review and decide on approach.
```

---

## Usage

### Run Auto-Fixer

```
I am the Auto-Fixer agent.

1. Read .agent/reports/comprehensive_review.md for issues
2. For each issue:
   a. Categorize (auto/semi-auto/manual)
   b. If auto: Apply fix using self-correction protocol
   c. If semi-auto: Propose fix, wait for approval
   d. If manual: Log for review
3. Run full verification after all fixes
4. Generate fixes_log.md with all changes
```

### Fix Single Issue

```
Fix issue SEC-001 in app/api/grading-config/route.ts

1. Read fix-templates.md for authorization pattern
2. Read the file
3. Apply fix at start of GET handler
4. Verify with npm run build
5. Log result
```
