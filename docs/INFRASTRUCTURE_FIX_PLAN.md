# SchoolMatica Infrastructure Fix Plan
**Date:** January 29, 2026
**Priority:** Medium (Cleanup & Documentation)
**Estimated Time:** 1-2 hours

## Overview

This document outlines the step-by-step plan to address all issues identified in the Infrastructure Audit Report. All issues are non-critical and primarily involve cleanup and documentation updates.

---

## Phase 1: Immediate Cleanup (15 minutes)

### Task 1.1: Remove SQLite Database File
**Priority:** Low
**Time:** 1 minute
**Status:** ⏳ Pending

**Action:**
```bash
# Delete the development SQLite database file
rm prisma/dev.db
```

**Verification:**
```bash
# Confirm file is deleted
ls prisma/dev.db  # Should show "file not found"
```

**Impact:** Removes workspace clutter

---

### Task 1.2: Clean Up Log Files
**Priority:** Low
**Time:** 5 minutes
**Status:** ⏳ Pending

**Action:**
```bash
# Delete all log files in root directory
rm *.log
```

**Files to Remove:**
- app.log
- app_clean.log
- app_dev.log
- app_final.log
- app_new.log
- app_persist.log
- app_restart.log
- app_start_fresh.log
- app_start.log
- dev.log
- new_tunnel.log
- new_tunnel_44777.log
- next-server.log
- tunnel.log
- tunnel_fresh.log
- tunnel_persist.log

**Verification:**
```bash
# Confirm no log files remain
ls *.log  # Should show "no matches found"
```

**Impact:** Cleaner repository

---

### Task 1.3: Update .gitignore
**Priority:** Low
**Time:** 2 minutes
**Status:** ⏳ Pending

**Action:**
Update `.gitignore` to ensure log files are ignored in future:

**Current .gitignore already includes:** ✅
```
# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
```

**Verification:** Already covered, no action needed

---

## Phase 2: Documentation Updates (30 minutes)

### Task 2.1: Update README.md
**Priority:** High
**Time:** 10 minutes
**Status:** ⏳ Pending

**Changes Required:**

**Line 50:** 
```diff
- SQLite (included) or PostgreSQL (production)
+ PostgreSQL (containerized)
```

**Lines 79-82 (Environment Variables section):**
```diff
-DATABASE_URL="file:./dev.db"
+DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:13808/schoolmatica?schema=public"
 NODE_ENV="development"
+NEXTAUTH_SECRET="development-secret-change-in-production"
+NEXTAUTH_URL="http://localhost:13807"
```

**Lines 84-89 (Production section):**
```diff
-For production with PostgreSQL:
+For production:

 ```env
-DATABASE_URL="postgresql://user:password@localhost:5432/schoolmatica"
+DATABASE_URL="postgresql://schoolmatica:CHANGE_PASSWORD@postgres:5432/schoolmatica?schema=public"
+NEXTAUTH_SECRET="CHANGE_THIS_TO_SECURE_SECRET"
+NEXTAUTH_URL="https://yourdomain.com"
+REDIS_URL="redis://redis:6379"
 NODE_ENV="production"
 ```
```

**Line 111:**
```diff
-- **SQLite**: Development database
+- **PostgreSQL**: Production-grade database
```

**Lines 160-168 (Docker section):**
Update deployment instructions to reference docker-compose files:
```diff
 ### Docker (Recommended)

 ```bash
-# Build image
-docker build -t schoolmatica .
+# Development (with hot-reload)
+docker compose -f docker-compose.dev.yml up -d

-# Run container
-docker run -p 3000:3000 -e DATABASE_URL="..." schoolmatica
+# Production
+docker compose -f docker-compose.prod.yml up -d
+
+# Access application at http://localhost:13807
 ```
```

**Verification:**
- Search for "SQLite" in README.md - should only appear in acknowledgments or history
- All database URLs should reference PostgreSQL

---

### Task 2.2: Update docs/PRODUCT_BLUEPRINT.md
**Priority:** Medium
**Time:** 3 minutes
**Status:** ⏳ Pending

