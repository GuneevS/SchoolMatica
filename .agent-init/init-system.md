# Agent Initialization System

*Portable, intelligent system for autonomous codebase analysis, agent configuration, and issue fixing.*

---

## Quick Start

To initialize this system on any codebase, invoke Claude Code with:

```
Read and execute .agent-init/init-system.md

Target: [folder path or "current"]
Mode: [review-only | propose-fixes | full-auto-fix]
```

---

## System Overview

This initialization system performs 4 phases:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENT INITIALIZATION SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
     ▼                              ▼                              ▼
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│  PHASE 1    │              │  PHASE 2    │              │  PHASE 3    │
│  DETECTION  │      →       │  REVIEW     │      →       │  FIX        │
│             │              │             │              │             │
│ Framework   │              │ Security    │              │ Auto-fix    │
│ Database    │              │ Quality     │              │ Propose     │
│ Auth        │              │ Personas    │              │ Document    │
│ UI          │              │ Structure   │              │ Verify      │
└─────────────┘              └─────────────┘              └─────────────┘
                                                                │
                                                                ▼
                                                         ┌─────────────┐
                                                         │  PHASE 4    │
                                                         │  REPORT     │
                                                         │             │
                                                         │ Generate    │
                                                         │ reports     │
                                                         └─────────────┘
```

---

## Phase 1: Codebase Detection

### Step 1.1: Framework Detection

Read and analyze the following files to detect framework:

```yaml
detection_order:
  1. package.json → Check dependencies for:
     - "next" → Next.js (check version for App Router vs Pages)
     - "react" without "next" → React (check for vite, CRA)
     - "vue" → Vue.js
     - "express" → Express.js
     - "@angular/core" → Angular

  2. requirements.txt / pyproject.toml → Check for:
     - "django" → Django
     - "fastapi" → FastAPI
     - "flask" → Flask

  3. Cargo.toml → Rust project

  4. go.mod → Go project

framework_indicators:
  nextjs:
    files: ["next.config.js", "next.config.mjs", "next.config.ts"]
    deps: ["next"]
    structure:
      app_router: "app/" directory exists
      pages_router: "pages/" directory exists
    version_check: package.json → dependencies.next

  react_vite:
    files: ["vite.config.ts", "vite.config.js"]
    deps: ["react", "vite"]

  vue:
    files: ["vue.config.js", "vite.config.ts with @vitejs/plugin-vue"]
    deps: ["vue"]

  django:
    files: ["manage.py", "settings.py", "*/settings/*.py"]
    deps: ["django"] in requirements.txt

  express:
    deps: ["express"]
    patterns: ["app.js", "server.js", "index.js" containing "express()"]
```

### Step 1.2: Database Detection

```yaml
database_detection:
  prisma:
    files: ["prisma/schema.prisma"]
    deps: ["@prisma/client", "prisma"]
    extract:
      - models: Parse model definitions from schema
      - provider: datasource db { provider = "..." }
      - relations: Parse relation fields

  typeorm:
    files: ["ormconfig.json", "data-source.ts", "typeorm.config.ts"]
    deps: ["typeorm"]

  sequelize:
    files: [".sequelizerc", "models/index.js"]
    deps: ["sequelize"]

  drizzle:
    files: ["drizzle.config.ts"]
    deps: ["drizzle-orm"]

  mongoose:
    deps: ["mongoose"]
    patterns: ["*.model.js", "*.model.ts" containing "Schema("]

  django_orm:
    patterns: ["*/models.py" containing "from django.db import models"]
```

### Step 1.3: Auth System Detection

```yaml
auth_detection:
  nextauth:
    deps: ["next-auth"]
    files: ["auth.ts", "auth.config.ts", "[...nextauth]/route.ts"]
    extract:
      - providers: Parse providers array
      - adapter: Check for prisma-adapter, drizzle-adapter
      - session_strategy: jwt or database

  clerk:
    deps: ["@clerk/nextjs"]
    files: ["middleware.ts" with clerkMiddleware]

  auth0:
    deps: ["@auth0/nextjs-auth0"]

  supabase:
    deps: ["@supabase/auth-helpers-nextjs", "@supabase/ssr"]

  firebase:
    deps: ["firebase"]
    files: ["firebase.config.ts", "firebase.config.js"]

  passport:
    deps: ["passport", "passport-*"]

  django_auth:
    patterns: ["settings.py" containing "django.contrib.auth"]

  custom_jwt:
    patterns: ["jsonwebtoken" in deps, jwt verification in middleware]
