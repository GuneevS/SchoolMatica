# Autonomous Development System for SchoolMatica

*A comprehensive multi-agent architecture for self-testing, autonomous development, and continuous quality assurance.*

## System Overview

This document defines a complete autonomous development ecosystem tailored to SchoolMatica's architecture:
- **Next.js 16 App Router** with React 19
- **Prisma ORM** with PostgreSQL
- **NextAuth.js v5** with JWT-based authentication
- **114+ granular permissions** with multi-tenancy
- **Zustand** for state management
- **ShadCN/UI + Tailwind CSS 4** for styling

---

## Agent Hierarchy

```
                     ┌─────────────────────────────────────┐
                     │         ORCHESTRATOR AGENT          │
                     │   (Workflow Coordinator & Router)   │
                     └──────────────────┬──────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
┌───────▼───────┐               ┌───────▼───────┐               ┌───────▼───────┐
│  PLANNING     │               │  EXECUTION    │               │  VALIDATION   │
│  AGENTS       │               │  AGENTS       │               │  AGENTS       │
└───────┬───────┘               └───────┬───────┘               └───────┬───────┘
        │                               │                               │
   ┌────┴────┐                    ┌─────┼─────┐                   ┌─────┼─────┐
   │         │                    │     │     │                   │     │     │
   ▼         ▼                    ▼     ▼     ▼                   ▼     ▼     ▼
Architect  Schema             API    UI    Domain            Test  Security  Perf
 Agent     Agent             Agent  Agent  Agent            Agent   Agent   Agent
```

---

## Phase 1: Planning Agents

### 1.1 Architect Agent (`architect`)

**Purpose**: Strategic planning, schema design, and technical specification

**Activation Triggers**:
- New feature requests
- Schema change requests
- Cross-cutting concern modifications
- Performance architecture decisions

**Skills & Capabilities**:
```yaml
primary_skills:
  - Prisma schema design with relations and indexes
  - Next.js App Router architecture
  - API route design (RESTful patterns)
  - Multi-tenancy schema enforcement
  - Permission system integration

knowledge_base:
  - prisma/schema.prisma (621 lines, 29 models)
  - lib/auth.ts (permission system)
  - All API route patterns in app/api/**

output_artifacts:
  - implementation_plan.md
  - schema_changes.prisma (diff format)
  - api_specification.yaml
  - component_hierarchy.md
```

**Decision Protocol**:
```
1. Read existing schema and related files
2. Identify affected models and relations
3. Check permission implications
4. Generate migration-safe schema changes
5. Output implementation plan with verification steps
6. STOP and request user approval before proceeding
```

**Critical Rules**:
- NEVER approve schema changes that break multi-tenancy (schoolId scoping)
- ALWAYS check for N+1 query potential in relation designs
- REQUIRE indexes on frequently queried foreign keys
- VALIDATE permission keys exist in PERMISSION_KEYS array

---

### 1.2 Schema Agent (`schema-validator`)

**Purpose**: Validate schema changes and ensure data integrity

**Activation Triggers**:
- Before any `prisma migrate dev` command
- After Architect Agent proposes schema changes
- When adding new models or relations

**Validation Checklist**:
```yaml
required_checks:
  - All models have createdAt/updatedAt timestamps
  - Foreign keys have proper onDelete behavior (Cascade vs Restrict)
  - School-scoped models have schoolId or path to schoolId
  - Indexes exist on all frequently filtered fields
  - Unique constraints are properly defined
  - JSON fields have documented structure

multi_tenancy_rules:
  - Direct school-scoped: School, Subject, Teacher, ClassGroup, GradeLevel
  - Indirect school-scoped (via ClassGroup): Student, AssessmentPlan, Mark
  - Must validate: Every query includes school filtering
```

**Output**:
```json
{
  "valid": true|false,
  "issues": [
    {
      "severity": "critical|warning|info",
      "model": "ModelName",
      "field": "fieldName",
      "issue": "Description",
      "fix": "Recommended fix"
    }
  ],
  "migration_safe": true|false
}
```

---

## Phase 2: Execution Agents

### 2.1 API Agent (`api-builder`)

**Purpose**: Build and maintain API routes with consistent patterns

