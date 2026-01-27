# Stack Detector

*Intelligent detection of framework, database, auth, and UI libraries.*

---

## Purpose

This detector analyzes a codebase to identify:
1. **Framework** - Next.js, React, Vue, Django, Express, etc.
2. **Database** - Prisma, TypeORM, Sequelize, Mongoose, etc.
3. **Authentication** - NextAuth, Clerk, Auth0, Passport, etc.
4. **UI Libraries** - Tailwind, ShadCN, MUI, Chakra, etc.
5. **Project Structure** - Files, folders, patterns

---

## Detection Workflow

```
START
  │
  ▼
Read package.json / requirements.txt / Cargo.toml
  │
  ▼
Identify primary language (TypeScript/JavaScript/Python/Rust/Go)
  │
  ▼
Detect framework from dependencies
  │
  ▼
Detect database/ORM from files and dependencies
  │
  ▼
Detect auth system from files and dependencies
  │
  ▼
Detect UI libraries from files and dependencies
  │
  ▼
Map project structure (directories, file counts)
  │
  ▼
Generate config.yaml
  │
  ▼
END
```

---

## Step 1: Read Package Manager Files

### For Node.js Projects

```typescript
// Read package.json
const packageJson = await readFile("package.json");

// Extract dependencies
const deps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};
```

### For Python Projects

```python
# Read requirements.txt
requirements = await readFile("requirements.txt")

# Or read pyproject.toml
pyproject = await readFile("pyproject.toml")
```

---

## Step 2: Framework Detection

### Next.js Detection

```yaml
indicators:
  - package.json has "next" in dependencies
  - Files: next.config.js, next.config.mjs, next.config.ts

version_detection:
  - Read dependencies.next from package.json

variant_detection:
  app_router:
    - Directory "app/" exists
    - Has app/layout.tsx or app/layout.js
  pages_router:
    - Directory "pages/" exists
    - No "app/" directory

features:
  server_components: version >= 13
  app_router: version >= 13 AND app/ exists
  server_actions: version >= 14
```

### React (Non-Next) Detection

```yaml
indicators:
  - "react" in dependencies
  - "next" NOT in dependencies

variant_detection:
  vite:
    - "vite" in dependencies
    - vite.config.ts or vite.config.js exists
  cra:
    - "react-scripts" in dependencies
  custom:
    - webpack.config.js exists
    - Custom bundler setup
```

### Vue Detection

```yaml
indicators:
  - "vue" in dependencies

variant_detection:
  vue3:
    - "vue" version >= 3
  nuxt:
    - "nuxt" in dependencies
  vite:
    - "@vitejs/plugin-vue" in dependencies
```

### Django Detection

```yaml
indicators:
  - requirements.txt contains "django" or "Django"
  - File: manage.py exists
  - File: settings.py or */settings/*.py exists

features:
  rest_framework: "djangorestframework" in requirements
  ninja: "django-ninja" in requirements
```

### Express Detection

```yaml
indicators:
  - "express" in dependencies

features:
  typescript: "ts-node" or "@types/express" in devDependencies
```

---

## Step 3: Database Detection

### Prisma Detection

```yaml
indicators:
  - File: prisma/schema.prisma exists
  - "@prisma/client" in dependencies

extract_from_schema:
  provider: |
    datasource db {
      provider = "postgresql" | "mysql" | "sqlite" | "mongodb"
    }

  models: |
    Parse all "model ModelName { ... }" blocks

  relations: |
    Parse @relation directives

output:
  orm: "prisma"
  provider: "postgresql"
  models:
    - name: "User"
      fields: ["id", "email", "name", ...]
    - name: "Post"
      fields: ["id", "title", "content", ...]
  models_count: 29
```

### TypeORM Detection

```yaml
indicators:
  - "typeorm" in dependencies
  - Files: ormconfig.json, data-source.ts, typeorm.config.ts

extract:
  entities: Parse @Entity() decorated classes
  database: Read type from config
```

### Sequelize Detection

```yaml
indicators:
  - "sequelize" in dependencies
  - Files: .sequelizerc, config/config.json

extract:
  models: Parse models/ directory
  database: Read from config
```

### Mongoose Detection

```yaml
indicators:
  - "mongoose" in dependencies
  - Files: *.model.js, *.model.ts with Schema definition

extract:
  schemas: Parse mongoose.Schema definitions
```

---

## Step 4: Auth System Detection

### NextAuth Detection

```yaml
indicators:
  - "next-auth" in dependencies

files_to_check:
  - auth.ts
  - auth.config.ts
  - lib/auth.ts
  - app/api/auth/[...nextauth]/route.ts

extract:
  providers: |
    Parse providers array from auth config
    Examples: Credentials, Google, GitHub, etc.

  adapter: |
    Check for:
    - @auth/prisma-adapter
    - @auth/drizzle-adapter
    - Custom adapter

  session_strategy: |
    session: { strategy: "jwt" | "database" }

  callbacks: |
    List defined callbacks: jwt, session, signIn, redirect

output:
  system: "nextauth"
  version: "5.0.0-beta.30"
  providers: ["credentials"]
  adapter: "prisma"
  session: "jwt"
  callbacks: ["jwt", "session", "authorized"]
```

### Clerk Detection

```yaml
indicators:
  - "@clerk/nextjs" in dependencies

files_to_check:
  - middleware.ts with clerkMiddleware

extract:
  protected_routes: Parse middleware configuration
```

### Custom JWT Detection

