# Changelog

All notable changes to SchoolMatica are documented in this file.

## [1.1.0] - 2026-01-19

### Assessment & Weighting System Fixes

#### Fixed
- **`use-weighting-logic.ts`**: Added support for `termWeights` parameter
  - Hook now accepts optional `initialTermWeights` as second parameter
  - Added `termWeightTotal` and `isTermWeightsValid` computed values
  - Added `effectiveWeights` calculation showing contribution to final grade
  - Added `updateTermWeight` and `balanceTermWeights` functions
  - Added `hasChanges` state tracking for save operations
  - Fixed recursive calculation issue in `updateWeightPercentage`

- **`unified-assessment-workspace.tsx`**: Fixed teacher permission logic
  - Teachers can now edit Draft plans (was incorrectly blocked)
  - Added `canSubmit`, `canApprove`, `canLock` computed permissions
  - Fixed variable declaration order causing build error

- **`weighting-dashboard.tsx`**: Complete rewrite with API integration
  - Added `planId` prop for API calls
  - Connected to `/api/assessment-plans/[planId]/weights` endpoint
  - Added term weight validation UI with auto-balance button
  - Added "Final Contribution" column showing effective weight
  - Added save status feedback (success/error alerts)

### School Setup Automation

#### Added
- **`/api/schools/[schoolId]/setup`**: New bulk setup endpoint
  - Creates grade levels in batch
  - Creates homeroom classes with naming patterns
  - Creates teacher records
  - Updates grading configuration with SA bands

- **School Setup Wizard**: Complete implementation
  - Step 1: School identity (name, code, contact info)
  - Step 2: Grade selection with phase grouping (Foundation, Intermediate, Senior, FET)
  - Step 3: Class structure with naming patterns (Alpha, Numeric, Custom)
  - Step 4: Staff invitations with role assignment
  - Quick-select buttons for Primary (R-7), High (8-12), Combined (R-12)

- **`wizard-types.ts`**: Comprehensive type definitions
  - `SCHOOL_PHASES` with SA curriculum phases
  - `DEFAULT_GRADING_BANDS` for each phase
  - `NAMING_PATTERNS` for class naming
  - `DEFAULT_GRADES` with phase and order information
  - `generateClassNames` utility function

### Production Containerization

#### Added
- **`/api/health`**: Health check endpoint
  - Database connectivity check with latency
  - Memory usage monitoring
  - Application info (version, uptime, environment)
  - Returns 200 OK or 503 Service Unavailable

- **`docker-entrypoint.sh`**: Container startup script
  - Waits for database connectivity
  - Runs Prisma migrations automatically
  - Graceful error handling with retries

- **`docker-compose.prod.yml`**: Production configuration
  - Environment variable management via `.env`
  - Required secrets validation
  - Resource limits (1GB memory)
  - Health checks for both services
  - Optional Nginx profile for SSL termination
  - Isolated network configuration

- **`.env.example`**: Environment variable template
  - Database configuration
  - Authentication secrets
  - Optional email and storage settings

#### Changed
- **`Dockerfile`**: Enhanced for production
  - Added OpenSSL for Prisma
  - Added health check instruction
  - Added entrypoint script
  - Improved layer caching

### Bug Fixes

#### Fixed
- **`/api/timetables/route.ts`**: Fixed syntax error in Prisma create call
- **`add-student-dialog.tsx`**: Fixed corrupted file structure with imports inside component
- **`create-timetable-form.tsx`**: Fixed duplicate `</Select>` tag
- **`check-permissions.ts`**: Fixed incorrect model name (`user` → `appUser`)

### Documentation

#### Added
- **`DEPLOYMENT_GUIDE.md`**: Comprehensive deployment documentation
  - Docker setup instructions
  - Environment configuration
  - SSL/TLS configuration
  - Backup and recovery procedures
  - Monitoring and troubleshooting

---

## [1.0.0] - Initial Release

- Assessment plan management
- Markbook with SBA calculations
- Role-based access control
- Multi-school support
- Docker containerization