**Pattern Library** (extracted from codebase):
```typescript
// Standard authorization pattern (from 16/17 routes)
const authResult = await authorizeWithSchool(request, "resource:action");
if ("error" in authResult) return authResult.error;
const { auth, schoolId } = authResult;

// Multi-tenancy enforcement pattern
if (!hasSchoolAccess(auth, resource.classGroup.schoolId)) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}

// Audit logging pattern
await auditFromAuth({
  auth,
  entityType: "EntityName",
  entityId: entity.id,
  action: "create|update|delete",
  metadata: { ...relevantData }
});
```

**Code Generation Templates**:
```yaml
templates:
  get_list:
    - Authorization check
    - School filtering
    - Pagination (limit, offset)
    - Sorting options
    - Include relations as needed

  get_single:
    - Authorization check
    - Fetch with relations
    - School access validation
    - Return 404 if not found

  post_create:
    - Authorization check
    - Zod schema validation
    - Create with proper schoolId
    - Audit log
    - Return created entity

  patch_update:
    - Authorization check
    - Fetch existing entity
    - School access validation
    - Zod partial schema validation
    - Update with audit log
    - Return updated entity

  delete:
    - Authorization check
    - Fetch existing entity
    - School access validation
    - Check for dependent records
    - Delete with audit log
    - Return success
```

**Self-Correction Rules**:
```yaml
on_build_error:
  - Parse TypeScript error message
  - Identify affected file and line
  - Check for missing imports
  - Check for type mismatches
  - Apply fix and rebuild
  - If same error 3x: STOP and escalate

on_lint_error:
  - Auto-fix if eslint --fix can handle
  - Manual review for complex issues
  - Never ignore 'any' type warnings
```

---

### 2.2 UI Agent (`ui-builder`)

**Purpose**: Build React components with ShadCN/UI and Tailwind

**Design System Reference**:
```yaml
component_library:
  base: "@radix-ui/*"
  styled: "components/ui/*"
  icons: "lucide-react"

styling:
  framework: "tailwindcss v4"
  animations: "tailwindcss-animate"
  theme: "components/theme/theme-provider.tsx"

patterns:
  data_fetching: "Server Components with fetch or Prisma"
  client_state: "Zustand stores in lib/stores/*"
  forms: "react-hook-form + zod"
  dialogs: "@radix-ui/react-dialog via components/ui/dialog.tsx"
```

**Component Creation Checklist**:
```yaml
required_elements:
  - TypeScript strict typing (no 'any')
  - Props interface with JSDoc comments
  - Loading states (Skeleton components)
  - Error states (Alert component)
  - Empty states (styled messaging)
  - Responsive design (mobile-first)

accessibility:
  - ARIA labels on interactive elements
  - Keyboard navigation support
  - Focus management in modals
  - Color contrast (WCAG AA)

performance:
  - React.memo for expensive renders
  - useCallback for event handlers
  - useMemo for computed values
  - Lazy loading for heavy components
```

**UI/UX Standards** (from PixelPerfect agent):
```yaml
visual_requirements:
  - No browser default styles
  - Consistent spacing (4px grid)
  - Proper loading indicators
  - Toast notifications for actions
  - Hover and focus states on all interactive elements

micro_interactions:
  - Button feedback on click
  - Smooth transitions (150-300ms)
  - Progress indicators for async operations
  - Optimistic UI updates where appropriate
```

---

### 2.3 Domain Logic Agent (`domain-builder`)

**Purpose**: Implement and maintain business logic in lib/domain/*

**Current Domain Files**:
```
lib/
├── calculations.ts       # SBA, term percentages, grading
├── markbook.ts          # Markbook data transformations
├── assessment-service.ts # Assessment workflow logic
├── domain/
│   ├── audit.ts         # Audit logging utilities
│   ├── student-onboarding.ts
│   ├── templates.ts     # Curriculum template logic
│   └── workflows.ts     # Status transition logic
```

**Calculation Accuracy Requirements**:
```yaml
precision_rules:
  - Intermediate calculations: 4 decimal places
  - Final display values: 2 decimal places
  - Weight normalization: Must sum to exactly 100%
  - Use Number().toFixed() for consistency

edge_cases:
  - Empty assessments: Return 0
  - All absent marks: Return 0
  - Single assessment: Weight = 100%
  - Marks outside bounds: Log warning, exclude from calculation
```

**Testing Requirements**:
```yaml
unit_test_coverage:
  - normaliseWeights(): Edge cases for 0, 1, many items
  - calculateStudentSba(): Absent handling, weight renormalization
  - mapPercentToLevel(): Boundary conditions (exactly on threshold)
  - calculateFinalYearMark(): Term weight distribution
```

---

## Phase 3: Validation Agents

### 3.1 Test Agent (`test-runner`)

**Purpose**: Automated testing with self-healing capabilities

**Test Categories**:
```yaml
unit_tests:
  location: "lib/**/__tests__/*.test.ts"
  framework: "vitest"
  coverage_target: 80%

integration_tests:
  location: "tests/integration/**/*.test.ts"
  focus:
    - API route end-to-end flows
    - Database transactions
    - Permission enforcement

