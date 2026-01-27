# Quality Analyzer

*Detect code quality issues, logic errors, and technical debt.*

---

## Purpose

Analyze code for:
1. **Type Safety** - `any` types, missing annotations, null handling
2. **Logic Errors** - Race conditions, transactions, edge cases
3. **Code Smells** - Long functions, deep nesting, duplication
4. **Performance** - N+1 queries, unnecessary re-renders
5. **Business Logic** - Calculation errors, state machine violations

---

## Category 1: Type Safety Issues

### TypeScript `any` Types

**Pattern to Find**: Explicit or implicit `any` usage

```typescript
// PROBLEMATIC (explicit any):
function process(data: any) { ... }
const result: any = fetchData();

// PROBLEMATIC (implicit any):
function process(data) { ... }  // No type annotation
const handler = (event) => { ... }  // No event type

// BETTER (proper types):
function process(data: ProcessInput): ProcessOutput { ... }
const result: FetchResponse = await fetchData();
```

**Scan Pattern**:
```bash
# Find explicit any
grep -n ": any" **/*.ts **/*.tsx

# Find function parameters without types
# Pattern: function name(param) or (param) =>
```

**Acceptable Exceptions**:
```typescript
// External API with unknown shape (with comment):
function handleExternalApi(response: unknown) {
  // External API response structure varies
  const data = response as ExpectedShape;
}

// Generic constraints:
function process<T extends Record<string, any>>(data: T) { ... }
```

### Missing Null Checks

**Pattern to Find**: Accessing potentially null values

```typescript
// PROBLEMATIC:
const user = await prisma.user.findUnique({ where: { id } });
return user.name;  // user could be null!

// CORRECT:
const user = await prisma.user.findUnique({ where: { id } });
if (!user) {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
return user.name;
```

### Missing Return Types

**Pattern to Find**: Functions without explicit return types

```typescript
// PROBLEMATIC:
async function getData() {  // No return type
  return await prisma.data.findMany();
}

// CORRECT:
async function getData(): Promise<Data[]> {
  return await prisma.data.findMany();
}
```

---

## Category 2: Logic Errors

### Race Conditions

**Pattern to Find**: Async operations without proper synchronization

```typescript
// PROBLEMATIC (race condition in status update):
const plan = await prisma.assessmentPlan.findUnique({ where: { id } });
// Another request could modify plan here!
await prisma.assessmentPlan.update({
  where: { id },
  data: { status: "approved" }
});

// CORRECT (use transaction):
await prisma.$transaction(async (tx) => {
  const plan = await tx.assessmentPlan.findUnique({ where: { id } });
  if (plan.status !== "pending") {
    throw new Error("Invalid state transition");
  }
  await tx.assessmentPlan.update({
    where: { id },
    data: { status: "approved" }
  });
});
```

### Missing Transactions

**Pattern to Find**: Multi-step database operations without transaction

```typescript
// PROBLEMATIC (partial failure possible):
await prisma.user.create({ data: userData });
await prisma.profile.create({ data: profileData });
// If profile creation fails, user exists without profile!

// CORRECT:
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData })
]);
```

### Async/Await Issues

```typescript
// PROBLEMATIC (promise not awaited):
async function process() {
  doAsyncWork();  // Missing await!
  return "done";  // Returns before work completes
}

// PROBLEMATIC (forEach with async):
items.forEach(async (item) => {  // Doesn't wait for completion
  await processItem(item);
});

// CORRECT:
await Promise.all(items.map(item => processItem(item)));
// Or for sequential:
for (const item of items) {
  await processItem(item);
}
```

### State Machine Violations

```typescript
// PROBLEMATIC (invalid transition allowed):
async function updateStatus(planId: string, newStatus: string) {
  await prisma.assessmentPlan.update({
    where: { id: planId },
    data: { status: newStatus }  // No validation!
  });
}

// CORRECT (validate transitions):
const VALID_TRANSITIONS = {
  draft: ["pendingApproval"],
  pendingApproval: ["approved", "draft"],  // Can reject back to draft
  approved: ["locked"],
  locked: []  // Terminal state
};

async function updateStatus(planId: string, newStatus: Status) {
  const plan = await prisma.assessmentPlan.findUnique({ where: { id: planId } });
  if (!VALID_TRANSITIONS[plan.status].includes(newStatus)) {
    throw new Error(`Invalid transition: ${plan.status} -> ${newStatus}`);
  }
  // ... proceed with update
}
```

---

## Category 3: Code Smells

### Long Functions

**Threshold**: Functions > 50 lines

```typescript
// PROBLEMATIC:
async function processData() {
  // 100+ lines of code
  // Multiple responsibilities
  // Hard to test
}

// BETTER (extract functions):
async function processData() {
  const validated = validateInput(data);
  const transformed = transformData(validated);
  const result = await saveData(transformed);
  return formatResponse(result);
}
```

### Deep Nesting

**Threshold**: Nesting > 4 levels

```typescript
// PROBLEMATIC:
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {  // 4+ levels deep
        // Logic here
      }
    }
  }
}

// BETTER (early returns):
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
if (!condition4) return;
// Logic here
```

### Code Duplication

