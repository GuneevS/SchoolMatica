# Continuous Code Review Workflow

*Automated code review with quality gates and improvement suggestions*

---

## Workflow Triggers

```yaml
triggers:
  automatic:
    - On file save (lightweight checks)
    - On git stage (pre-commit checks)
    - On PR creation (full review)

  manual:
    - User requests review
    - Before deployment
    - Weekly comprehensive scan
```

---

## Review Phases

### Phase 1: Static Analysis (Instant)

**Runs on**: Every file change

```yaml
checks:
  typescript:
    - No 'any' types
    - Proper null handling
    - Exhaustive switch statements
    - No implicit returns

  imports:
    - Use @/ path aliases
    - No circular dependencies
    - Proper module boundaries

  naming:
    - camelCase for variables/functions
    - PascalCase for components/types
    - SCREAMING_SNAKE for constants
```

**Automated Feedback**:
```typescript
// Example inline comment generation
// WARNING: Type 'any' detected at line 45
// SUGGESTION: Use 'unknown' and narrow with type guards

// WARNING: Missing null check at line 67
// SUGGESTION: Add optional chaining: data?.value

// WARNING: Import should use @/ alias
// BEFORE: import { Button } from "../../../components/ui/button"
// AFTER:  import { Button } from "@/components/ui/button"
```

---

### Phase 2: Pattern Compliance (Pre-commit)

**Runs on**: Git stage / pre-commit

#### API Route Patterns

```yaml
required_patterns:
  authorization:
    pattern: |
      const authResult = await authorizeWithSchool(request, "...");
      if ("error" in authResult) return authResult.error;
    exception: "Only /api/auth/* and /api/health routes exempt"

  school_filtering:
    pattern: |
      where: { schoolId: ... }
      // OR
      if (!hasSchoolAccess(auth, schoolId)) ...

  input_validation:
    pattern: |
      const parseResult = schema.safeParse(body);
      if (!parseResult.success) return ...

  audit_logging:
    required_for: ["POST", "PATCH", "PUT", "DELETE"]
    pattern: |
      await auditFromAuth({ auth, entityType, entityId, action, ... });
```

#### Component Patterns

```yaml
required_patterns:
  props_typing:
    pattern: |
      interface Props { ... }
      export function Component(props: Props) { ... }

  loading_states:
    pattern: |
      if (isLoading) return <Skeleton />

  error_states:
    pattern: |
      if (error) return <Alert variant="destructive">...</Alert>

  empty_states:
    pattern: |
      if (data.length === 0) return <EmptyState />
```

---

### Phase 3: Security Review (Pre-commit + PR)

**Focus Areas**:

#### Authorization Audit
```yaml
checks:
  - Every API route has authorization check
  - Permission keys exist in PERMISSION_KEYS
  - School access validated for all data
  - No privilege escalation paths

scan_command: |
  # Find routes without authorization
  for file in app/api/**/route.ts; do
    if ! grep -q "authorizeWithSchool\|authorize" "$file"; then
      echo "SECURITY: Missing authorization in $file"
    fi
  done
```

#### Input Validation Audit
```yaml
checks:
  - All request bodies validated with Zod
  - URL parameters validated
  - No SQL injection possible
  - No XSS vulnerabilities

validation_patterns:
  good: |
    const schema = z.object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
    });
    const result = schema.safeParse(body);

  bad: |
    const { name, email } = await request.json();
    // Direct use without validation
```

#### Data Exposure Audit
```yaml
checks:
  - Passwords never in responses
  - Sensitive fields excluded
  - Error messages sanitized

sensitive_fields:
  - passwordHash
  - resetToken
  - resetTokenExpiry
  - apiKey
  - secret
```

---

### Phase 4: Quality Analysis (PR)

#### Complexity Metrics
```yaml
thresholds:
  cyclomatic_complexity: 10
  function_length: 50 lines
  file_length: 300 lines
  nesting_depth: 4

recommendations:
  high_complexity: "Consider breaking into smaller functions"
  long_function: "Extract helper functions"
  deep_nesting: "Use early returns to flatten"
```

#### Code Duplication
```yaml
detection:
  minimum_lines: 6
  minimum_tokens: 50

recommendations:
  duplicate_found: |
    Found similar code in:
    - {file1}:{line1}
    - {file2}:{line2}

    Consider extracting to shared utility:
    ```typescript
    // lib/utils/shared-function.ts
    export function sharedFunction() { ... }
    ```
```

