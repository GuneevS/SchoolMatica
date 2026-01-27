# Autonomous Testing Workflow

*Comprehensive self-testing pipeline with automatic failure recovery*

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS TESTING PIPELINE                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
   ┌───────────┐           ┌───────────┐           ┌───────────┐
   │  BUILD    │           │  LINT     │           │  TYPE     │
   │  CHECK    │           │  CHECK    │           │  CHECK    │
   └─────┬─────┘           └─────┬─────┘           └─────┬─────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │  UNIT TESTS     │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  INTEGRATION    │
                        │  TESTS          │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  SECURITY       │
                        │  SCAN           │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  PERFORMANCE    │
                        │  CHECK          │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  REPORT         │
                        │  GENERATION     │
                        └─────────────────┘
```

---

## Stage 1: Build Verification

**Purpose**: Ensure code compiles without errors

**Command**:
```bash
npm run build
```

**Success Criteria**:
- Exit code 0
- No TypeScript errors
- No Prisma schema errors

**On Failure - Self-Healing Protocol**:

```yaml
error_patterns:
  missing_import:
    pattern: "Cannot find module '(.+)'"
    action: "Add import statement for the module"
    max_attempts: 3

  type_mismatch:
    pattern: "Type '(.+)' is not assignable to type '(.+)'"
    action: "Fix type annotation or cast"
    max_attempts: 3

  missing_property:
    pattern: "Property '(.+)' does not exist on type '(.+)'"
    action: "Add property to interface or fix property name"
    max_attempts: 3

  prisma_error:
    pattern: "Prisma Client (.*)"
    action: "Run prisma generate"
    max_attempts: 1

self_healing_loop:
  1. Parse error output
  2. Match error pattern
  3. Identify file and line
  4. Apply fix
  5. Re-run build
  6. If still failing after 3 attempts: ESCALATE
```

---

## Stage 2: Lint Verification

**Purpose**: Ensure code follows project standards

**Command**:
```bash
npm run lint
```

**Auto-Fix Attempt**:
```bash
npm run lint -- --fix
```

**Critical Lint Rules** (must pass):
- No `any` types (`@typescript-eslint/no-explicit-any`)
- No unused variables (`@typescript-eslint/no-unused-vars`)
- Proper import order (`import/order`)
- No console.log in production code

**On Failure**:
```yaml
auto_fixable:
  - Import order
  - Trailing commas
  - Semicolons
  - Whitespace

manual_review:
  - Type annotations
  - Unused variables (may need removal)
  - Complex type issues
```

---

## Stage 3: Type Checking

**Purpose**: Strict TypeScript validation

**Command**:
```bash
npx tsc --noEmit
```

**Focus Areas**:
- All function parameters have types
- All return types are explicit
- No implicit `any`
- Proper null handling

**Common Fixes**:
```typescript
// Fix: Missing parameter type
// Before
function process(data) { ... }
// After
function process(data: ProcessInput) { ... }

// Fix: Missing return type
// Before
async function getData() { ... }
// After
async function getData(): Promise<DataType> { ... }

// Fix: Null handling
// Before
const value = obj.property; // Object is possibly null
// After
const value = obj?.property ?? defaultValue;
```

---

## Stage 4: Unit Tests

**Purpose**: Verify individual functions and modules

**Command**:
```bash
npx vitest run
```

**Priority Test Files**:
```yaml
critical:
  - lib/calculations.test.ts
  - lib/auth.test.ts

high:
  - lib/domain/*.test.ts
  - lib/markbook.test.ts

medium:
  - components/**/*.test.tsx
```

**Test Categories**:

### Calculation Tests
```typescript
describe("calculateStudentSba", () => {
  // Happy path
  it("calculates SBA with all marks present");

  // Edge cases
  it("handles empty assessments array");
  it("handles all absent marks");
  it("handles single assessment");
  it("handles marks exceeding total");

  // Weight normalization
  it("renormalizes weights when marks missing");
  it("handles zero total weight");
});
```

### Authorization Tests
```typescript
describe("authorize", () => {
  it("returns auth context for valid permission");
  it("returns 403 for missing permission");
  it("returns 401 for no session");
});

describe("hasSchoolAccess", () => {
  it("returns true for user's school");
  it("returns false for other schools");
  it("returns true for system admin");
});
```

**On Test Failure**:
```yaml
analysis_steps:
  1. Read test expectation
  2. Read actual output
  3. Identify discrepancy
  4. Check implementation code
  5. Determine if test or code is wrong

fix_options:
  - Update implementation if logic is wrong
  - Update test if expectation is incorrect
  - Add edge case handling if missing

escalation_triggers:
  - Multiple tests failing in same area
  - Core business logic affected
  - Same failure after 3 fix attempts