**Threshold**: 6+ lines duplicated

```typescript
// PROBLEMATIC (duplicated in multiple files):
const authResult = await authorizeWithSchool(request, "resource:read");
if ("error" in authResult) return authResult.error;
const { auth } = authResult;
const schoolId = auth.user.schoolId;
// ... repeated in 50+ files

// BETTER (extract to utility):
// Already done well in SchoolMatica with authorizeWithSchool
```

### Magic Numbers/Strings

```typescript
// PROBLEMATIC:
if (user.role === 60) {  // What is 60?
if (attempts > 5) {  // Why 5?
setTimeout(fn, 300000);  // What is this timeout?

// BETTER:
const ROLE_PRIORITY = { teacher: 60, hod: 70, ... };
const MAX_LOGIN_ATTEMPTS = 5;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes

if (user.role === ROLE_PRIORITY.teacher) { ... }
if (attempts > MAX_LOGIN_ATTEMPTS) { ... }
setTimeout(fn, SESSION_TIMEOUT_MS);
```

---

## Category 4: Performance Issues

### N+1 Queries

```typescript
// PROBLEMATIC (N+1 queries):
const students = await prisma.student.findMany();
for (const student of students) {
  const marks = await prisma.mark.findMany({  // Query per student!
    where: { studentId: student.id }
  });
  student.marks = marks;
}

// CORRECT (single query with include):
const students = await prisma.student.findMany({
  include: { marks: true }  // Loaded in same query
});
```

### Missing Pagination

```typescript
// PROBLEMATIC (loads all records):
const allStudents = await prisma.student.findMany();
// Could be thousands of records!

// CORRECT (paginated):
const students = await prisma.student.findMany({
  take: 50,
  skip: (page - 1) * 50,
  orderBy: { name: 'asc' }
});
```

### Unnecessary Re-renders (React)

```typescript
// PROBLEMATIC:
function StudentList({ students }) {
  // Creates new function on every render
  const handleClick = (id) => { ... };

  return students.map(s => (
    <StudentRow
      key={s.id}
      student={s}
      onClick={handleClick}  // New function = re-render
    />
  ));
}

// BETTER:
const StudentRow = React.memo(function StudentRow({ student, onClick }) {
  return <tr onClick={() => onClick(student.id)}>...</tr>;
});

function StudentList({ students }) {
  const handleClick = useCallback((id) => { ... }, []);
  // ...
}
```

---

## Category 5: Business Logic Issues

### Calculation Precision

```typescript
// PROBLEMATIC (floating point issues):
const percentage = 10.1 + 20.2;  // 30.299999999999997

// CORRECT:
const percentage = Number((10.1 + 20.2).toFixed(2));  // 30.30

// For financial calculations, use Decimal.js or similar
import Decimal from 'decimal.js';
const result = new Decimal(10.1).plus(20.2).toNumber();
```

### Weight Normalization

```typescript
// PROBLEMATIC (weights don't sum to 100%):
const weights = [30, 40, 25];  // Sum = 95%

// CORRECT (normalize):
function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  return weights.map(w => (w / sum) * 100);
}
```

### Edge Case Handling

```typescript
// PROBLEMATIC (no edge case handling):
function calculateAverage(marks: number[]): number {
  return marks.reduce((a, b) => a + b) / marks.length;
  // Fails if marks is empty!
}

// CORRECT:
function calculateAverage(marks: number[]): number {
  if (marks.length === 0) return 0;
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}
```

---

## Scan Workflow

```yaml
workflow:
  step_1_types:
    scan: All TypeScript files
    check: any types, missing annotations
    severity: MEDIUM

  step_2_logic:
    scan: All source files
    check: Race conditions, transactions, async issues
    severity: HIGH

  step_3_smells:
    scan: All source files
    check: Long functions, nesting, duplication
    severity: LOW-MEDIUM

  step_4_performance:
    scan: Database queries, React components
    check: N+1 queries, re-renders
    severity: MEDIUM

  step_5_business:
    scan: Calculation and business logic files
    check: Precision, edge cases, state machines
    severity: HIGH

  step_6_report:
    generate: quality_analysis.md
```

---

## Output: quality_analysis.md

```markdown
# Code Quality Analysis Report

**Generated**: 2026-01-25T12:00:00Z
**Files Analyzed**: 250
**Overall Health Score**: 7.5/10

## Summary by Category

| Category | Issues | Health |
|----------|--------|--------|
| Type Safety | 12 | 8/10 |
| Logic Errors | 5 | 7/10 |
| Code Smells | 18 | 7/10 |
| Performance | 8 | 8/10 |
| Business Logic | 3 | 9/10 |

## Critical Findings

### QUAL-001: Race Condition in Status Transition

**Severity**: HIGH
**File**: `app/api/assessment-plans/[planId]/route.ts:45`

**Issue**: Status update and audit log are not wrapped in transaction.

**Remediation**:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.assessmentPlan.update({ ... });
  await tx.auditLog.create({ ... });
});
```

---

## Recommendations

1. Add transaction wrapping to all multi-step operations
2. Replace `any` types with proper interfaces
3. Extract common patterns to shared utilities
4. Add pagination to all list endpoints
```
