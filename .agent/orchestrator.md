# Agent Orchestration Guide

*This document serves as the "Operating System" for the Autonomous Agent Team. It defines the Universal Protocols for this project.*

---

## 1. The Agent Team

### Core Agents

| Agent | File | Role | Specialty |
| :--- | :--- | :--- | :--- |
| **System Architect** | [SysArchitect.md](./roles/SysArchitect.md) | Planner, DB Designer, Technical Lead | Schema design, architecture |
| **CodeSmith** | [CodeSmith.md](./roles/CodeSmith.md) | Builder, Refactorer, Type Specialist | Implementation, TypeScript |
| **PixelPerfect** | [PixelPerfect.md](./roles/PixelPerfect.md) | UI/UX Designer, Motion Specialist | React components, styling |
| **GuardRail** | [GuardRail.md](./roles/GuardRail.md) | QA, Security Auditor, Optimizer | Testing, security, performance |

### Specialized Agents (NEW)

| Agent | File | Role | Specialty |
| :--- | :--- | :--- | :--- |
| **API Architect** | [ApiArchitect.md](./roles/ApiArchitect.md) | Backend API specialist | Routes, authorization, validation |
| **Test Runner** | [TestRunner.md](./roles/TestRunner.md) | Autonomous testing | Self-healing tests, coverage |
| **Security Auditor** | [SecurityAuditor.md](./roles/SecurityAuditor.md) | Security specialist | Vulnerability detection, compliance |

---

## 2. Universal Workflows

### Development Workflows

| Outcome Needed | Workflow | Description |
| :--- | :--- | :--- |
| **New Feature** | [feature_kickoff.md](./workflows/feature_kickoff.md) | End-to-end planning, build, and verify |
| **Fix "Ugly" UI** | [ui_revamp.md](./workflows/ui_revamp.md) | Polish a component to world-class standards |
| **Fix Bugs/Security** | [code_review.md](./workflows/code_review.md) | Audit files and auto-refactor issues |

### Autonomous Workflows (NEW)

| Outcome Needed | Workflow | Description |
| :--- | :--- | :--- |
| **Verify Quality** | [autonomous_testing.md](./workflows/autonomous_testing.md) | Self-healing test pipeline |
| **Review Changes** | [continuous_review.md](./workflows/continuous_review.md) | Automated code review with quality gates |
| **Security Scan** | In [SecurityAuditor.md](./roles/SecurityAuditor.md) | Vulnerability detection and reporting |

### Full System Documentation

| Document | Purpose |
| :--- | :--- |
| [AUTONOMOUS_DEVELOPMENT_SYSTEM.md](./AUTONOMOUS_DEVELOPMENT_SYSTEM.md) | Complete autonomous development architecture |
| [project_intelligence.md](./project_intelligence.md) | Shared memory and learned patterns |

---

## 3. The "Self-Correction" Protocol

**All Agents MUST follow this loop:**

```
┌──────────────────────────────────────────────────────────────┐
│                    SELF-CORRECTION LOOP                       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │   1. EXECUTE   │
                     │   instruction  │
                     └───────┬────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │   2. VERIFY    │
                     │   output       │
                     └───────┬────────┘
                              │
                         ┌────┴────┐
                        YES       NO
                         │         │
                         ▼         ▼
                     ┌──────┐  ┌─────────────┐
                     │ DONE │  │ 3. CORRECT  │
                     └──────┘  │ analyze →   │
                               │ hypothesize │
                               │ → fix       │
                               └──────┬──────┘
                                      │
                                      ▼
                               Attempt < 3?
                                      │
                                 ┌────┴────┐
                                YES       NO
                                 │         │
                                 ▼         ▼
                            ┌──────┐  ┌─────────────┐
                            │ RETRY│  │ 4. ESCALATE │
                            └──────┘  │ STOP + NOTIFY│
                                      └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ 5. LEARN    │
                                      │ Update      │
                                      │ intelligence│
                                      └─────────────┘
```

### Verification Commands

```bash
# Build verification
npm run build

# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Test run (when available)
npx vitest run
```

---

## 4. Agent Selection Guide

### When to Use Each Agent

```yaml
user_request: "Add a new API endpoint for X"
agent: API Architect
reason: Specialized in routes, authorization, validation

user_request: "Fix this UI component"
agent: PixelPerfect
reason: UI/UX specialist

user_request: "Add a new database field"
agent: System Architect
reason: Schema design specialist

user_request: "Why is this test failing?"
agent: Test Runner
reason: Autonomous testing and debugging

user_request: "Is this code secure?"
agent: Security Auditor
reason: Vulnerability detection

user_request: "Build this feature end-to-end"
workflow: feature_kickoff.md
agents: [System Architect → CodeSmith/API Architect → PixelPerfect → GuardRail]
```

### Automatic Agent Triggers

```yaml
triggers:
  file_changed: "*.ts in app/api/**"
  agent: API Architect
  action: Verify authorization pattern

  file_changed: "*.tsx in components/**"
  agent: PixelPerfect
  action: Check component standards

  file_changed: "prisma/schema.prisma"
  agent: System Architect
  action: Validate schema changes

  command: "git commit"
  agent: Test Runner
  action: Run pre-commit checks

  schedule: "weekly"
  agent: Security Auditor
  action: Full security scan
```