**Line 10:**
```diff
-- **Tech stack:** Next 14 App Router, Tailwind + shadcn/ui, Prisma (SQLite dev), API routes only, domain logic in `/lib`.
+- **Tech stack:** Next.js 16 App Router, Tailwind + shadcn/ui, Prisma (PostgreSQL), API routes, domain logic in `/lib`.
```

**Verification:** No remaining SQLite references

---

### Task 2.3: Update docs/IMPLEMENTATION_CHECKLIST.md
**Priority:** Medium
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 9:**
```diff
-- [x] Prisma ORM with SQLite
+- [x] Prisma ORM with PostgreSQL
+- [x] Fully containerized with Docker
+- [x] Multi-environment Docker Compose files (dev/prod)
```

**Verification:** Checklist reflects current architecture

---

### Task 2.4: Update docs/FEATURE_SUMMARY.md
**Priority:** Medium
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 156:**
```diff
-- Prisma ORM with SQLite (Postgres-ready)
+- Prisma ORM with PostgreSQL
+- Fully containerized application
+- Docker Compose for multi-environment deployment
+- Database migrations with Prisma
```

**Verification:** Features list is accurate

---

### Task 2.5: Update docs/CODEX_PROMPT.md
**Priority:** Medium
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 5:**
```diff
-1. **Stack lock:** Next.js 14 App Router + TypeScript, Tailwind, shadcn/ui, Prisma (SQLite dev, Postgres-compatible), React Hook Form + Zod.
+1. **Stack lock:** Next.js 16 App Router + TypeScript, Tailwind, shadcn/ui, Prisma (PostgreSQL), React Hook Form + Zod, Docker.
```

**Verification:** Tech stack accurately reflects current state

---

### Task 2.6: Update MarkbookSaaS_docs/docs/PRODUCT_BLUEPRINT.md
**Priority:** Low
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 205:**
```diff
-- Prisma + SQLite now; Postgres-ready schema.
+- Prisma + PostgreSQL with full containerization.
```

**Verification:** Historical docs updated

---

### Task 2.7: Update MarkbookSaaS_docs/docs/CODEX_PROMPT.md
**Priority:** Low
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 35:**
```diff
-- **Database:** SQLite (for dev), but schema must be Postgres-friendly
+- **Database:** PostgreSQL (containerized for all environments)
```

**Verification:** Development guidelines updated

---

### Task 2.8: Update MarkbookSaaS_docs/DEV_WORKFLOW.md
**Priority:** Low
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 47:**
```diff
-> Initialise a Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + SQLite project in this repo.
+> Initialise a Next.js 16 + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL + Docker project in this repo.
```

**Verification:** Workflow reflects current stack

---

### Task 2.9: Update MarkbookSaaS_docs/AGENTS.md
**Priority:** Low
**Time:** 2 minutes
**Status:** ⏳ Pending

**Line 32:**
```diff
-  - Add Prisma and configure SQLite as default.
+  - Add Prisma and configure PostgreSQL with Docker.
```

**Line 72:**
```diff
-   - `DATABASE_URL` for SQLite in `.env`.
+   - `DATABASE_URL` for PostgreSQL in `.env`.
+   - Docker Compose configuration for local development.
```

**Verification:** Agent configuration docs updated

---

## Phase 3: Configuration Updates (10 minutes)

### Task 3.1: Create .env.example
**Priority:** High
**Time:** 5 minutes
**Status:** ⏳ Pending

**Action:**
Create `.env.example` with all required variables:

