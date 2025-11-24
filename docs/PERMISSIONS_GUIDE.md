# Production-Grade Permissions System

## Overview

This application now implements a comprehensive, production-grade role-based access control (RBAC) system with school-scoped permissions. The system ensures that:

- **Admin users** have full access across all schools
- **Other roles** (Teacher, HOD, SMT) have access only within their assigned school(s)
- **All resources** are properly scoped and validated
- **API routes** enforce authorization checks
- **UI components** conditionally render based on permissions

## Architecture

### Core Components

1. **Database Schema** (`prisma/schema.prisma`)
   - `RoleDefinition`: Defines roles (Teacher, HOD, SMT, Admin)
   - `PermissionDefinition`: Defines granular permissions (e.g., `class:read`, `student:create`)
   - `RolePermission`: Maps permissions to roles
   - `UserRoleAssignment`: Assigns roles to users with optional school scope

2. **Authorization Library** (`lib/auth.ts`)
   - `getAuthContext()`: Retrieves user auth context
   - `authorize()`: Basic permission check
   - `authorizeWithSchool()`: Permission + school scope validation
   - Helper functions for school access validation

3. **Client-Side Permissions** (`lib/permissions-client.ts`)
   - React hooks and helpers for UI permission checks
   - Feature access gates
   - Resource permission helpers

## Roles and Permissions

### Role Hierarchy

| Role | Priority | Description | School Scope |
|------|----------|-------------|--------------|
| System Administrator | 100 | Full cross-school access | All schools |
| SMT | 30 | School management team | Single school |
| HOD | 20 | Head of department | Single school |
| Teacher | 10 | Class educator | Single school |

### Permission Categories

Permissions follow the pattern: `resource:action`

#### Resources
- `assessmentPlan`, `assessment`, `assessmentDocument`
- `class`, `student`, `teacher`
- `school`, `subject`, `gradeLevel`
- `mark`, `report`, `registration`
- `moderation`, `timetable`, `template`
- `audit`, `system`

#### Actions
- `read` - View resources
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Advanced management (classes, schools)
- `approve` - Approve workflows (assessments)
- `decide` - Make decisions (documents, registrations)
- `admin` - System-wide admin access

### Permission Matrix

#### Teacher
- ✅ Read classes, students, teachers, subjects
- ✅ Create/update marks, assessments, assessment plans
- ✅ Generate reports
- ✅ Create/update students (within their classes)
- ❌ Delete resources
- ❌ Approve assessment plans
- ❌ Manage school settings

#### HOD (Head of Department)
- ✅ All Teacher permissions
- ✅ Approve assessment plans
- ✅ Decide on assessment documents
- ✅ Create/update/delete classes and subjects
- ✅ Manage teachers
- ✅ View audit logs
- ✅ Resolve moderation threads
- ❌ Delete schools
- ❌ Access other schools

#### SMT (School Management Team)
- ✅ All HOD permissions
- ✅ Delete most resources within their school
- ✅ Publish reports
- ✅ Manage grade levels and timetables
- ✅ Update school settings
- ❌ Create/delete schools
- ❌ Access other schools

#### System Administrator
- ✅ **Everything** - Full access to all schools and resources
- ✅ Create/delete schools
- ✅ Manage users across schools
- ✅ View system-wide audit logs

## Usage Guide

### Server-Side API Routes

Always authorize requests at the beginning of your API route:

```typescript
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check permission
  const result = await authorizeWithSchool(request, "class:read");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  
  // Validate school access if needed
  const schoolId = searchParams.get("schoolId");
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  
  // Build scoped query
  const whereClause = isSystemAdmin(auth)
    ? { schoolId } // Admin can access any school
    : { schoolId: { in: getUserSchoolIds(auth) } }; // Others limited to their schools
  
  // ... rest of your code
}
```

### Client-Side Components

Fetch auth context and use permission helpers:

```typescript
"use client";

import { useEffect, useState } from "react";
import { hasPermission, getFeatureAccess } from "@/lib/permissions-client";
import type { ClientAuthContext } from "@/lib/permissions-client";

export function MyComponent() {
  const [auth, setAuth] = useState<ClientAuthContext | null>(null);
  
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(setAuth);
  }, []);
  
  const canCreateClass = hasPermission(auth, "class:create");
  const features = getFeatureAccess(auth);
  
  return (
    <div>
      {canCreateClass && (
        <button>Create Class</button>
      )}
      
      {features.canManageSchools && (
        <AdminPanel />
      )}
    </div>
  );
}
```

### Database Queries

Always scope queries by school for non-admin users:

```typescript
import { isSystemAdmin, getUserSchoolIds } from "@/lib/auth";

// In your API route after authorization
const whereClause = isSystemAdmin(auth) 
  ? {} // Admin sees everything
  : { schoolId: { in: getUserSchoolIds(auth) } };

const data = await prisma.myModel.findMany({
  where: whereClause,
  // ...
});
```

## Setup Instructions

### 1. Initial Setup

Run the seed script to populate roles and permissions:

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

This creates:
- 4 roles: Teacher, HOD, SMT, Admin
- 100+ permissions covering all resources
- Sample users with different roles
- Admin user: `admin@schoolmatica.com`

### 2. Migrate Existing Database

If you have an existing database, run the migration script:

```bash
npx tsx prisma/migrate-permissions.ts
```

This will:
- Create all new permission definitions
- Set up the admin role
- Preserve existing data

### 3. Configure Authentication

Set the user email header in development:

```bash
# In your .env or request headers
x-user-email: admin@schoolmatica.com
```

