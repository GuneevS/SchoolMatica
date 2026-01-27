# Security Scanner

*Comprehensive security vulnerability detection across frameworks.*

---

## Purpose

Detect security vulnerabilities in:
1. **Authorization** - Missing auth checks, permission gaps
2. **Multi-tenancy** - Cross-tenant data access
3. **Injection** - SQL, XSS, command injection
4. **Data Exposure** - Sensitive data leaks
5. **Authentication** - Session, password, token issues

---

## Scan Categories

### Category 1: Authorization Audit

#### For Next.js API Routes

**Pattern to Find**: Every route handler should have authorization

```typescript
// SECURE pattern (what we want to see):
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "resource:read");
  if ("error" in authResult) return authResult.error;
  // ... rest of handler
}

// VULNERABLE pattern (missing authorization):
export async function GET(request: NextRequest) {
  const data = await prisma.resource.findMany();  // No auth check!
  return NextResponse.json(data);
}
```

**Scan Commands**:
```bash
# Find all route.ts files
glob "app/api/**/route.ts"

# For each file, check if it contains authorization pattern
# Missing: authorizeWithSchool OR authorize
```

**Output Format**:
```yaml
findings:
  - id: "AUTH-001"
    severity: "CRITICAL"
    file: "app/api/grading-config/route.ts"
    line: 5
    issue: "GET handler has no authorization check"
    evidence: "export async function GET() { ... }"
    remediation: |
      Add authorization at the start of the handler:
      const authResult = await authorizeWithSchool(request, "gradingConfig:read");
      if ("error" in authResult) return authResult.error;
    cwe: "CWE-862: Missing Authorization"
```

#### For Django Views

**Pattern to Find**: Views should have @login_required or permission checks

```python
# SECURE:
@login_required
@permission_required('app.view_resource')
def resource_list(request):
    ...

# VULNERABLE:
def resource_list(request):  # No decorator!
    resources = Resource.objects.all()
    ...
```

#### For Express Routes

**Pattern to Find**: Routes should have auth middleware

```javascript
// SECURE:
router.get('/resources', authMiddleware, permissionCheck('read'), handler);

// VULNERABLE:
router.get('/resources', handler);  // No middleware!
```

---

### Category 2: Multi-Tenancy Violations

#### School/Tenant Filtering

**Pattern to Find**: All queries should filter by tenant ID

```typescript
// SECURE (has school filtering):
const data = await prisma.resource.findMany({
  where: { schoolId: auth.user.schoolId }  // Filtered!
});

// VULNERABLE (no tenant filtering):
const data = await prisma.resource.findMany();  // Returns ALL data!
```

**Cross-Reference Check**:
```typescript
// SECURE (validates access before returning):
const resource = await prisma.resource.findUnique({ where: { id } });
if (!hasSchoolAccess(auth, resource.classGroup.schoolId)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// VULNERABLE (returns without access check):
const resource = await prisma.resource.findUnique({ where: { id } });
return NextResponse.json(resource);  // No access validation!
```

**Scan Logic**:
```yaml
for_each_api_route:
  1. Find all prisma.*.findMany() calls
  2. Check if where clause includes tenancy filter (schoolId, tenantId, organizationId)
  3. If missing, flag as CRITICAL

  1. Find all prisma.*.findUnique() / findFirst() calls
  2. Check if hasSchoolAccess() or equivalent is called before return
  3. If missing, flag as HIGH
```

---

### Category 3: Injection Vulnerabilities

#### SQL Injection

**Pattern to Find**: Raw queries with string interpolation

```typescript
// VULNERABLE (string interpolation):
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = '${userInput}'
`;

// SECURE (parameterized):
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = ${userInput}
`;  // Prisma handles escaping

// EVEN BETTER (use Prisma client):
const result = await prisma.user.findMany({
  where: { name: userInput }
});
```

**Django**:
```python
# VULNERABLE:
cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")

# SECURE:
cursor.execute("SELECT * FROM users WHERE name = %s", [user_input])
```

#### XSS (Cross-Site Scripting)

**Pattern to Find**: Unescaped user content rendering

```typescript
// VULNERABLE (React):
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// Vue:
<div v-html="userContent"></div>

// If used, check for sanitization:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

#### Command Injection

**Pattern to Find**: exec/spawn with user input

```typescript
// VULNERABLE:
import { exec } from 'child_process';
exec(`ls ${userInput}`);  // User controls command!

// Python:
import os
os.system(f"ls {user_input}")  # Dangerous!
```

---

### Category 4: Data Exposure

#### Sensitive Fields in Response

**Pattern to Find**: Password, tokens, secrets in API responses

```typescript
// VULNERABLE (returns all fields including sensitive):
const user = await prisma.appUser.findUnique({ where: { id } });
return NextResponse.json(user);  // Includes passwordHash!