**File:** `.env.example`
```env
# =============================================================================
# SchoolMatica Environment Configuration
# Copy this file to .env and update with your values
# =============================================================================

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------
# Development (Docker):
# DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:13808/schoolmatica?schema=public"
#
# Production (Docker internal):
# DATABASE_URL="postgresql://schoolmatica:CHANGE_PASSWORD@postgres:5432/schoolmatica?schema=public"
#
# Local development (without Docker):
DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:5432/schoolmatica?schema=public"

# -----------------------------------------------------------------------------
# NextAuth Configuration
# -----------------------------------------------------------------------------
# Generate a secure secret with: openssl rand -base64 32
NEXTAUTH_SECRET="change-this-to-a-secure-random-secret"

# Development:
# NEXTAUTH_URL="http://localhost:13807"  # Docker
# NEXTAUTH_URL="http://localhost:44777"  # Local dev server
#
# Production:
NEXTAUTH_URL="https://yourdomain.com"

# Required for NextAuth v5
AUTH_TRUST_HOST="true"

# -----------------------------------------------------------------------------
# Redis Configuration (Optional)
# -----------------------------------------------------------------------------
# REDIS_URL="redis://localhost:13809"  # Development
# REDIS_URL="redis://redis:6379"       # Production

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------
NODE_ENV="development"

# -----------------------------------------------------------------------------
# Email Configuration (Future)
# -----------------------------------------------------------------------------
# SMTP_HOST=""
# SMTP_PORT=""
# SMTP_USER=""
# SMTP_PASSWORD=""
# SMTP_FROM=""

# -----------------------------------------------------------------------------
# S3 Backup Configuration (Production, Optional)
# -----------------------------------------------------------------------------
# AWS_ACCESS_KEY_ID=""
# AWS_SECRET_ACCESS_KEY=""
# AWS_S3_BUCKET=""
# AWS_REGION="af-south-1"
```

**Verification:**
```bash
# Confirm file exists and is complete
cat .env.example | grep DATABASE_URL
```

---

### Task 3.2: Update .env for Docker
**Priority:** High
**Time:** 2 minutes
**Status:** ⏳ Pending

**Current .env:**
```env
DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:13808/schoolmatica?schema=public"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:44777"
```

**Updated .env (Docker-ready):**
```env
# SchoolMatica Development Environment
# For Docker Compose: docker-compose.dev.yml

DATABASE_URL="postgresql://schoolmatica:dev_password_only@localhost:13808/schoolmatica?schema=public"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:13807"  # Updated to match Docker port
AUTH_TRUST_HOST="true"
NODE_ENV="development"

# Optional: Enable Redis
# REDIS_URL="redis://localhost:13809"
```

**Verification:**
- NEXTAUTH_URL should match Docker external port (13807)
- All required variables present

---

### Task 3.3: Add Development Instructions
**Priority:** Medium
**Time:** 3 minutes
**Status:** ⏳ Pending

**Action:**
Create `docs/DEVELOPMENT.md` with clear setup instructions

**File:** `docs/DEVELOPMENT.md`
```markdown
# Development Guide

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop or Docker Engine 20.10+
- Docker Compose V2

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd SchoolMatica
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for Docker)
   ```

3. **Start development environment**
   ```bash
   # Start core services (PostgreSQL + App)
   docker compose -f docker-compose.dev.yml up -d
   
   # Optional: Start with database admin UI
   docker compose -f docker-compose.dev.yml --profile with-adminer up -d
   
   # Optional: Start with email testing
   docker compose -f docker-compose.dev.yml --profile with-mail up -d
   ```

4. **Run database migrations**
   ```bash
   docker exec schoolmatica_app_dev npx prisma migrate dev
   ```

5. **Seed demo data (optional)**
   ```bash
   docker exec schoolmatica_app_dev npx prisma db seed
   ```

6. **Access the application**
   - **App:** http://localhost:13807
   - **Adminer (if enabled):** http://localhost:13810
   - **MailHog (if enabled):** http://localhost:13812

### Development Workflow

#### View logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# App only
docker compose -f docker-compose.dev.yml logs -f app

# Database only
docker compose -f docker-compose.dev.yml logs -f postgres
```

#### Restart services
```bash
# Restart app
docker compose -f docker-compose.dev.yml restart app

# Restart all
docker compose -f docker-compose.dev.yml restart
```

#### Execute commands in container
```bash
# Open shell in app container
docker exec -it schoolmatica_app_dev sh

# Run Prisma commands
docker exec schoolmatica_app_dev npx prisma studio
docker exec schoolmatica_app_dev npx prisma migrate dev
docker exec schoolmatica_app_dev npx prisma db push
```

#### Stop services
```bash
# Stop (keeps data)
docker compose -f docker-compose.dev.yml down