Or use environment variable:

```bash
DEFAULT_USER_EMAIL=admin@schoolmatica.com
```

### 4. Test Permission Levels

Test with different users:

```bash
# System Admin
x-user-email: admin@schoolmatica.com

# SMT
x-user-email: thuli.nkadimeng@schoolmatica.com

# HOD
x-user-email: bongani.khuzwayo@schoolmatica.com

# Teacher
x-user-email: naledi.dlamini@schoolmatica.com
```

## Security Best Practices

### 1. Always Validate School Access

```typescript
// ❌ WRONG - No school validation
const class = await prisma.classGroup.findUnique({ where: { id } });

// ✅ CORRECT - Validate school access
const class = await prisma.classGroup.findUnique({ 
  where: { id },
  include: { school: true }
});
if (!hasSchoolAccess(auth, class.schoolId)) {
  return error403();
}
```

### 2. Use Fine-Grained Permissions

```typescript
// ❌ WRONG - Too broad
if (auth.user.role === "Teacher") { ... }

// ✅ CORRECT - Specific permission check
if (hasPermission(auth, "mark:update")) { ... }
```

### 3. Server-Side Authorization Only

```typescript
// ❌ WRONG - Client-side only
// Client code can be bypassed

// ✅ CORRECT - Server validates EVERY request
export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "student:create");
  if ("error" in result) return result.error;
  // ...
}
```

### 4. Audit Important Actions

```typescript
// Log security-relevant actions
await prisma.auditLog.create({
  data: {
    schoolId,
    entityType: "Student",
    entityId: student.id,
    action: "STUDENT_DELETED",
    actorRole: getPrimaryRoleName(auth),
    actorName: auth.user.displayName,
  },
});
```

## Common Patterns

### Pattern 1: Resource Creation

```typescript
export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "class:create");
  if ("error" in result) return result.error;
  
  const { auth } = result;
  const json = await request.json();
  
  // Validate school access
  const subject = await prisma.subject.findUnique({ 
    where: { id: json.subjectId } 
  });
  
  if (!hasSchoolAccess(auth, subject.schoolId)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  
  // Create resource
  const resource = await prisma.classGroup.create({ ... });
  return NextResponse.json(resource, { status: 201 });
}
```

### Pattern 2: List with School Filtering

```typescript
export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "student:read");
  if ("error" in result) return result.error;
  
  const { auth } = result;
  
  // Build where clause
  const whereClause = isSystemAdmin(auth)
    ? {} // Admin sees all
    : {
        classGroup: {
          schoolId: { in: getUserSchoolIds(auth) }
        }
      };
  
  const students = await prisma.student.findMany({ where: whereClause });
  return NextResponse.json(students);
}
```

### Pattern 3: Conditional UI Rendering

```typescript
export function ActionButtons({ auth }: { auth: ClientAuthContext }) {
  const permissions = getResourcePermissions(auth, "class");
  const features = getFeatureAccess(auth);
  
  return (
    <div>
      {permissions.canCreate && <CreateButton />}
      {permissions.canUpdate && <EditButton />}
      {permissions.canDelete && features.canManageSchools && <DeleteButton />}
    </div>
  );
}
```

## Testing

### Manual Testing Checklist

- [ ] Admin can access all schools
- [ ] Teacher can only access their school
- [ ] HOD can approve assessment plans
- [ ] SMT can manage school settings
- [ ] Non-admins cannot create schools
- [ ] API returns 403 for unauthorized school access
- [ ] UI hides buttons based on permissions
- [ ] Audit logs track all sensitive actions

### Test Cases

```typescript
// Test school access validation
describe("School Access", () => {
  it("admin can access any school", async () => {
    // Set x-user-email to admin
    const response = await fetch("/api/classes?schoolId=other-school");
    expect(response.status).toBe(200);
  });
  
  it("teacher cannot access other schools", async () => {
    // Set x-user-email to teacher
    const response = await fetch("/api/classes?schoolId=other-school");
    expect(response.status).toBe(403);
  });
});
```

## Troubleshooting

### Issue: Permission denied errors

**Solution**: Check user's role assignments and permission grants:

```sql
SELECT 
  u.email,
  r.name as role,
  p.key as permission
FROM AppUser u
JOIN UserRoleAssignment ura ON u.id = ura.userId
JOIN RoleDefinition r ON ura.roleId = r.id
JOIN RolePermission rp ON r.id = rp.roleId
JOIN PermissionDefinition p ON rp.permissionId = p.id
WHERE u.email = 'user@example.com';
```

### Issue: User can't see any data

**Solution**: Verify school assignment:

```sql
SELECT 
  u.email,
  u.schoolId,
  ura.scopeSchoolId
FROM AppUser u
JOIN UserRoleAssignment ura ON u.id = ura.userId
WHERE u.email = 'user@example.com';
```

### Issue: Admin can't access everything

**Solution**: Ensure admin role has system:admin permission:

```typescript
// In your migration or seed:
const adminRole = await prisma.roleDefinition.findUnique({
  where: { key: "admin" }
});
const systemAdminPerm = await prisma.permissionDefinition.findUnique({
  where: { key: "system:admin" }
});
// Grant permission to role
```

## API Reference

See `lib/auth.ts` and `lib/permissions-client.ts` for full API documentation.

## Support

For questions or issues with the permission system, please review:
1. This documentation
2. The implementation in `lib/auth.ts`
3. Example API routes in `app/api/*/route.ts`
4. Client examples in components using permissions