---

## 5. Communication Protocol

### Inter-Agent Communication

Agents communicate through shared artifacts:

```yaml
artifact_types:
  implementation_plan:
    creator: System Architect
    consumers: [CodeSmith, API Architect, PixelPerfect]
    format: markdown
    location: .agent/plans/

  code_changes:
    creator: [CodeSmith, API Architect, PixelPerfect]
    consumers: [GuardRail, Test Runner]
    format: diff
    location: In-memory

  test_results:
    creator: Test Runner
    consumers: All agents
    format: json
    location: .agent/reports/

  security_findings:
    creator: Security Auditor
    consumers: All agents
    format: json
    location: .agent/reports/security/

  review_comments:
    creator: [GuardRail, Security Auditor]
    consumers: [CodeSmith, API Architect, PixelPerfect]
    format: markdown
```

### Escalation Chain

```
Test Runner/Security Auditor (detects issue)
           │
           ▼
    CodeSmith/API Architect (attempts fix)
           │
           ▼
    System Architect (if architectural)
           │
           ▼
    User (if stuck after 3 attempts)
```

---

## 6. Knowledge Management

### Shared Memory: project_intelligence.md

All agents read and write to `project_intelligence.md`:

```yaml
sections:
  - Architectural Patterns: Design decisions and rules
  - Coding Standards: Learned patterns from errors
  - UI/UX Preferences: Design language evolution
  - Common Pitfalls: Mistakes to avoid
  - Security Knowledge: Vulnerabilities and fixes
  - Testing Patterns: Test templates and strategies
  - Workflow History: What worked and what didn't
```

### Learning Protocol

When a new pattern is discovered:

1. Agent completes task successfully
2. Agent identifies reusable pattern
3. Agent appends to `project_intelligence.md`
4. Future agents benefit from learned knowledge

---

## 7. Quick Start Commands

### Invoke Specific Agent

```bash
# Run with agent context
claude "I am the API Architect agent. [Read ApiArchitect.md first]
Task: Create endpoint for [X]"

# Run workflow
claude "Execute workflow: feature_kickoff.md
Feature: [Description]"

# Run security audit
claude "I am the Security Auditor agent. [Read SecurityAuditor.md first]
Run full security scan on app/api/"
```

### Workflow Execution

```bash
# Feature development
claude --workflow feature "Add bulk mark import"

# Code review
claude --workflow review "app/api/assessments/"

# Testing
claude --workflow test "lib/calculations.ts"

# Security audit
claude --workflow security
```

---

## 8. Critical Rules (All Agents)

### MUST DO

1. **Read project_intelligence.md** before starting any task
2. **Check existing patterns** before creating new ones
3. **Run build verification** after code changes
4. **Log learned patterns** to project_intelligence.md
5. **STOP after 3 failed attempts** and escalate

### MUST NOT

1. **Never ignore authorization** in API routes
2. **Never skip school filtering** in database queries
3. **Never use `any` type** without documentation
4. **Never commit without tests passing**
5. **Never deploy with critical security issues**

---

## 9. Project-Specific Context

### SchoolMatica Architecture

```
Stack:
- Next.js 16 (App Router)
- React 19
- Prisma + PostgreSQL
- NextAuth.js v5
- Tailwind CSS 4 + ShadCN/UI
- Zustand for state

Key Files:
- prisma/schema.prisma (29 models)
- lib/auth.ts (114+ permissions)
- lib/calculations.ts (business logic)
- middleware.ts (auth middleware)
```

### Multi-Tenancy Rule (CRITICAL)

**Every database query MUST be scoped by schoolId**

```typescript
// Required pattern
const authResult = await authorizeWithSchool(request, "resource:action");
if ("error" in authResult) return authResult.error;
const { auth } = authResult;

// All queries include school filtering
const data = await prisma.resource.findMany({
  where: { schoolId: auth.user.schoolId }
});
```

---

## 10. Appendix: File Structure

```
.agent/
├── orchestrator.md                    # This file - agent OS
├── AUTONOMOUS_DEVELOPMENT_SYSTEM.md   # Full system architecture
├── project_intelligence.md            # Shared memory
├── roles/
│   ├── SysArchitect.md               # System Architect
│   ├── CodeSmith.md                  # Builder
│   ├── PixelPerfect.md               # UI/UX
│   ├── GuardRail.md                  # QA
│   ├── ApiArchitect.md               # API specialist (NEW)
│   ├── TestRunner.md                 # Testing agent (NEW)
│   └── SecurityAuditor.md            # Security agent (NEW)
├── workflows/
│   ├── feature_kickoff.md            # Feature development
│   ├── ui_revamp.md                  # UI improvement
│   ├── code_review.md                # Bug/security fixes
│   ├── autonomous_testing.md         # Self-healing tests (NEW)
│   └── continuous_review.md          # Automated review (NEW)
├── plans/                            # Implementation plans
└── reports/                          # Test/security reports
    └── security/                     # Security findings
```