# Stop and remove data
docker compose -f docker-compose.dev.yml down -v
```

## Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/schoolmatica?schema=public"
   NEXTAUTH_URL="http://localhost:44777"
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed  # Optional: demo data
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access at:** http://localhost:44777

## Database Management

### Migrations
```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Prisma Studio
```bash
# Open database GUI
npx prisma studio
```

## Troubleshooting

### Port already in use
```bash
# Check what's using ports
netstat -ano | findstr :13807
netstat -ano | findstr :13808

# Kill process or change ports in docker-compose.dev.yml
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Check logs
docker compose -f docker-compose.dev.yml logs postgres

# Restart database
docker compose -f docker-compose.dev.yml restart postgres
```

### App won't start
```bash
# Check logs for errors
docker compose -f docker-compose.dev.yml logs app

# Rebuild app container
docker compose -f docker-compose.dev.yml build app
docker compose -f docker-compose.dev.yml up -d app
```

### Clear all Docker data
```bash
# Nuclear option: Remove everything
docker compose -f docker-compose.dev.yml down -v
docker system prune -a --volumes
```

## Testing

### Run linter
```bash
npm run lint
```

### Type checking
```bash
npx tsc --noEmit
```

### Build for production
```bash
npm run build
```

## Environment Variables Reference

See `.env.example` for complete list of environment variables and their descriptions.

## Port Reference

| Service  | Port  | URL                        |
|----------|-------|----------------------------|
| App      | 13807 | http://localhost:13807     |
| Database | 13808 | postgresql://localhost:13808 |
| Redis    | 13809 | redis://localhost:13809    |
| Adminer  | 13810 | http://localhost:13810     |
| MailHog  | 13812 | http://localhost:13812     |
```

**Verification:** Documentation is clear and actionable

---

## Phase 4: Testing & Verification (15-30 minutes)

### Task 4.1: Start Application in Docker
**Priority:** Critical
**Time:** 5 minutes
**Status:** ⏳ Pending

**Action:**
```bash
# Ensure any existing containers are stopped
docker compose -f docker-compose.dev.yml down

# Start fresh
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
docker compose -f docker-compose.dev.yml ps
```

**Expected Output:**
```
NAME                         STATUS                   PORTS
schoolmatica_app_dev         Up (healthy)             0.0.0.0:13807->3000/tcp
schoolmatica_db_dev          Up (healthy)             0.0.0.0:13808->5432/tcp
schoolmatica_dev_network     Created
```

**Verification:**
- All containers show "Up (healthy)"
- No error messages in logs

---

### Task 4.2: Run Database Migrations
**Priority:** Critical
**Time:** 2 minutes
**Status:** ⏳ Pending

**Action:**
```bash
docker exec schoolmatica_app_dev npx prisma migrate deploy
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "schoolmatica"
X migrations found in prisma/migrations
All migrations have been successfully applied.
```

**Verification:**
- No error messages
- Database schema is up to date

---

### Task 4.3: Seed Demo Data (Optional)
**Priority:** Low
**Time:** 3 minutes
**Status:** ⏳ Pending

**Action:**
```bash
docker exec schoolmatica_app_dev npx prisma db seed
```

**Verification:**
- Demo data created successfully
- No errors

---

### Task 4.4: Test Health Endpoint
**Priority:** Critical
**Time:** 1 minute
**Status:** ⏳ Pending

**Action:**
```bash
curl http://localhost:13807/api/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T...",
  "responseTime": <number>,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": <number>
    },
    "memory": {
      "status": "healthy"
    }
  },
  "app": {
    "name": "SchoolMatica",
    "version": "1.0.0"
  }
}
```

**Verification:**
- status: "healthy"
- database status: "healthy"

---

### Task 4.5: Test Landing Page
**Priority:** Critical
**Time:** 2 minutes
**Status:** ⏳ Pending

**Action:**
1. Open browser
2. Navigate to http://localhost:13807
3. Verify landing page loads completely

**Verification Checklist:**
- [ ] Page loads without errors
- [ ] Navigation bar visible
- [ ] Hero section renders
- [ ] All sections load (Problem, Features, Demo, Testimonials, Pricing, FAQ, CTA)
- [ ] Footer renders
- [ ] Interactive background animation works
- [ ] No console errors in browser DevTools

---

### Task 4.6: Test Login Page
**Priority:** High
**Time:** 2 minutes
**Status:** ⏳ Pending

**Action:**
Navigate to http://localhost:13807/login

**Verification:**
- [ ] Login form renders
- [ ] No database connection errors
- [ ] Form validation works

---

### Task 4.7: View Container Logs
**Priority:** Medium
**Time:** 3 minutes
**Status:** ⏳ Pending

**Action:**
```bash
# View app logs
docker compose -f docker-compose.dev.yml logs app | tail -50

