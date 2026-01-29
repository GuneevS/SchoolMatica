# Changelog

All notable changes to SchoolMatica are documented in this file.

## [2.2.0] - 2026-01-29 - Comprehensive Platform Enhancement

### Platform Admin Login
- Added "Platform Admin" tab to the login form for super admin access
- Platform admin redirects directly to `/super-admin` dashboard
- School selector is hidden when Platform Admin role is selected
- Appropriate placeholder text and messaging for platform admin login

### UI/UX Improvements
- **Forced Light Mode**: Removed all dark mode CSS and enforced light-only theme
- Updated `ThemeProvider` to always force light mode
- Disabled `ThemeToggle` component (returns null)
- Cleaned up `globals.css` by removing `.dark` class definitions
- Updated `layout.tsx` theme initialization script to always set light mode

### Finance Module - SA Compliant Accounting System

#### API Endpoints
- `POST/GET /api/fees/invoices` - Create and list invoices with INV-YYYY-XXXXX format
- `GET/PATCH/DELETE /api/fees/invoices/[invoiceId]` - Manage individual invoices
- `POST/GET /api/fees/payments` - Record payments with PAY-YYYY-XXXXX format
- `GET/POST /api/fees/ledger/[studentId]` - Account ledger with adjustment entries
- `POST/GET /api/fees/reconcile` - Reconciliation with overdue marking and collection stats

#### Parent Portal Finance Features
- New `/parent/fees` page with account statement view
- Summary cards showing outstanding balance, paid, and total invoiced
- Multi-child support with selector when parent has multiple children
- Tabbed interface: Overview, Invoices, and Statement views
- Transaction history with debit/credit ledger entries

#### PDF Statement Generation
- API endpoint `/api/parent/statements/[studentId]/pdf`
- Professional HTML statement with school branding
- Transaction history table with running balances
- Payment information for outstanding balances

#### Payment Gateway Integration
- PayFast integration for South African payments
- API endpoint `/api/parent/payments/initiate` for payment initiation
- Webhook handler `/api/parent/payments/webhook` for ITN processing
- Support for EFT, Card, SnapScan, and PayFast methods
- Automatic invoice and ledger updates on successful payment

### Pricing Updates
- Updated Starter tier: R50,000/year (R4,167/month) - Up to 500 learners
- Updated Professional tier: R75,000/year (R6,250/month) - Up to 1,500 learners
- Updated Enterprise tier: R125,000/year (R10,417/month) - Unlimited
- Added new features to pricing plans: fee management, online payments, accounting

### Behavior Management - Configurable Demerit Thresholds

#### Threshold Configuration
- New `ThresholdConfig` component for school admin configuration
- Visual timeline showing threshold points (5, 10, 15, 20 demerits)
- Configurable recipients per threshold: Parent, HOD, Principal
- Configurable actions: Warning, Parent Meeting, Detention, Suspension Warning, Hearing
- Email notification toggle per threshold

#### Automatic Notifications
- Added `checkDemeritThresholds` function in notifications library
- Automatic detection when student crosses threshold points
- Creates `BehaviorThresholdTrigger` records for tracking
- Sends bulk notifications to configured recipients

#### API Endpoints
- `POST/GET/PUT /api/behavior/policies` - Manage behavior policies with thresholds

### Assessment Resource Library
- New `/resources` page for browsing assessment documents
- Resource browser component with grid and list views
- Filtering by subject, grade, category (Rubric, Memo, Question Paper)
- Search functionality across file names and assessment names
- Download tracking with direct file access
- API endpoint `/api/resources` for listing and searching

### Learner Registration Enhancement
- Added SA standard document requirements checklist
- Required documents: Birth Certificate, Parent ID, Proof of Residence, Immunization Card, Passport Photo
- Optional documents: Transfer Card, Previous School Report, Medical Certificate
- Visual progress indicator showing completion percentage
- Document status workflow: Missing → Submitted → Verified
- Inline verification actions for administrators

### Access Control
- Added finance permission check to `/fees` page
- Finance access granted to: super admin, school admin, bursar, finance_admin, accountant
- Permission-based access using `finance:read`, `finance:write`, `fees:manage`

### Bug Fixes & Improvements
- Updated behavior incidents API to call `checkDemeritThresholds` on new demerits
- Fixed theme provider to use simpler light-mode-only logic
- All new components follow established patterns and use shadcn/ui components