```

---

## Stage 5: Integration Tests

**Purpose**: Verify API routes work end-to-end

**Test Structure**:
```typescript
describe("API Integration: Assessment Plans", () => {
  let testSchool: School;
  let testUser: AppUser;
  let authCookie: string;

  beforeAll(async () => {
    // Setup test data
    testSchool = await createTestSchool();
    testUser = await createTestUser(testSchool.id);
    authCookie = await getAuthCookie(testUser);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe("GET /api/assessment-plans", () => {
    it("returns only plans from user's school", async () => {
      const response = await fetch("/api/assessment-plans", {
        headers: { Cookie: authCookie }
      });

      expect(response.status).toBe(200);
      const plans = await response.json();
      plans.forEach(plan => {
        expect(plan.classGroup.schoolId).toBe(testSchool.id);
      });
    });
  });

  describe("POST /api/assessment-plans", () => {
    it("creates plan with proper authorization", async () => {
      const response = await fetch("/api/assessment-plans", {
        method: "POST",
        headers: {
          Cookie: authCookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Test Plan",
          classGroupId: testClassGroup.id,
          year: 2026,
          termCount: 4
        })
      });

      expect(response.status).toBe(201);
    });
  });
});
```

**Multi-Tenancy Tests**:
```typescript
describe("Multi-tenancy Isolation", () => {
  let schoolA: School, schoolB: School;
  let userA: AppUser, userB: AppUser;

  it("prevents cross-school data access", async () => {
    // Create resource in School B
    const resource = await createResourceInSchool(schoolB.id);

    // User A tries to access
    const response = await fetch(`/api/resources/${resource.id}`, {
      headers: { Cookie: userACookie }
    });

    expect(response.status).toBe(403);
  });
});
```

---

## Stage 6: Security Scan

**Purpose**: Detect security vulnerabilities

**Automated Checks**:
```bash
# Check for missing authorization
grep -L "authorizeWithSchool\|authorize" app/api/**/route.ts

# Check for any types
grep -n ": any" app/ lib/ --include="*.ts"

# Check npm vulnerabilities
npm audit

# Check for hardcoded secrets
grep -rn "password=\|secret=\|api_key=" . --include="*.ts" --include="*.tsx"
```

**Security Test Suite**:
```typescript
describe("Security: Authorization", () => {
  it("all API routes require authentication", async () => {
    const routes = getAllApiRoutes();
    for (const route of routes) {
      const response = await fetch(route.url, { method: route.method });
      expect([401, 403]).toContain(response.status);
    }
  });
});

describe("Security: Data Isolation", () => {
  it("users cannot access other schools data", async () => {
    // Test each resource type
  });
});

describe("Security: Input Validation", () => {
  it("rejects malformed input", async () => {
    const maliciousInputs = [
      { name: "<script>alert('xss')</script>" },
      { id: "'; DROP TABLE users; --" },
      { data: { "__proto__": { "admin": true } } }
    ];
    // Test each route with malicious input
  });
});
```

---

## Stage 7: Performance Check

**Purpose**: Identify performance issues

**Checks**:
```yaml
database_queries:
  - Count queries per request (target: <5)
  - Identify N+1 patterns
  - Check for missing indexes

response_times:
  - API routes target: <200ms
  - Page loads target: <1000ms
  - Database queries target: <50ms

bundle_size:
  - Check for large imports
  - Verify code splitting
  - Monitor chunk sizes
```

**Performance Test Example**:
```typescript
describe("Performance: API Response Times", () => {
  it("GET /api/classes responds within 200ms", async () => {
    const start = performance.now();
    await fetch("/api/classes", { headers: { Cookie: authCookie } });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(200);
  });
});

describe("Performance: Query Optimization", () => {
  it("uses proper includes instead of N+1", async () => {
    // Enable query logging
    // Make request
    // Check query count
    expect(queryCount).toBeLessThan(5);
  });
});
```

---

## Stage 8: Report Generation

**Output Format**:
```json
{
  "timestamp": "2026-01-24T12:00:00Z",
  "duration_ms": 45000,
  "stages": {
    "build": { "status": "passed", "duration_ms": 15000 },
    "lint": { "status": "passed", "duration_ms": 5000 },
    "types": { "status": "passed", "duration_ms": 8000 },
    "unit_tests": { "status": "passed", "tests": 42, "coverage": 78.5 },
    "integration_tests": { "status": "passed", "tests": 15 },
    "security_scan": { "status": "warning", "findings": 2 },
    "performance": { "status": "passed" }
  },
  "overall": "PASSED_WITH_WARNINGS",
  "action_items": [
    {
      "severity": "warning",
      "stage": "security_scan",
      "description": "2 medium severity findings",
      "details": ["SEC-001", "SEC-002"]
    }
  ]
}
```

---

## Self-Healing Decision Tree

```
Error Detected
     │
     ▼
Is it a known pattern?
     │
   ┌─┴─┐
   │   │
  YES  NO
   │   │
   ▼   ▼
Apply  Analyze error
fix    │
   │   ▼
   ▼   Can categorize?
Re-run    │
test   ┌─┴─┐
   │   │   │
   ▼  YES  NO
Pass?  │   │
   │   ▼   ▼
 ┌─┴─┐ Try  ESCALATE
 │   │ fix  to user
YES  NO │
 │   │  ▼
 ▼   ▼ Re-run
Done Attempt < 3?
        │
      ┌─┴─┐
      │   │
     YES  NO
      │   │
      ▼   ▼
    Retry ESCALATE
```

---

## Trigger Conditions

```yaml
triggers:
  # Run on every file change
  on_file_change:
    - build_check
    - lint_check
    - type_check

  # Run before commit
  pre_commit:
    - all_stages

  # Run on schedule (nightly)
  scheduled:
    - all_stages
    - full_coverage_report

  # Run on PR creation
  pull_request:
    - all_stages
    - security_deep_scan
```

---

## Integration with Claude Code

To invoke this workflow:
```bash
# Run full testing pipeline
claude --workflow autonomous_testing

# Run specific stage
claude --workflow autonomous_testing --stage security_scan

# Run with verbose output
claude --workflow autonomous_testing --verbose
```