# View database logs
docker compose -f docker-compose.dev.yml logs postgres | tail -50
```

**Verification:**
- No error messages
- App started successfully
- Database connections successful

---

### Task 4.8: Test Adminer (Database UI)
**Priority:** Low
**Time:** 3 minutes
**Status:** ⏳ Pending

**Action:**
```bash
# Start with Adminer profile
docker compose -f docker-compose.dev.yml --profile with-adminer up -d

# Open browser
# Navigate to http://localhost:13810
```

**Login Credentials:**
- System: PostgreSQL
- Server: postgres
- Username: schoolmatica
- Password: dev_password_only
- Database: schoolmatica

**Verification:**
- [ ] Adminer UI loads
- [ ] Can connect to database
- [ ] Can see database tables

---

## Phase 5: Documentation Finalization (10 minutes)

### Task 5.1: Update INFRASTRUCTURE_AUDIT_REPORT.md
**Priority:** Medium
**Time:** 3 minutes
**Status:** ⏳ Pending

**Action:**
Update status of all issues from "⏳ Pending" to "✅ Fixed"

---

### Task 5.2: Create DEPLOYMENT_CHECKLIST.md
**Priority:** High
**Time:** 7 minutes
**Status:** ⏳ Pending

**Action:**
Create comprehensive deployment checklist (see separate document)

---

## Summary of Changes

### Files to Create
- [ ] `.env.example`
- [ ] `docs/DEVELOPMENT.md`
- [ ] `docs/DEPLOYMENT_CHECKLIST.md`

### Files to Delete
- [ ] `prisma/dev.db`
- [ ] All `*.log` files in root (14 files)

### Files to Modify
- [ ] `README.md`
- [ ] `.env`
- [ ] `docs/PRODUCT_BLUEPRINT.md`
- [ ] `docs/IMPLEMENTATION_CHECKLIST.md`
- [ ] `docs/FEATURE_SUMMARY.md`
- [ ] `docs/CODEX_PROMPT.md`
- [ ] `MarkbookSaaS_docs/docs/PRODUCT_BLUEPRINT.md`
- [ ] `MarkbookSaaS_docs/docs/CODEX_PROMPT.md`
- [ ] `MarkbookSaaS_docs/DEV_WORKFLOW.md`
- [ ] `MarkbookSaaS_docs/AGENTS.md`

### Total Files Affected: 25 files

---

## Execution Order

1. ✅ Create audit report (DONE)
2. ✅ Create fix plan (DONE - this document)
3. ⏳ Execute Phase 1: Cleanup
4. ⏳ Execute Phase 2: Documentation
5. ⏳ Execute Phase 3: Configuration
6. ⏳ Execute Phase 4: Testing
7. ⏳ Execute Phase 5: Finalization

---

## Success Criteria

- [ ] No SQLite references in documentation
- [ ] No SQLite database files in workspace
- [ ] No log files in root directory
- [ ] `.env.example` file exists with comprehensive documentation
- [ ] Application starts successfully in Docker
- [ ] Health endpoint returns healthy status
- [ ] Landing page loads without errors
- [ ] Database migrations apply successfully
- [ ] All documentation is accurate and up-to-date

---

**Plan Created By:** Infrastructure Audit System
**Plan Version:** 1.0
**Execution Status:** Ready to Execute