```yaml
indicators:
  - "jsonwebtoken" in dependencies
  - No recognized auth library

patterns_to_find:
  - jwt.sign() calls
  - jwt.verify() calls
  - Authorization header parsing
```

---

## Step 5: UI Library Detection

### Tailwind CSS Detection

```yaml
indicators:
  - "tailwindcss" in devDependencies
  - Files: tailwind.config.js, tailwind.config.ts, tailwind.config.cjs

extract:
  version: devDependencies.tailwindcss
  plugins: content.plugins array
  custom_config: theme.extend

features:
  jit: version >= 3
  css_variables: Check for css variables in config
```

### ShadCN/UI Detection

```yaml
indicators:
  - File: components.json exists
  - Directory: components/ui/ exists

extract_from_components_json:
  style: "default" | "new-york"
  tailwind:
    config: path to tailwind config
    css: path to globals.css
  aliases:
    components: "@/components"
    utils: "@/lib/utils"

installed_components:
  - List all files in components/ui/
  - Examples: button.tsx, card.tsx, dialog.tsx
```

### Material UI Detection

```yaml
indicators:
  - "@mui/material" in dependencies
  - "@emotion/react" in dependencies (usually paired)

extract:
  version: dependencies["@mui/material"]
  theme: Check for ThemeProvider usage
```

### Chakra UI Detection

```yaml
indicators:
  - "@chakra-ui/react" in dependencies

extract:
  version: dependencies["@chakra-ui/react"]
  theme: Check for ChakraProvider usage
```

---

## Step 6: Project Structure Analysis

### Directory Mapping

```yaml
directories_to_check:
  nextjs_app_router:
    - app/            # Pages and routes
    - app/api/        # API routes
    - components/     # React components
    - lib/            # Utilities
    - hooks/          # Custom hooks
    - stores/         # State management

  nextjs_pages_router:
    - pages/          # Pages
    - pages/api/      # API routes
    - components/
    - lib/

  react_vite:
    - src/
    - src/components/
    - src/hooks/
    - src/utils/

  django:
    - */             # Apps
    - */models.py
    - */views.py
    - */urls.py
    - templates/
```

### File Counting

```yaml
file_patterns:
  typescript:
    - "**/*.ts"
    - "**/*.tsx"

  javascript:
    - "**/*.js"
    - "**/*.jsx"

  python:
    - "**/*.py"

  styles:
    - "**/*.css"
    - "**/*.scss"

  tests:
    - "**/*.test.ts"
    - "**/*.test.tsx"
    - "**/*.spec.ts"
    - "**/__tests__/**"

exclude:
  - node_modules/
  - .next/
  - dist/
  - build/
  - __pycache__/
```

### Entry Point Detection

```yaml
entry_points:
  nextjs_app:
    main_layout: "app/layout.tsx"
    home_page: "app/page.tsx"
    api_routes: "app/api/**/route.ts"

  nextjs_pages:
    app: "pages/_app.tsx"
    document: "pages/_document.tsx"
    home: "pages/index.tsx"
    api_routes: "pages/api/**/*.ts"

  react:
    main: "src/main.tsx" or "src/index.tsx"
    app: "src/App.tsx"

  django:
    manage: "manage.py"
    urls: "*/urls.py"
    wsgi: "*/wsgi.py"
```

---

## Output: config.yaml

Generate the final configuration:

```yaml
# .agent/config.yaml

project:
  name: "SchoolMatica"
  root: "C:/Users/Guneev/.claude-worktrees/SchoolMatica/heuristic-noyce"
  detected_at: "2026-01-25T12:00:00Z"

stack:
  framework:
    name: "nextjs"
    version: "16.0.3"
    variant: "app_router"
    features:
      - server_components
      - server_actions
      - middleware

  database:
    orm: "prisma"
    provider: "postgresql"
    schema: "prisma/schema.prisma"
    models_count: 29
    key_models:
      - School
      - AppUser
      - ClassGroup
      - Student
      - AssessmentPlan
      - Mark

  auth:
    system: "nextauth"
    version: "5.0.0-beta.30"
    session: "jwt"
    providers:
      - credentials
    adapter: "prisma"
    multi_tenancy:
      enabled: true
      scope_field: "schoolId"

  ui:
    framework: "tailwind"
    version: "4.0.0"
    component_library: "shadcn"
    icons: "lucide-react"
    state_management: "zustand"

  language:
    primary: "typescript"
    version: "5.x"
    strict_mode: true

structure:
  directories:
    app: true
    components: true
    lib: true
    prisma: true
    public: true
  file_counts:
    typescript: 200+
    components: 90+
    api_routes: 54
    lib_utilities: 32
  entry_points:
    layout: "app/layout.tsx"
    home: "app/page.tsx"
    middleware: "middleware.ts"

verification:
  build: "npm run build"
  lint: "npm run lint"
  test: "npx vitest run"
  typecheck: "npx tsc --noEmit"

patterns:
  authorization: "authorizeWithSchool(request, permission)"
  multi_tenancy: "where: { schoolId }"
  validation: "zod schemas with safeParse"
  audit_logging: "auditFromAuth({ auth, entityType, ... })"
```

---

## Usage

To run detection:

```
I am the Stack Detector.

1. Read package.json to identify dependencies
2. Check for framework-specific config files
3. Read prisma/schema.prisma for database info
4. Check lib/auth.ts or auth.config.ts for auth system
5. Check tailwind.config.ts and components.json for UI
6. Map directory structure and count files
7. Generate .agent/config.yaml with all findings
```