---

## [2.1.0] - 2026-01-29 - Deep Feature Implementation & Docker Deployment

### Homework System - Complete Implementation

#### Added
- **Homework API Endpoints**:
  - `POST/GET /api/homework` - Create and list homework
  - `GET/PATCH/DELETE /api/homework/[homeworkId]` - Manage individual homework
  - `GET/PATCH /api/homework/[homeworkId]/submissions` - Manage student submissions
  - `POST /api/homework/[homeworkId]/notify-parents` - Bulk parent notifications
- **Parent Homework Visibility**:
  - Homework section on parent dashboard with upcoming/overdue view
  - Full homework page at `/parent/homework` with filtering
  - Navigation badge showing pending homework count
- **Parent Notification System**:
  - Personalized email template with student/homework details
  - In-app notifications for parents
  - Bulk notification for inadequate submissions

### Markbook Validation

#### Fixed
- **Server-side Validation**: Marks must be between 0 and total marks
- **Client-side Validation**: Negative marks rejected with visual feedback
- **Visual Feedback**: Red border and tooltip for invalid marks

### Bug Fixes

#### Fixed
- `createBulkNotifications` function signature mismatch causing runtime errors
- `recordAuditLog` incorrectly passing `prisma` parameter
- `notifyParentsOfBehaviorIncident` function signature mismatch
- Multiple TypeScript compilation errors across 15+ files
- Null handling in notification API routes
- Missing authentication checks in behavior incidents

### Docker Deployment

#### Added
- Full Docker containerization with `docker-compose.yml`
- PostgreSQL 15 Alpine container with health checks
- Application container with production build
- Database seeding automation with Super Admin user

### Document System Review

#### Verified
- Multiple file format support (PDF, PNG, JPEG)
- Document versioning system
- Approval workflow (Draft → Pending → Approved)
- Role-based access control on all document endpoints

---

## [2.0.0] - 2026-01-29 - Production Grade Multi-tenant Release

### Security Enhancements

#### Fixed
- **Authentication**: Added login rate limiting (5 attempts per 15 minutes per email)
- **Password Requirements**: Strengthened to require uppercase, lowercase, numbers, and special characters
- **Authorization**: Fixed missing authorization on grade-levels API endpoints
- **File Uploads**: Added proper permission check (`assessmentDocument:upload`) to uploads endpoint

#### Added
- **Health Endpoint**: Created `/api/health` endpoint for container orchestration and load balancers
- **Email Service**: Implemented production-ready email service using nodemailer with SMTP configuration

### Multi-tenant Architecture

#### Added
- **Super Admin Dashboard**: Complete platform management for super administrators
  - Overview statistics (schools, users, teachers, students)
  - School management (create, edit, provision admins)
  - User management across all schools with role assignment
  - Platform-wide settings page
- **School Registration Flow**: Full self-service registration for new schools
  - Creates school with default grading configuration
  - Creates initial administrator account
  - Assigns proper role permissions scoped to school
- **Super Admin User**: Initialized with credentials guneev66@gmail.com / Admin@2025

### Frontend Improvements

#### Fixed
- **Parent Portal**: Replaced all mock data with real database queries
  - Dashboard with children's performance and notifications
  - Messages with real message threads
  - Children list with academic performance
  - Behavior tracking with merit/demerit system
  - Report cards from database
- **Parent Role Verification**: Layout now properly checks for ParentUser record
- **Navigation Permissions**: Navigation items now filtered by user permissions
- **Fees Management**: Real invoices, payments, and fee structures from database
- **Events Calendar**: Real school events from database
- **Homework Management**: Real homework assignments and submissions
- **Communications**: Real message threads and announcements

### Configuration & Infrastructure

#### Added
- **Environment Template**: Created comprehensive `.env.example` with all required variables
- **Redis Healthcheck**: Fixed to support password authentication

#### Fixed
- **Docker Configuration**: Redis healthcheck now works with REDIS_PASSWORD environment variable

### Database & API

#### Fixed
- **Grade Levels**: All endpoints (GET, PATCH, DELETE) now have proper authorization and school scoping
- **Email Normalization**: Email addresses are now lowercased and trimmed on registration/login

---

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
