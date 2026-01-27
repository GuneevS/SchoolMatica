# Fix Templates

*Code templates for common issue fixes.*

---

## Template 1: Authorization Pattern (Next.js API Routes)

### Use Case
Add authorization to API routes missing auth checks.

### Template

```typescript
// INSERT at start of route handler, after imports

// For GET handlers:
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "{PERMISSION_KEY}");
  if ("error" in authResult) return authResult.error;
  const { auth } = authResult;

  // ... existing code
}

// For POST handlers:
export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "{PERMISSION_KEY}");
  if ("error" in authResult) return authResult.error;
  const { auth } = authResult;

  // ... existing code
}

// For PATCH handlers:
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorizeWithSchool(request, "{PERMISSION_KEY}");
  if ("error" in authResult) return authResult.error;
  const { auth } = authResult;

  // ... existing code
}

// For DELETE handlers:
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorizeWithSchool(request, "{PERMISSION_KEY}");
  if ("error" in authResult) return authResult.error;
  const { auth } = authResult;

  // ... existing code
}
```

### Required Import

```typescript
import { authorizeWithSchool } from "@/lib/auth";
```

### Permission Key Format

```
{resource}:{action}

Examples:
- gradingConfig:read
- gradingConfig:update
- class:read
- class:create
- assessment:update
- mark:update
```

### Application Steps

1. Check if `authorizeWithSchool` is imported
2. If not, add import at top of file
3. Find handler function start (`export async function {METHOD}`)
4. Insert authorization pattern after function signature
5. Replace `{PERMISSION_KEY}` with appropriate key

---

## Template 2: Multi-Tenancy Filter (Prisma Queries)

### Use Case
Add school filtering to database queries.

### Template

```typescript
// For findMany (list queries):
const data = await prisma.{model}.findMany({
  where: {
    ...existingWhere,
    schoolId: auth.user.schoolId,  // ADD THIS
  },
  // ... rest of query
});

// For indirect relations (via classGroup):
const data = await prisma.{model}.findMany({
  where: {
    ...existingWhere,
    classGroup: {
      schoolId: auth.user.schoolId,  // ADD THIS
    },
  },
});

// For findUnique with access check:
const resource = await prisma.{model}.findUnique({
  where: { id },
  include: {
    classGroup: {
      select: { schoolId: true }
    }
  }
});

if (!resource) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// ADD THIS CHECK:
if (!hasSchoolAccess(auth, resource.classGroup.schoolId)) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

### Required Import

```typescript
import { hasSchoolAccess } from "@/lib/auth";
```

### Application Steps

1. Identify query type (findMany, findUnique, etc.)
2. For list queries: Add `schoolId` to where clause
3. For single resource: Add access validation after fetch
4. Ensure `hasSchoolAccess` is imported if using access check

---

## Template 3: Transaction Wrapping

### Use Case
Wrap multi-step database operations in transaction.

### Template

```typescript
// BEFORE (no transaction):
await prisma.assessmentPlan.update({
  where: { id },
  data: { status: "approved" }
});
await prisma.auditLog.create({
  data: { entityType: "AssessmentPlan", action: "approve", ... }
});

// AFTER (with transaction):
await prisma.$transaction(async (tx) => {
  await tx.assessmentPlan.update({
    where: { id },
    data: { status: "approved" }
  });
  await tx.auditLog.create({
    data: { entityType: "AssessmentPlan", action: "approve", ... }
  });
});

// Alternative: Array syntax for simple cases
await prisma.$transaction([
  prisma.assessmentPlan.update({
    where: { id },
    data: { status: "approved" }
  }),
  prisma.auditLog.create({
    data: { entityType: "AssessmentPlan", action: "approve", ... }
  })
]);
```

### Application Steps

1. Identify multi-step database operations
2. Wrap in `prisma.$transaction(async (tx) => { ... })`
3. Replace all `prisma.` calls inside with `tx.`
4. Ensure operations that depend on each other use callback syntax

---

## Template 4: Null Check with 404 Response

### Use Case
Add null check after fetching single resource.

### Template

```typescript
// BEFORE:
const resource = await prisma.{model}.findUnique({
  where: { id }
});
return NextResponse.json(resource);  // Could be null!

// AFTER:
const resource = await prisma.{model}.findUnique({
  where: { id }
});

if (!resource) {
  return NextResponse.json(
    { error: "{Model} not found" },
    { status: 404 }
  );
}

return NextResponse.json(resource);
```

### Application Steps

1. Find `findUnique` or `findFirst` calls
2. Check if null check exists after
3. If not, add null check before using the resource
4. Return 404 with appropriate message

---

## Template 5: Zod Validation Schema

### Use Case
Add input validation to API routes.

### Template

```typescript
import { z } from "zod";

// Define schema at top of file
const create{Model}Schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  // Add fields based on model
});

const update{Model}Schema = create{Model}Schema.partial();

