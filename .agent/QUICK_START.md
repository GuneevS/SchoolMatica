# Quick Start Guide: Autonomous Development System

*Get started with the SchoolMatica autonomous development agents in 5 minutes.*

---

## Overview

You now have a comprehensive autonomous development system with:

- **7 Specialized Agents** for different development tasks
- **5 Automated Workflows** for common scenarios
- **Self-healing Testing** with automatic error recovery
- **Continuous Security Monitoring** with vulnerability tracking
- **Shared Knowledge Base** that improves over time

---

## Invoking Agents

### Method 1: Direct Agent Invocation

Start your prompt with agent context:

```
I am acting as the [AGENT NAME] agent.
First, read .agent/roles/[AgentFile].md for my instructions.
Then, read .agent/project_intelligence.md for project context.

Task: [Your task description]
```

### Method 2: Workflow Execution

For complex multi-step tasks:

```
Execute the [WORKFLOW NAME] workflow from .agent/workflows/[workflow].md

Context: [Your context]
Goal: [What you want to achieve]
```

---

## Common Use Cases

### 1. Add a New API Endpoint

```
I am acting as the API Architect agent.
Read .agent/roles/ApiArchitect.md first.

Task: Create a new API endpoint for [resource] that:
- Supports GET (list), POST (create)
- Has proper authorization
- Includes Zod validation
- Logs to audit trail
```

### 2. Build a New Feature (End-to-End)

```
Execute the feature_kickoff workflow from .agent/workflows/feature_kickoff.md

Feature: [Feature name and description]
Requirements:
- [Requirement 1]
- [Requirement 2]
```

### 3. Run Autonomous Tests

```
I am acting as the Test Runner agent.
Read .agent/roles/TestRunner.md first.

Task: Run the autonomous testing pipeline:
1. Build verification
2. Lint check
3. Type check
4. Report any issues and attempt fixes
```

### 4. Security Audit

```
I am acting as the Security Auditor agent.
Read .agent/roles/SecurityAuditor.md first.

Task: Perform a security scan on:
- All API routes in app/api/
- Check for authorization gaps
- Check for multi-tenancy violations
- Report findings with severity
```

### 5. Fix UI Component

```
I am acting as the PixelPerfect agent.
Read .agent/roles/PixelPerfect.md first.

Task: Improve the [component name] component:
- Add proper loading states
- Add error handling
- Ensure responsive design
- Add accessibility attributes
```

### 6. Code Review

```
Execute the continuous_review workflow from .agent/workflows/continuous_review.md

Files to review: [file paths]
Focus areas: [security, performance, patterns, etc.]
```

---

## Agent Capabilities Quick Reference

| Agent | Best For | Key Skills |
|-------|----------|------------|
| **System Architect** | Schema changes, architecture | Prisma, planning, design |
| **API Architect** | Backend endpoints | Authorization, validation, routes |
| **CodeSmith** | General implementation | TypeScript, refactoring |
| **PixelPerfect** | UI/UX work | React, Tailwind, accessibility |
| **GuardRail** | Quality assurance | Testing, code review |
| **Test Runner** | Automated testing | Self-healing tests, coverage |
| **Security Auditor** | Security | Vulnerabilities, compliance |

---

## Self-Correction Protocol

All agents follow this loop:

1. **Execute** the task
2. **Verify** with `npm run build` / `npm run lint`
3. **Correct** if errors (max 3 attempts)
4. **Escalate** if still failing
5. **Learn** and update project_intelligence.md

---

## Project-Specific Rules (CRITICAL)

### Multi-Tenancy

**Every database query MUST include school filtering:**

```typescript
// REQUIRED pattern
const authResult = await authorizeWithSchool(request, "resource:action");
if ("error" in authResult) return authResult.error;

const data = await prisma.resource.findMany({
  where: { schoolId: auth.user.schoolId }  // ALWAYS include this
});
```

### Authorization

**Every API route MUST have authorization:**

```typescript
// First line in every route handler
const authResult = await authorizeWithSchool(request, "permission:key");
if ("error" in authResult) return authResult.error;
```

### Known Security Issues

There are **6 critical/high security issues** tracked in `project_intelligence.md` Section 7. These must be fixed before production.

---

## File Structure

```
.agent/
├── QUICK_START.md                     # This file
├── orchestrator.md                    # Agent operating system
├── AUTONOMOUS_DEVELOPMENT_SYSTEM.md   # Full architecture
├── project_intelligence.md            # Shared knowledge base
├── roles/                             # Agent definitions
│   ├── SysArchitect.md
│   ├── CodeSmith.md
│   ├── PixelPerfect.md
│   ├── GuardRail.md
│   ├── ApiArchitect.md               # NEW
│   ├── TestRunner.md                 # NEW
│   └── SecurityAuditor.md            # NEW
├── workflows/                         # Workflow definitions
│   ├── feature_kickoff.md
│   ├── ui_revamp.md
│   ├── code_review.md
│   ├── autonomous_testing.md         # NEW
│   └── continuous_review.md          # NEW
├── plans/                            # Implementation plans
└── reports/                          # Test/security reports
```

---

## Verification Commands

```bash
# Build check (ALWAYS run after changes)
npm run build

# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Full test (when available)
npx vitest run
```

---

## Getting Help

1. **Read the agent file** for detailed instructions
2. **Check project_intelligence.md** for patterns and pitfalls
3. **Review AUTONOMOUS_DEVELOPMENT_SYSTEM.md** for full architecture
4. **Check TESTING_REPORTS.md** for known issues

---

## Next Steps

1. Start with a simple task to test the system
2. Run a security audit to understand current issues
3. Try the autonomous testing workflow
4. Contribute learnings to project_intelligence.md

Happy coding with your autonomous development team!