// SECURE (explicitly select safe fields):
const user = await prisma.appUser.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    // passwordHash: false (omitted)
  }
});
return NextResponse.json(user);
```

**Fields to Flag**:
```yaml
sensitive_fields:
  - password
  - passwordHash
  - hashedPassword
  - resetToken
  - resetTokenExpiry
  - apiKey
  - secretKey
  - accessToken
  - refreshToken
  - privateKey
  - secret
```

#### Error Message Leaks

**Pattern to Find**: Internal details in error responses

```typescript
// VULNERABLE (leaks internal details):
catch (error) {
  return NextResponse.json({
    error: error.message,
    stack: error.stack  // Leaks stack trace!
  });
}

// SECURE (generic message, log internally):
catch (error) {
  console.error("Internal error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

### Category 5: Authentication Issues

#### Session Security

**Pattern to Find**: Cookie security flags

```typescript
// SECURE cookie settings:
cookies: {
  httpOnly: true,      // Prevents XSS access
  secure: true,        // HTTPS only
  sameSite: "strict",  // Prevents CSRF
}

// VULNERABLE:
cookies: {
  httpOnly: false,     // JavaScript can access!
  secure: false,       // HTTP allowed!
}
```

#### Password Security

```yaml
checks:
  - Minimum length >= 12 characters
  - Bcrypt rounds >= 12
  - No plaintext storage
  - Generic error messages (no email enumeration)

patterns_to_find:
  weak_password_policy:
    - /password.{0,10}\.length\s*[<>=]+\s*[0-9]/ → Check if < 12

  weak_hashing:
    - /bcrypt.*rounds.*[0-9]+/ → Check if < 12
    - /md5\(|sha1\(/ → Weak algorithms

  plaintext_comparison:
    - /password\s*===?\s*/ → Direct comparison (no hash)
```

#### Rate Limiting

```yaml
checks:
  - Login endpoint has rate limiting
  - Password reset has rate limiting
  - Registration has rate limiting

patterns_to_find:
  missing_rate_limit:
    - POST /api/auth/login without rateLimit middleware
    - POST /api/auth/register without rateLimit middleware
    - POST /api/auth/forgot-password without rateLimit middleware
```

---

## Scan Workflow

```yaml
workflow:
  step_1_authorization:
    scan: All API route files
    check: Authorization pattern present
    output: List of routes without auth

  step_2_multi_tenancy:
    scan: All API route files
    check: Tenant filtering in queries
    output: List of queries without filtering

  step_3_injection:
    scan: All source files
    check: Raw queries, dangerous functions
    output: Potential injection points

  step_4_data_exposure:
    scan: All API route files
    check: Sensitive fields in responses
    output: Data exposure risks

  step_5_authentication:
    scan: Auth configuration and routes
    check: Security settings, password policy
    output: Auth weaknesses

  step_6_report:
    generate: security_scan.md
    format: Findings by severity
    include: Remediation guidance
```

---

## Output: security_scan.md

```markdown
# Security Scan Report

**Generated**: 2026-01-25T12:00:00Z
**Scope**: Full application scan
**Overall Risk**: HIGH

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 8 |
| LOW | 12 |

## Critical Findings

### SEC-001: Missing Authorization on Grading Config

**Severity**: CRITICAL
**File**: `app/api/grading-config/route.ts:5`
**CWE**: CWE-862 (Missing Authorization)

**Issue**: GET and PUT handlers have no authorization checks. Any authenticated user can read or modify system grading configuration.

**Evidence**:
```typescript
export async function GET() {
  const config = await prisma.gradingConfig.findFirst();
  return NextResponse.json(config);
}
```

**Remediation**:
```typescript
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "gradingConfig:read");
  if ("error" in authResult) return authResult.error;
  // ... rest of handler
}
```

---

### SEC-002: In-Memory Rate Limiting

**Severity**: HIGH
**File**: `lib/rate-limit.ts`
**CWE**: CWE-770 (Allocation of Resources Without Limits)

**Issue**: Rate limiting uses in-memory store. In multi-instance deployments, each server has separate limits, making rate limiting ineffective.

**Remediation**: Use Redis-backed rate limiting for distributed environments.

---

## Recommendations

1. **Immediate**: Fix all CRITICAL issues before production
2. **Short-term**: Address HIGH priority issues within 1 week
3. **Medium-term**: Review and fix MEDIUM issues
4. **Ongoing**: Regular security audits
```
