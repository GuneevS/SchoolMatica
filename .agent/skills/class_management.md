---
name: SchoolMatica Class Management
description: How classes, homeroom/subject types, teacher assignments, and grade phases work
---

# Class Management Skill

## Overview
SchoolMatica supports the South African school system with two class models:
- **Homeroom**: One teacher teaches all subjects (Foundation/Intermediate phase default)
- **Subject**: Subject-specific classes with dedicated teachers (Senior/FET phase default)

## SA School Phases
| Phase | Grades | Default Class Type | Grading Scale |
|-------|--------|-------------------|---------------|
| Foundation | R (0), 1, 2, 3 | Homeroom | 4-point (Level 1-4) |
| Intermediate | 4, 5, 6 | Homeroom (overridable) | 7-point (Level 1-7) |
| Senior | 7, 8, 9 | Subject | 7-point (Level 1-7) |
| FET | 10, 11, 12 | Subject | 7-point (Level 1-7) |

**Important**: Users can always override the default class type. Some Intermediate phase schools use subject-based classes.

## Database Models

### ClassGroup
- `grade: Int` — 0 = Grade R, 1-12 = Grade 1-12
- `classType: ClassType` — enum: `Subject` | `Homeroom`
- `subjectId: String?` — linked only for Subject-type classes
- `primaryTeacherId: String?` — the main/lead teacher
- `year: Int` — academic year

### ClassTeacherAssignment
- Links teachers to classes with roles
- `role: String` — "Lead", "Subject", "Support", "Substitute"
- `subjectId: String?` — which subject this teacher teaches in this class
- Unique constraint: one assignment per (classGroupId, teacherId)

### TeacherSubjectAssignment
- Tracks teacher's subject qualifications (school-wide)
- Different from ClassTeacherAssignment (class-specific)

### GradeSubjectConfig
- Configures which subjects are offered per grade level
- `isCompulsory: Boolean` — whether subject is mandatory

## API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/classes` | GET, POST | List/create classes |
| `/api/classes/[id]` | GET, PATCH, DELETE | Manage class |
| `/api/classes/[id]/teachers` | GET, POST, DELETE | Manage teacher assignments |
| `/api/classes/[id]/markbook` | GET | Get markbook data |
| `/api/classes/[id]/export` | GET | Export class data as CSV |

## UI Components
- `create-class-dialog.tsx` — Class creation with type selection, grade dropdown, subject/teacher assignment
- `manage-teachers.tsx` — Assign/remove teachers with subject and role selection
- `manage-students.tsx` — Student roster management
- `assign-teacher-dialog.tsx` — Quick teacher assignment from class list
- `classes/page.tsx` — Classes overview with cards
- `classes/[classId]/page.tsx` — Class detail with tabs: Markbook, Students, Teachers, Timetable

## Key Business Rules
1. Grade R is stored as `0`, not `null` or "R"
2. Class type defaults based on phase but is always overridable
3. Homeroom classes don't need a subject link
4. Subject classes require `subjectId`
5. The primary teacher auto-creates a ClassTeacherAssignment with role "Lead"
6. Subject-teacher assignments show which subject a teacher covers in a specific class
7. Phase mapping: `lib/constants/grading.ts` — `getPhaseForGradeNum()`
