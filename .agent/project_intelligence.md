# Project Intelligence & Learned Rules

*This document serves as the shared memory for the Autonomous Agents. As workflows succeed or fail, lessons learned should be recorded here to prevent regression.*

---

## 1. Project Overview

**Application**: SchoolMatica - Multi-tenant school management SaaS
**Stack**: Next.js 16 + React 19 + Prisma + PostgreSQL + Tailwind CSS 4
**Architecture**: App Router with server/client component hybrid

### Key Metrics
- **Database Models**: 29 Prisma models
- **API Routes**: 53 endpoints
- **Permission Keys**: 114+ granular permissions
- **UI Components**: 70+ React components

---

## 2. Architectural Patterns

### Multi-Tenancy (CRITICAL)

**Rule**: All database queries MUST be scoped by `schoolId`

**Pattern Hierarchy**:
```
School
├── Direct children: Subject, Teacher, ClassGroup, GradeLevel
└── Indirect children (via ClassGroup): Student, AssessmentPlan, Mark
```

**Required Implementation**:
```typescript
// Direct school-scoped query
const subjects = await prisma.subject.findMany({
  where: { schoolId: auth.user.schoolId }
});

// Indirect school-scoped query (via relation)
const students = await prisma.student.findMany({
  where: {
    classGroup: {
      schoolId: auth.user.schoolId
    }
  }
});

// Access validation for single resource
if (!hasSchoolAccess(auth, resource.classGroup.schoolId)) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

### Authentication & Authorization

**Rule**: Never rely on `x-user-email` headers in production code

**Authorization Flow**:
1. Get session via `auth()` from NextAuth
2. Fetch user with role assignments from database
3. Build permission set from all roles
4. Check specific permission for operation
5. Validate school access for multi-tenancy

**Standard Pattern**:
```typescript
const authResult = await authorizeWithSchool(request, "resource:action");
if ("error" in authResult) return authResult.error;
const { auth } = authResult;
```

### API Route Structure

**Convention**:
```
app/api/
├── resource/
│   ├── route.ts              # GET (list), POST (create)
│   └── [resourceId]/
│       └── route.ts          # GET (single), PATCH (update), DELETE
```

**Required Elements**:
1. Authorization check (first line after route handler signature)
2. Zod validation for request bodies
3. School access validation
4. Audit logging for mutations
5. Proper HTTP status codes

---

## 3. Coding Standards (Learned)

### TypeScript

**Rule**: No `any` types unless absolutely necessary and documented

```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: ProcessInput) { ... }

// ACCEPTABLE (with justification)
function handleExternalApi(response: unknown) {
  // External API response structure varies
  const data = response as ExpectedShape;
}
```

### Import Paths

**Rule**: Always use `@/` path aliases

```typescript
// BAD
import { Button } from "../../../components/ui/button";

// GOOD
import { Button } from "@/components/ui/button";
```

### Error Handling

**Rule**: Wrap fallible operations in try/catch with specific error responses

```typescript
// Pattern
try {
  const result = await riskyOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: "Operation failed" },
    { status: 500 }
  );
}
```

### Async/Await

**Rule**: Always await promises in route handlers

```typescript
// BAD
export async function GET() {
  const params = request.nextUrl.searchParams; // Not awaited if params is Promise
}

// GOOD (Next.js 15+)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

---

## 4. UI/UX Preferences

### Component Structure

**Required States**:
1. **Loading**: Show `<Skeleton />` components
2. **Error**: Show `<Alert variant="destructive">` with message
3. **Empty**: Show styled empty state with action suggestion
4. **Success**: Show `<Toaster />` notification

### Form Handling

**Standard Stack**:
- `react-hook-form` for form state
- `zod` for validation (same schemas as API)
- `@hookform/resolvers/zod` for integration

**Pattern**:
```typescript
const schema = z.object({
  name: z.string().min(1, "Required").max(255),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: "" },
});
```

### Styling

**Framework**: Tailwind CSS v4 with CSS variables
**Component Library**: ShadCN/UI (Radix primitives)
**Icons**: Lucide React

**Conventions**:
- Mobile-first responsive design
- Use Tailwind classes, avoid inline styles
- Consistent spacing (4px grid)
- Dark mode support via `dark:` variants

---

## 5. Common Pitfalls & Solutions

### Pitfall #1: Missing Authorization

**Symptom**: API route accessible without proper permission
**Check**: Every route handler starts with authorization
**Fix**: Add `authorizeWithSchool(request, "permission:key")`

### Pitfall #2: Cross-School Data Leak

**Symptom**: User can see data from other schools
**Check**: Every query has school filtering
**Fix**: Add `where: { schoolId }` or `hasSchoolAccess()` check

### Pitfall #3: N+1 Queries

**Symptom**: Many database queries for single request
**Check**: Using `include` or `select` properly
**Fix**: Batch queries with proper relations

```typescript
// BAD (N+1)
const students = await prisma.student.findMany();
for (const student of students) {
  const marks = await prisma.mark.findMany({ where: { studentId: student.id } });
}

// GOOD
const students = await prisma.student.findMany({
  include: { marks: true }
});
```