e2e_tests:
  location: "tests/e2e/**/*.spec.ts"
  framework: "playwright"
  focus:
    - Critical user journeys
    - Authentication flows
    - Multi-role scenarios
```

**Self-Testing Protocol**:
```yaml
before_commit:
  - Run: npm run lint
  - Run: npm run build
  - Run: npx vitest run
  - Verify: No type errors
  - Verify: No unhandled promise rejections

on_test_failure:
  1. Parse error output
  2. Identify failing test file and line
  3. Read test expectations
  4. Read implementation code
  5. Hypothesize fix
  6. Apply fix
  7. Re-run specific test
  8. If passes: Continue
  9. If fails 3x: Escalate to user
```

**Test Generation Patterns**:
```typescript
// API Route Test Template
describe("POST /api/[resource]", () => {
  it("should reject unauthenticated requests", async () => {
    const res = await fetch("/api/resource", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("should reject unauthorized requests", async () => {
    // With auth but wrong permission
    expect(res.status).toBe(403);
  });

  it("should reject cross-school access", async () => {
    // Valid auth but wrong school
    expect(res.status).toBe(403);
  });

  it("should create resource with valid data", async () => {
    // Happy path
    expect(res.status).toBe(201);
    expect(body).toMatchObject({ ... });
  });

  it("should validate input data", async () => {
    // Zod validation failures
    expect(res.status).toBe(400);
  });
});
```

---

### 3.2 Security Agent (`security-auditor`)

**Purpose**: Continuous security validation and vulnerability detection

**Automated Checks**:
```yaml
authorization_audit:
  - Every API route uses authorizeWithSchool() or authorize()
  - No routes expose school-wide data without filtering
  - Permission keys match PERMISSION_KEYS array
  - No hardcoded credentials or secrets

injection_prevention:
  - SQL: All queries use Prisma (parameterized)
  - XSS: No dangerouslySetInnerHTML without sanitization
  - Command: No exec/spawn with user input

authentication_checks:
  - Session cookies are HttpOnly, Secure, SameSite
  - Password hashing uses bcrypt (12+ rounds)
  - Reset tokens are hashed before storage
  - Rate limiting on auth endpoints

data_exposure:
  - Passwords never in API responses
  - Sensitive fields excluded from select
  - Error messages don't leak internal details
```

**Critical Findings from TESTING_REPORTS.md**:
```yaml
known_issues:
  CRITICAL:
    - grading-config/route.ts: NO AUTHORIZATION
    - Rate limiting: In-memory only (not distributed)
    - Status transitions: No transaction wrapping
    - Moderation threads: Missing XOR validation

  HIGH:
    - Client identifier fallback to "unknown"
    - No account lockout mechanism

  MEDIUM:
    - Password minimum 8 chars (should be 12+)
    - Reset token in URL query parameter
```

**Security Scan Protocol**:
```yaml
on_new_api_route:
  1. Verify authorization pattern present
  2. Check school access validation
  3. Verify Zod input validation
  4. Check for audit logging
  5. Scan for sensitive data in responses
  6. Report findings with severity ratings
```

---

### 3.3 Performance Agent (`perf-analyzer`)

**Purpose**: Identify and resolve performance issues

**Analysis Targets**:
```yaml
database_queries:
  - Detect N+1 query patterns
  - Verify indexes on filtered fields
  - Check for unnecessary includes
  - Monitor query count per request

react_rendering:
  - Identify unnecessary re-renders
  - Check memo/callback usage
  - Verify key props on lists
  - Analyze bundle size impact

api_response_times:
  - Target: <200ms for reads
  - Target: <500ms for writes
  - Alert: >1000ms any operation
```

**Optimization Recommendations**:
```yaml
database:
  - Use select instead of full include
  - Add compound indexes for common filters
  - Use take/skip for pagination
  - Consider Redis caching for hot data

frontend:
  - Code split with next/dynamic
  - Lazy load below-fold components
  - Use React.memo for pure components
  - Debounce rapid user inputs
```

---

## Autonomous Workflows

### Workflow 1: Feature Development (`workflow-feature`)

```yaml
name: Feature Development Pipeline
trigger: User requests new feature

steps:
  1_planning:
    agent: architect
    actions:
      - Analyze feature requirements
      - Review affected schema/routes/components
      - Generate implementation_plan.md
      - STOP: Request user approval

  2_schema:
    agent: schema-validator
    condition: If schema changes needed
    actions:
      - Validate proposed schema changes
      - Generate migration script
      - STOP: Request approval for migrations

  3_api:
    agent: api-builder
    actions:
      - Create/update API routes
      - Add Zod validation schemas
      - Implement authorization
      - Add audit logging
      - Self-test with build

  4_domain:
    agent: domain-builder
    condition: If business logic needed
    actions:
      - Implement domain functions
      - Add JSDoc documentation
      - Create unit tests

  5_ui:
    agent: ui-builder
    actions:
      - Create React components
      - Wire to API routes
      - Add loading/error states
      - Implement responsive design

  6_testing:
    agent: test-runner
    actions:
      - Run full test suite
      - Generate coverage report
      - Fix failing tests (max 3 attempts)
      - STOP: If tests fail repeatedly

  7_security:
    agent: security-auditor
    actions:
      - Scan new code for vulnerabilities
      - Verify authorization patterns
      - Report findings

  8_performance:
    agent: perf-analyzer
    actions:
      - Check for N+1 queries
      - Verify component optimization
      - Report recommendations

escalation:
  - If any agent fails 3x: Notify user with context
  - If security critical found: Block and notify
  - If tests fail: Provide detailed failure analysis
```

---

### Workflow 2: Code Review (`workflow-review`)

```yaml
name: Automated Code Review
trigger: Before commit or on file changes

steps:
  1_static_analysis:
    agent: security-auditor
    actions:
      - Run eslint with strict rules
      - Check for 'any' types
      - Verify import paths use @/
      - Scan for hardcoded values

  2_pattern_check:
    agent: api-builder
    condition: If API routes changed
    actions:
      - Verify authorization pattern
      - Check school access validation
      - Verify Zod schemas
      - Check audit logging

  3_component_review:
    agent: ui-builder
    condition: If components changed
    actions:
      - Verify TypeScript strict mode
      - Check accessibility attributes
      - Verify loading/error states
      - Check responsive breakpoints

  4_test_coverage:
    agent: test-runner
    actions:
      - Run affected tests
      - Check coverage delta
      - Report uncovered code

output:
  - Review summary with severity ratings
  - Specific file:line recommendations
  - Auto-fixable issues applied
  - Manual review items flagged
```

---

### Workflow 3: Security Audit (`workflow-security`)

```yaml
name: Comprehensive Security Audit
trigger: Weekly or before deployment

steps:
  1_auth_audit:
    agent: security-auditor
    focus: Authentication system
    checks:
      - Rate limiting effectiveness
      - Password policy compliance
      - Session management
      - Token handling

  2_authz_audit:
    agent: security-auditor
    focus: Authorization system
    checks:
      - All routes have authorization
      - Permission enforcement correct
      - School access properly validated
      - No privilege escalation paths

  3_data_audit:
    agent: security-auditor
    focus: Data protection
    checks:
      - No sensitive data exposure
      - Proper input validation
      - Safe query construction
      - Audit trail completeness

  4_dependency_audit:
    actions:
      - Run: npm audit
      - Check for known vulnerabilities
      - Recommend updates

output:
  - Security score (1-10)
  - Critical issues (must fix)
  - Recommendations (should fix)
  - Best practices (nice to have)
```

---

### Workflow 4: Bug Fix (`workflow-bugfix`)

```yaml
name: Autonomous Bug Resolution
trigger: Bug report or test failure

steps:
  1_reproduce:
    actions:
      - Read bug description
      - Identify affected code paths
      - Create minimal reproduction

  2_diagnose:
    actions:
      - Trace execution flow
      - Identify root cause
      - Check for related issues

  3_fix:
    agents: [api-builder, ui-builder, domain-builder]
    actions:
      - Implement fix in appropriate layer
      - Add regression test
      - Verify fix locally

  4_validate:
    agent: test-runner
    actions:
      - Run full test suite
      - Verify no regressions
      - Check coverage maintained

  5_document:
    actions:
      - Update CHANGELOG.md
      - Add to project_intelligence.md if pattern issue

self_correction:
  max_attempts: 3
  on_failure:
    - Gather all diagnostic information
    - Present to user with analysis
    - Request guidance
```

---

## Self-Improvement Protocol

### Learning from Failures

```yaml
failure_analysis:
  on_build_error:
    - Record: Error type, file, line
    - Categorize: Syntax, Type, Import, Logic
    - Store: Pattern recognition data

  on_test_failure:
    - Record: Test name, assertion, actual vs expected
    - Categorize: Logic, Edge case, Integration
    - Store: Common failure patterns

  on_security_issue:
    - Record: Vulnerability type, location
    - Categorize: Auth, Injection, Exposure
    - Store: Prevention patterns

knowledge_capture:
  file: .agent/project_intelligence.md
  sections:
    - Architectural Patterns
    - Coding Standards (Learned)
    - UI/UX Preferences
    - Common Pitfalls
    - Performance Optimizations
```

### Pattern Library Growth

```yaml
new_pattern_detection:
  trigger: Successful resolution of recurring issue

  process:
    1. Identify pattern category
    2. Document problem description
    3. Document solution approach
    4. Add code template if applicable
    5. Update relevant agent's knowledge base

  example:
    pattern: "Multi-tenancy Query"
    problem: "Forgot to filter by schoolId"
    solution: "Always use hasSchoolAccess() before data return"
    template: |
      if (!hasSchoolAccess(auth, resource.classGroup.schoolId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
```

---

## Integration with Claude Code

### Invoking Agents

```bash
# Invoke specific agent
claude --agent architect "Design schema for student attendance tracking"

# Run workflow
claude --workflow feature "Add bulk mark import feature"

# Security audit
claude --workflow security

# Code review before commit
claude --workflow review
```

### Agent Context Loading

Each agent loads its context:
1. Read `.agent/project_intelligence.md` for learned patterns
2. Read relevant role file (e.g., `.agent/roles/CodeSmith.md`)
3. Read workflow file if part of workflow
4. Load project-specific knowledge (schema, routes, components)

### Communication Protocol

Agents communicate via structured artifacts:

```yaml
artifact_types:
  implementation_plan:
    format: markdown
    location: .agent/plans/

  code_changes:
    format: diff
    location: In-memory, applied directly

  test_results:
    format: json
    location: .agent/reports/

  security_findings:
    format: json
    location: .agent/reports/security/

  review_comments:
    format: markdown
    location: .agent/reviews/
```

---

## Configuration

### Agent Behavior Settings

```yaml
# .agent/config.yaml

global:
  max_retry_attempts: 3
  stop_on_critical: true
  auto_fix_lint: true
  require_approval_for:
    - schema_changes
    - security_critical
    - destructive_operations

agents:
  architect:
    verbose: true
    require_approval: always

  api-builder:
    auto_fix: true
    lint_on_save: true

  ui-builder:
    accessibility_check: true
    responsive_check: true

  test-runner:
    coverage_threshold: 80
    fail_on_uncovered: false

  security-auditor:
    scan_dependencies: true
    block_on_critical: true
```

---

## Appendix: SchoolMatica-Specific Knowledge

### Permission Keys (114+)
Reference: `lib/auth.ts:6-118`

### Schema Models (29)
Reference: `prisma/schema.prisma`

### API Routes (53)
Reference: `app/api/**/*.ts`

### UI Components (70+)
Reference: `components/**/*.tsx`

### Critical Files for Agents
```yaml
always_read:
  - prisma/schema.prisma
  - lib/auth.ts
  - lib/calculations.ts
  - middleware.ts
  - .agent/project_intelligence.md

before_api_changes:
  - Check existing route pattern in same folder
  - Verify permission key exists

before_ui_changes:
  - Check components/ui/ for existing components
  - Check lib/stores/ for state management
```