#### Performance Concerns
```yaml
patterns_to_flag:
  n_plus_one:
    pattern: "forEach.*await.*findUnique"
    suggestion: "Use findMany with proper includes"

  missing_memo:
    pattern: "export function.*map.*filter"
    suggestion: "Consider useMemo for expensive computations"

  redundant_renders:
    pattern: "useState.*onChange.*setState"
    suggestion: "Consider useCallback for event handlers"
```

---

## Review Report Format

### Inline Comments (for IDEs)

```typescript
// file: app/api/resources/route.ts

export async function GET(request: NextRequest) {
  // ⚠️ REVIEW: Missing authorization check
  // REQUIRED: Add authorizeWithSchool(request, "resource:read")

  const data = await prisma.resource.findMany();
  // ⚠️ REVIEW: Missing school filtering
  // REQUIRED: Add where: { schoolId } clause

  return NextResponse.json(data);
}
```

### Summary Report (for PRs)

```markdown
## Code Review Summary

### Overall Score: 7/10

### Critical Issues (Must Fix)
- [ ] **SEC-001**: Missing authorization in `app/api/resources/route.ts`
- [ ] **SEC-002**: No school filtering in query

### High Priority (Should Fix)
- [ ] **PERF-001**: Potential N+1 query at `app/api/classes/route.ts:45`
- [ ] **TYPE-001**: Using 'any' type at `lib/utils.ts:23`

### Medium Priority (Consider)
- [ ] **STYLE-001**: Function exceeds 50 lines at `components/markbook/grid.tsx:78`
- [ ] **DRY-001**: Similar code found in 3 files

### Positive Findings
- ✅ Good error handling in API routes
- ✅ Proper TypeScript usage throughout
- ✅ Consistent naming conventions

### Recommendations
1. Add unit tests for new calculation functions
2. Consider extracting shared validation logic
3. Add loading states to new components
```

---

## Auto-Fix Capabilities

### Safe Auto-Fixes (Apply Automatically)

```yaml
auto_fixable:
  import_order:
    - Sort imports alphabetically
    - Group by external/internal

  path_aliases:
    - Replace relative with @/ aliases

  trailing_commas:
    - Add trailing commas in multiline

  semicolons:
    - Add/remove per project config

  whitespace:
    - Fix indentation
    - Remove trailing spaces
```

### Suggested Fixes (Require Approval)

```yaml
suggest_only:
  type_annotations:
    reason: "May change behavior if types are wrong"

  null_checks:
    reason: "Logic may intentionally handle null differently"

  refactoring:
    reason: "Structural changes need human review"

  security_fixes:
    reason: "May have broader implications"
```

---

## Integration Points

### VS Code Integration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### Git Hooks

```bash
#!/bin/bash
# .husky/pre-commit

echo "Running code review checks..."

# Stage 1: Static analysis
npm run lint || exit 1

# Stage 2: Type check
npx tsc --noEmit || exit 1

# Stage 3: Pattern compliance
node scripts/check-patterns.js || exit 1

echo "All checks passed!"
```

### CI/CD Integration

```yaml
# .github/workflows/review.yml
name: Code Review

on:
  pull_request:
    branches: [main, develop]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run code review
        run: npm run review
      - name: Post review comments
        if: failure()
        run: node scripts/post-review-comments.js
```

---

## Escalation Criteria

### Block Merge (Critical)
```yaml
blockers:
  - Missing authorization on API routes
  - Exposed sensitive data in responses
  - SQL injection vulnerability
  - Cross-school data access possible
  - Failing tests
```

### Require Approval (High)
```yaml
require_approval:
  - Schema changes
  - Permission key additions
  - Security-related changes
  - Core calculation logic changes
```

### Warn Only (Medium/Low)
```yaml
warnings:
  - Code complexity above threshold
  - Missing tests for new code
  - Documentation gaps
  - Style inconsistencies
```

---

## Knowledge Feedback Loop

### Learning from Reviews

```yaml
pattern_tracking:
  on_issue_found:
    - Log issue type and location
    - Track frequency
    - Update patterns if recurring

  on_fix_applied:
    - Record fix pattern
    - Add to auto-fix if safe
    - Update documentation

monthly_analysis:
  - Most common issues
  - Areas needing attention
  - Effectiveness of auto-fixes
  - New patterns to detect
```

### Updating Project Intelligence

```markdown
# When a new pattern is identified, add to project_intelligence.md:

## Review Patterns Learned

### [Date] - Pattern Name
- **Detection Rule**: How to identify
- **Why It Matters**: Impact
- **Fix Template**: Standard solution
- **Auto-fixable**: Yes/No
```