### Pitfall #4: Missing Zod Validation

**Symptom**: API accepts malformed data
**Check**: All POST/PATCH handlers validate body
**Fix**: Add Zod schema with `safeParse()`

### Pitfall #5: Audit Log Gaps

**Symptom**: No record of data changes
**Check**: All mutations call audit functions
**Fix**: Add `auditFromAuth()` after data changes

### Pitfall #6: Type Coercion Issues

**Symptom**: Prisma returns unexpected types
**Check**: JSON fields, Decimal fields, BigInt
**Fix**: Explicit type conversion

```typescript
// Prisma JSON field handling
const config = gradingConfig.phasesJson as Record<string, LevelBand[]>;

// Prisma Decimal handling
const weight = Number(assessment.rawWeight);
```

---

## 6. Performance Optimizations

### Database Queries

**Use `select` for partial data**:
```typescript
// Only fetch needed fields
const classes = await prisma.classGroup.findMany({
  where: { schoolId },
  select: {
    id: true,
    name: true,
    grade: true,
    _count: { select: { students: true } }
  }
});
```

**Use `take` and `skip` for pagination**:
```typescript
const page = Number(searchParams.get("page") ?? 1);
const limit = 20;

const items = await prisma.resource.findMany({
  where: { schoolId },
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: "desc" }
});
```

### React Components

**Use `React.memo` for pure components**:
```typescript
const StudentRow = React.memo(function StudentRow({ student }: Props) {
  return <tr>...</tr>;
});
```

**Use `useCallback` for event handlers**:
```typescript
const handleSave = useCallback(async () => {
  // Save logic
}, [dependencies]);
```

---

## 7. Security Knowledge Base

### Known Vulnerabilities (from TESTING_REPORTS.md)

| ID | Severity | Location | Issue | Status |
|----|----------|----------|-------|--------|
| SEC-001 | CRITICAL | grading-config/route.ts | No authorization | OPEN |
| SEC-002 | CRITICAL | lib/rate-limit.ts | In-memory only | OPEN |
| SEC-003 | CRITICAL | assessment-plans PATCH | No transaction | OPEN |
| SEC-004 | CRITICAL | moderation-threads POST | Missing XOR | OPEN |
| SEC-005 | HIGH | lib/rate-limit.ts | "unknown" fallback | OPEN |
| SEC-006 | HIGH | Auth system | No account lockout | OPEN |

### Security Checklist for New Code

- [ ] Authorization with correct permission key
- [ ] School access validation
- [ ] Input validation with Zod
- [ ] No sensitive data in responses
- [ ] Audit logging for mutations
- [ ] No hardcoded credentials
- [ ] Proper error messages (no internal details)

---

## 8. Testing Patterns

### Unit Test Template

```typescript
import { describe, it, expect } from "vitest";
import { functionToTest } from "@/lib/module";

describe("functionToTest", () => {
  // Happy path
  it("works with valid input", () => {
    const result = functionToTest(validInput);
    expect(result).toEqual(expectedOutput);
  });

  // Edge cases
  it("handles empty input", () => {
    expect(functionToTest([])).toEqual([]);
  });

  it("handles null/undefined", () => {
    expect(() => functionToTest(null)).toThrow();
  });

  // Boundary conditions
  it("handles maximum values", () => {
    const result = functionToTest(maxInput);
    expect(result).toBeDefined();
  });
});
```

### API Test Template

```typescript
describe("API: /api/resource", () => {
  // Auth tests
  it("returns 401 without session", async () => { ... });
  it("returns 403 without permission", async () => { ... });
  it("returns 403 for wrong school", async () => { ... });

  // Validation tests
  it("returns 400 for invalid input", async () => { ... });

  // Success tests
  it("returns 200/201 with valid request", async () => { ... });
});
```

---

## 9. Workflow History

### Successful Patterns

| Date | Pattern | Context | Outcome |
|------|---------|---------|---------|
| 2026-01-21 | Parallel testing agents | 4 agents for different workflows | 24 issues found |

### Failed Attempts & Lessons

| Date | Attempt | Why Failed | Lesson |
|------|---------|------------|--------|
| TBD | TBD | TBD | TBD |

---

## 10. Agent-Specific Notes

### For API Architect
- Check `lib/auth.ts` for permission keys before adding new ones
- Reference `app/api/classes/[classId]/route.ts` for good patterns

### For UI Builder
- Check `components/ui/` for existing components before creating
- Reference `components/markbook/markbook-grid.tsx` for complex grids

### For Test Runner
- Priority: `lib/calculations.ts` has most critical business logic
- Focus on multi-tenancy isolation tests

### For Security Auditor
- Track progress on SEC-001 through SEC-006
- Run weekly full security scans

---

## Appendix: Quick Reference

### Permission Key Format
```
resource:action
Examples: class:read, assessment:create, mark:update
```

### Role Priority (highest first)
```
1. system_admin (100)
2. admin (90)
3. smt (80)
4. hod (70)
5. teacher (60)
```

### Term Identifiers
```
T1, T2, T3, T4 (South African curriculum standard)
```

### Status Workflow
```
Draft → PendingApproval → Approved → Locked
```