```

### Step 1.4: UI Library Detection

```yaml
ui_detection:
  tailwind:
    files: ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.cjs"]
    deps: ["tailwindcss"]
    version: Check devDependencies.tailwindcss

  shadcn:
    files: ["components.json"]
    structure: "components/ui/" directory

  mui:
    deps: ["@mui/material", "@emotion/react"]

  chakra:
    deps: ["@chakra-ui/react"]

  antd:
    deps: ["antd"]

  bootstrap:
    deps: ["bootstrap", "react-bootstrap"]

  radix:
    deps: ["@radix-ui/*"]
```

### Step 1.5: Project Structure Mapping

```yaml
structure_analysis:
  directories:
    - app/           # Next.js App Router pages/routes
    - pages/         # Next.js Pages Router
    - components/    # React components
    - lib/           # Utilities, helpers, services
    - utils/         # Alternative utilities folder
    - hooks/         # Custom React hooks
    - stores/        # State management (Zustand, Redux)
    - api/           # API routes or services
    - prisma/        # Prisma schema and migrations
    - public/        # Static assets
    - styles/        # CSS/SCSS files
    - tests/         # Test files
    - __tests__/     # Jest test convention

  file_counts:
    - *.ts, *.tsx    # TypeScript files
    - *.js, *.jsx    # JavaScript files
    - *.py           # Python files
    - *.css, *.scss  # Style files

  entry_points:
    nextjs:
      - app/layout.tsx
      - app/page.tsx
      - pages/_app.tsx
      - pages/index.tsx
    react:
      - src/main.tsx
      - src/App.tsx
      - src/index.tsx
    django:
      - manage.py
      - */urls.py
      - */views.py
```

### Detection Output Format

After detection, generate:

```yaml
# .agent/config.yaml

project:
  name: "ProjectName"
  root: "/path/to/project"
  detected_at: "2026-01-25T12:00:00Z"

stack:
  framework:
    name: "nextjs"
    version: "16.0.3"
    variant: "app_router"

  database:
    orm: "prisma"
    provider: "postgresql"
    models_count: 29

  auth:
    system: "nextauth"
    version: "5.0.0-beta.30"
    providers: ["credentials"]
    session: "jwt"

  ui:
    framework: "tailwind"
    version: "4.0.0"
    components: "shadcn"

  language:
    primary: "typescript"
    version: "5.x"

structure:
  api_routes: 54
  components: 90
  lib_files: 32
  total_files: 500+

verification:
  build: "npm run build"
  lint: "npm run lint"
  test: "npx vitest run"
  typecheck: "npx tsc --noEmit"
```

---

## Phase 2: Comprehensive Review

### Step 2.1: Structure Mapping

Execute the Structure Mapper workflow:
- Read: `.agent-init/reviewers/structure-mapper.md`

Output:
- Complete file inventory
- Dependency graph
- Entry point map
- Architectural pattern identification

### Step 2.2: Security Scanning

Execute the Security Scanner workflow:
- Read: `.agent-init/reviewers/security-scanner.md`

Check for:
- Missing authorization on API routes
- Multi-tenancy violations (missing school/tenant filtering)
- Injection vulnerabilities (SQL, XSS, command)
- Sensitive data exposure
- Hardcoded credentials

### Step 2.3: Quality Analysis

Execute the Quality Analyzer workflow:
- Read: `.agent-init/reviewers/quality-analyzer.md`

Check for:
- Type safety issues (`any` types, missing annotations)
- Logic errors (race conditions, missing transactions)
- Code smells (long functions, deep nesting)
- Performance issues (N+1 queries)

### Step 2.4: Persona Analysis

Execute the Persona Analyzer workflow:
- Read: `.agent-init/reviewers/persona-analyzer.md`

Identify:
- User roles from database models
- Permission structures
- User journeys through the application
- UX issues (missing states, confusing workflows)

---

## Phase 3: Autonomous Fixing

### Step 3.1: Issue Categorization

```yaml
categories:
  auto_fixable:
    description: "Safe to fix without approval"
    examples:
      - Missing imports
      - Simple type annotations
      - Lint errors (eslint --fix)
      - Import path aliases (@/ instead of relative)
      - Trailing commas, semicolons
    action: Apply immediately, verify with build

  semi_auto:
    description: "Generate fix, request approval before applying"
    examples:
      - Authorization pattern additions
      - Multi-tenancy filtering additions
      - Zod schema creation
      - Loading/error state additions
      - Transaction wrapping
    action: Generate fix, show to user, apply if approved

  manual:
    description: "Log for human review, do not attempt fix"
    examples:
      - Business logic changes
      - Database schema changes
      - Architectural decisions
      - Security policy decisions
      - Performance optimizations requiring refactoring
    action: Document in report, flag for human review