// Use in handler
export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "{model}:create");
  if ("error" in authResult) return authResult.error;
  const { auth } = authResult;

  // Validate body
  const body = await request.json();
  const parseResult = create{Model}Schema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  // ... create resource
}
```

### Required Import

```typescript
import { z } from "zod";
```

### Application Steps

1. Add Zod import if not present
2. Create schema based on model fields
3. Add safeParse validation after JSON parsing
4. Return 400 with validation errors on failure
5. Use `parseResult.data` for typed, validated input

---

## Template 6: Loading State (React)

### Use Case
Add loading state to components fetching data.

### Template

```tsx
// BEFORE:
function MyComponent() {
  const { data } = useSWR('/api/data', fetcher);
  return <div>{data.name}</div>;  // Crashes if data is undefined!
}

// AFTER:
function MyComponent() {
  const { data, isLoading, error } = useSWR('/api/data', fetcher);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return <Alert variant="destructive">{error.message}</Alert>;
  }

  if (!data) {
    return <EmptyState message="No data found" />;
  }

  return <div>{data.name}</div>;
}
```

### Required Imports

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
```

### Application Steps

1. Identify data fetching (useSWR, useQuery, useState+fetch)
2. Extract loading and error states
3. Add loading return with Skeleton
4. Add error return with Alert
5. Add empty state check if applicable

---

## Template 7: Error Handling (React)

### Use Case
Add error boundary or try/catch to async operations.

### Template

```tsx
// For async operations in components:
const handleSubmit = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('/api/resource', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const result = await response.json();
    toast({ title: "Success", description: "Resource created" });
    router.push(`/resources/${result.id}`);

  } catch (error) {
    console.error('Submit error:', error);
    toast({
      title: "Error",
      description: error.message || "Something went wrong",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
```

### Required Import

```tsx
import { useToast } from "@/components/ui/use-toast";
```

### Application Steps

1. Find async handlers (onClick, onSubmit, etc.)
2. Wrap in try/catch/finally
3. Add loading state management
4. Add success feedback (toast)
5. Add error feedback (toast with variant)

---

## Template 8: XOR Validation (Zod)

### Use Case
Validate that exactly one of multiple fields is provided.

### Template

```typescript
// Ensure EITHER fieldA OR fieldB is provided, but not both

const schema = z.object({
  fieldA: z.string().optional(),
  fieldB: z.string().optional(),
  // other fields...
}).refine(
  (data) => {
    const hasA = !!data.fieldA;
    const hasB = !!data.fieldB;
    return (hasA && !hasB) || (!hasA && hasB);
  },
  {
    message: "Exactly one of fieldA or fieldB must be provided",
    path: ["fieldA"]  // Or create custom error path
  }
);
```

### Example: Moderation Thread

```typescript
const createThreadSchema = z.object({
  assessmentPlanId: z.string().cuid().optional(),
  assessmentId: z.string().cuid().optional(),
  title: z.string().min(1),
  // ...
}).refine(
  (data) => {
    const hasPlan = !!data.assessmentPlanId;
    const hasAssessment = !!data.assessmentId;
    return (hasPlan && !hasAssessment) || (!hasPlan && hasAssessment);
  },
  {
    message: "Thread must be linked to either an assessment plan OR an assessment, not both",
    path: ["assessmentPlanId"]
  }
);
```

---

## Template 9: Audit Logging

### Use Case
Add audit logging to mutation operations.

### Template

```typescript
import { auditFromAuth } from "@/lib/audit";

// After successful mutation
await auditFromAuth({
  auth,
  entityType: "{ModelName}",
  entityId: resource.id,
  action: "create" | "update" | "delete" | "approve" | "reject",
  metadata: {
    // Include relevant change details
    name: resource.name,
    // For updates, include old and new values
    field: { old: oldValue, new: newValue }
  }
});
```

### Application Steps

1. Import `auditFromAuth` if not present
2. Identify mutation operations (create, update, delete)
3. Add audit call after successful database operation
4. Include relevant metadata for audit trail

---

## Template 10: Import Path Alias

### Use Case
Replace relative imports with @ path alias.

### Template

```typescript
// BEFORE:
import { Button } from "../../../components/ui/button";
import { prisma } from "../../lib/prisma";
import { authorizeWithSchool } from "../../../lib/auth";

// AFTER:
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool } from "@/lib/auth";
```

### Rules

```yaml
path_mappings:
  "@/components/*": "components/*"
  "@/lib/*": "lib/*"
  "@/app/*": "app/*"
  "@/hooks/*": "hooks/*"
  "@/stores/*": "stores/*"
  "@/types/*": "types/*"

replace_pattern:
  from: '../{n}/path/to/module'
  to: '@/path/to/module'
  where: n = number of "../" sequences
```

### Application Steps

1. Find all imports with relative paths (`../`)
2. Calculate the target path from project root
3. Replace with `@/` alias equivalent
4. Run lint to verify paths resolve correctly
