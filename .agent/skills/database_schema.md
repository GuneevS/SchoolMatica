---
name: SchoolMatica Database Schema
description: Prisma schema reference with all 40+ models, relationships, and JSON field schemas
---

# Database Schema Skill

## Tech Stack
- **ORM**: Prisma 6.19 with PostgreSQL
- **Schema**: `prisma/schema.prisma` (1,255 lines, 44KB)
- **Migrations**: `prisma/migrations/`
- **Seed**: `prisma/seed.ts` (57KB)

## Core Models by Domain

### Authentication & Users
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `AppUser` | Application user | email, passwordHash, schoolId, teacherId |
| `Account` | OAuth accounts (NextAuth) | provider, providerAccountId |
| `Session` | User sessions | sessionToken, expires |
| `RoleDefinition` | Role types | key (admin, teacher, parent, student, bursar) |
| `UserRoleAssignment` | User-role links | userId, roleId, scopeSchoolId |
| `PermissionDefinition` | Granular permissions | resource, action |
| `RolePermission` | Role-permission links | roleId, permissionId |

### School & Classes
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `School` | School entity | name, shortCode, branding (Json) |
| `ClassGroup` | Class/section | grade (Int), classType (enum), subjectId |
| `GradeLevel` | Grade config | name, order, schoolId |
| `Subject` | Subject definition | name, code, phase, schoolId |
| `GradeSubjectConfig` | Grade-subject mapping | gradeLevelId, subjectId, isCompulsory |

### People
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Teacher` | Teacher record | firstName, lastName, email, schoolId |
| `Student` | Student record | admissionNumber, classGroupId |
| `ParentContact` | Parent/guardian | fullName, relationship, studentId |
| `ParentUser` | Parent account link | userId, contacts[] |
| `StudentUser` | Student account link | userId, studentId |

### Teaching Assignments
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `ClassTeacherAssignment` | Teacher-class link | classGroupId, teacherId, role, subjectId |
| `TeacherSubjectAssignment` | Teacher subject quals | teacherId, subjectId, grade |

### Assessments & Marks
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `AssessmentPlan` | Assessment plan | name, year, termCount, classGroupId |
| `Assessment` | Individual assessment | taskName, term, totalMark, weightPercent |
| `Mark` | Student mark | rawMark, isAbsent, status |
| `CurriculumTemplate` | CAPS templates | subjectName, phase, grade |
| `MarkSnapshot` | Term snapshots | sbaPercent, termPercent, level |

### Finance
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `FeeStructure` | Fee definitions | grade, year, baseAmount, components (Json) |
| `FeeDiscount` | Discounts/bursaries | type (Percentage/FixedAmount), value |
| `Invoice` | Student invoices | invoiceNumber, lineItems (Json), status |
| `Payment` | Payment records | paymentRef, method, amount, status |
| `AccountLedger` | Running balance | debit, credit, balance, reference |
| `CreditNote` | Refund/adjustment | amount, reason, status |
| `StudentDiscount` | Applied discounts | studentId, discountId, status |

### Communications
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `MessageThread` | Conversation | type, participants (Json) |
| `Message` | Individual message | content, readBy (Json) |
| `Notification` | User notifications | type, title, body, actionUrl |
| `Announcement` | School announcements | audience (Json), priority |

### Behavior
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `BehaviorIncident` | Merit/demerit events | type, points, category |
| `BehaviorPolicy` | School policies | thresholds (Json), rewards (Json) |
| `BehaviorBalance` | Running totals | meritTotal, demeritTotal, netBalance |

### Other
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Timetable` | School timetable | cycleType, periods[], slots[] |
| `Homework` | Assignments | title, dueDate, classGroupId |
| `SchoolEvent` | Calendar events | eventType, startDate, audience (Json) |
| `ReportCard` | Term reports | overallPercentage, teacherComment |
| `AuditLog` | Change tracking | entityType, action, diff (Json) |

## Key Enums
```prisma
enum ClassType {
  Subject
  Homeroom
}
```

## JSON Field Schemas
- **School.branding**: `{ logoUrl, primary, secondary, accent }`
- **FeeStructure.components**: `[{ name, amount, optional, description }]`
- **Invoice.lineItems**: `[{ description, amount, quantity }]`
- **BehaviorPolicy.thresholds**: `[{ level, action, points }]`
- **Announcement.audience**: `{ roles: [], grades: [], classes: [] }`

## Common Patterns
1. All models use `cuid()` for IDs
2. Most have `createdAt`/`updatedAt` timestamps
3. Soft delete via `isActive` or `status` fields
4. School-scoped data uses `schoolId` foreign key
5. `@@index()` on frequently queried fields
6. `@@unique()` for compound uniqueness constraints