```

### Step 3.2: Apply Fixes

Execute the Auto-Fixer workflow:
- Read: `.agent-init/fixers/auto-fixer.md`
- Read: `.agent-init/fixers/fix-templates.md`

Self-Correction Protocol:
```
ATTEMPT 1:
  - Apply standard fix template
  - Run: npm run build
  - If pass → Done
  - If fail → Continue to Attempt 2

ATTEMPT 2:
  - Analyze error message
  - Read broader context (related files)
  - Apply alternative fix
  - Run: npm run build
  - If pass → Done
  - If fail → Continue to Attempt 3

ATTEMPT 3:
  - Check project_intelligence.md for similar patterns
  - Search codebase for working examples
  - Apply pattern-based fix
  - Run: npm run build
  - If pass → Done
  - If fail → ESCALATE

ESCALATE:
  - Document all 3 attempts
  - Capture error context
  - Generate escalation report
  - STOP and notify user
```

### Step 3.3: Verification

After each fix batch:
```bash
npm run build      # Must pass
npm run lint       # Must pass
npx tsc --noEmit   # Must pass (if TypeScript)
```

---

## Phase 4: Report Generation

### Generate Reports

Create the following in `.agent/reports/`:

1. **comprehensive_review.md**
   - Executive summary (health score 1-10)
   - Critical issues (must fix)
   - High priority issues
   - Medium/low priority issues
   - Architecture analysis
   - Recommendations

2. **persona_analysis.md**
   - Detected user roles
   - User journey maps
   - UX issues by persona
   - Improvement recommendations

3. **security_scan.md**
   - Vulnerability findings by severity
   - OWASP Top 10 alignment
   - Remediation guidance
   - Compliance checklist

4. **fixes_log.md**
   - All fixes applied
   - Verification results
   - Escalated issues
   - Knowledge updates

---

## Execution Commands

### Initialize on Current Folder

```
Execute the Agent Initialization System:

1. Read .agent-init/init-system.md
2. Run Phase 1: Detection on current folder
3. Run Phase 2: Comprehensive Review
4. Run Phase 3: Autonomous Fixing (mode: full-auto-fix)
5. Run Phase 4: Report Generation
6. Verify with: npm run build && npm run lint
```

### Initialize on Specific Folder

```
Execute the Agent Initialization System:

Target: /path/to/project
Mode: full-auto-fix

1. Change context to target folder
2. Execute all phases
3. Generate reports
4. Verify
```

---

## Configuration Options

```yaml
# Mode options
modes:
  review-only:
    description: "Only analyze, no fixes"
    phases: [detection, review, report]

  propose-fixes:
    description: "Analyze and propose fixes, don't apply"
    phases: [detection, review, propose, report]

  full-auto-fix:
    description: "Analyze, auto-fix safe issues, propose complex fixes"
    phases: [detection, review, fix, report]

# Scope options
scope:
  full: "Entire codebase"
  api: "Only API routes"
  components: "Only UI components"
  security: "Security-focused review only"
```

---

## Integration with Existing .agent/

If `.agent/` already exists:
1. Preserve existing configurations
2. Update `project_intelligence.md` with new findings
3. Enhance role files with detected patterns
4. Add new workflows if missing
5. Generate fresh reports

If `.agent/` doesn't exist:
1. Create full `.agent/` structure
2. Generate all configuration files
3. Create role files based on detected stack
4. Set up workflows appropriate to project
5. Initialize empty reports folder
