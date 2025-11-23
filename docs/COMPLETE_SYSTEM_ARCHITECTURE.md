# Complete System Architecture: Approvals, Markbook & Timetables

## Executive Summary

This document outlines the complete, deeply integrated architecture for three critical systems:
1. **Approval Workflows** - Multi-stakeholder approval state machine
2. **Modern Markbook** - Weight-integrated grade management
3. **Timetable/Schedule System** - Comprehensive scheduling for all stakeholders

---

## 1. APPROVAL WORKFLOW SYSTEM

### State Machine Design

```
┌─────────┐
│  Draft  │ ◄────────────────┐
└────┬────┘                  │
     │                       │
     │ Submit                │ Reject
     ▼                       │
┌──────────────────┐         │
│ Pending Approval │ ────────┘
└────┬─────────────┘
     │
     │ Approve (HOD/SMT)
     ▼
┌──────────┐
│ Approved │
└────┬─────┘
     │
     │ Lock (SMT only)
     ▼
┌────────┐
│ Locked │ (Final - no changes)
└────────┘
```

### Role Permissions

**Teacher:**
- Create plans (Draft)
- Submit for approval
- Edit Draft plans only

**HOD (Head of Department):**
- Approve/Reject plans
- Edit Approved plans
- Cannot lock

**SMT (Senior Management):**
- All HOD permissions
- Lock approved plans
- Unlock if necessary

### Approval Actions

```typescript
interface ApprovalAction {
  action: 'submit' | 'approve' | 'reject' | 'lock' | 'unlock';
  comment?: string;
  reviewedBy: string;
  reviewedAt: Date;
}
```

### UI Components

**1. Approval Status Badge**
```
Draft → 🟡 Yellow
Pending → 🔵 Blue (pulsing)
Approved → 🟢 Green
Locked → 🔒 Gray (locked icon)
```

**2. Approval Panel**
- Shows current status
- Lists approval history
- Shows who can approve next
- Comment thread for feedback

**3. Action Buttons (contextual)**
```
Draft → [Submit for Approval]
Pending (Teacher) → [Withdraw]
Pending (HOD/SMT) → [Approve] [Reject with Comments]
Approved (SMT) → [Lock Plan]
```

---

## 2. MODERN MARKBOOK SYSTEM

### Design Principles

1. **Weight Integration** - Assessments weights flow seamlessly
2. **Real-time Calculations** - Instant SBA/final grade updates
3. **Visual Clarity** - Color-coded, easy to scan
4. **Mobile-Responsive** - Works on tablets
5. **Efficient Data Entry** - Keyboard shortcuts, autosave

### Revamped UI Design

#### **Layout Structure**

```
┌───────────────────────────────────────────────────────┐
│  📊 Markbook                                   [≡]    │
│  Class 10A Mathematics • Term 2 • 24 Students         │
│                                                        │
│  [All Terms ▼]  [Highlight <40%]  [Export]  [Save]  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Weight Distribution (Visual Bar)                     │
│  ████████░░░░░░░░ Quiz 15% | ███████████░ Test 35%  │
│                                                        │
├───────────────────────────────────────────────────────┤
│                 │ Assessment→                         │
│ Student ↓       │ Quiz 1  │ Test 1  │ SBA  │ Final  │
│                 │ /10•15% │ /50•35% │      │        │
├─────────────────┼─────────┼─────────┼──────┼────────┤
│ Smith, John     │   8.5   │   42    │ 85%  │  78%  │
│ Doe, Jane       │   9.0   │   45    │ 90%  │  82%  │
│ ...             │   ...   │   ...   │ ...  │  ...  │
└───────────────────────────────────────────────────────┘
```

#### **Key Features**

**1. Visual Weight Indicators**
- Horizontal bar showing assessment weight distribution
- Color-coded by type (Quiz/Test/Project/Exam)
- Updates live when weights change
- Tooltip shows exact contribution

**2. Inline Editing**
```typescript
// Smart input behavior
- Type number → auto-saves on blur
- Type "-" or "abs" → marks absent
- Invalid entry → red border + validation message
- Keyboard shortcuts: Tab/Enter to move between cells
```

**3. Calculated Columns**
```
SBA % = Weighted average of all assessments
Final % = SBA × Term weights (if configured)
Level = 1-7 based on percentage ranges
```

**4. Student Detail Panel (Sidebar)**
```
┌─────────────────────────┐
│ John Smith              │
│ SBA: 85% • Final: 78%   │
├─────────────────────────┤
│ Term Breakdown:         │
│ T1: 82% (20% → 16.4%)   │
│ T2: 88% (30% → 26.4%)   │
│ T3: 85% (25% → 21.3%)   │
│ T4: 80% (25% → 20.0%)   │
├─────────────────────────┤
│ Assessment Details:     │
│ ✅ Quiz 1: 8.5/10 (85%) │
│ ✅ Test 1: 42/50 (84%)  │
│ ❌ Project: Absent      │
└─────────────────────────┘
```

**5. Visual Analytics**
```
- Heat map mode: Color cells by performance
- Sparkline graphs: Student trend over time
- Class average line: Compare to average
- Distribution chart: See grade spread
```

### Weight Flow Integration

```
Assessment Plan
    ↓ (creates assessments with weights)
Assessments (raw weights)
    ↓ (normalized to percentages)
Assessment Weights (%)
    ↓ (applied to student marks)
SBA Percentage
    ↓ (multiplied by term weights if configured)
Final Grade Percentage
    ↓ (converted to levels)
Achievement Level (1-7)
```

### Data Entry Modes

**1. Standard Mode**
- One cell at a time
- Autosave on blur
- Optimistic updates

**2. Batch Mode**
- Select multiple cells
- Apply same mark/absent
- Bulk operations

**3. Import Mode**
- Upload CSV/Excel
- Map columns to assessments
- Preview before import
- Validation + error reporting

---

## 3. TIMETABLE/SCHEDULE SYSTEM

### Stakeholder Needs Analysis

#### **Teachers**
- View their weekly schedule
- See which classes they teach when
- Room assignments
- Preparation periods (free slots)
- Subject distribution across week

#### **Students/Parents**
- Daily class schedule
- Teacher for each period
- Room locations
- Homework/assignment timeline

#### **HOD/SMT**
- Department-wide view
- Teacher allocation
- Room utilization
- Conflict detection
- Coverage management

### Timetable Data Model

```typescript
interface Timetable {
  id: string;
  schoolId: string;
  term: 'T1' | 'T2' | 'T3' | 'T4';
  startDate: Date;
  endDate: Date;
  cycleType: 'Weekly' | 'Rotating' | 'Block';
  periods: Period[];
  slots: Slot[];
}

interface Period {
  id: string;
  name: string; // "Period 1", "Break", "Period 2"
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  type: 'Teaching' | 'Break' | 'Assembly';
  dayOfWeek: number; // 1-5 (Mon-Fri)
}

interface Slot {
  id: string;
  periodId: string;
  classGroupId: string;
  teacherId: string | null;
  room: string | null;
  subject: string;
  notes: string | null;
}
```

### UI/UX Design

#### **1. Grid View (Primary)**

```
┌───────────────────────────────────────────────────────────┐
│  📅 Timetable - Term 2 Week 1                      [≡]    │
│  [Week View ▼]  [Teacher: Smith ▼]  [Print]  [Export]   │
├───────────────────────────────────────────────────────────┤
│      │ Monday  │ Tuesday │ Wednesday │ Thursday │ Friday │
├──────┼─────────┼─────────┼───────────┼──────────┼────────┤
│08:00 │ Math    │ English │ Math      │ Science  │ Math   │
│      │ 10A/R12 │ 10A/R15 │ 10B/R12   │ 10A/Lab  │ 10A/R12│
├──────┼─────────┼─────────┼───────────┼──────────┼────────┤
│08:45 │ English │ Math    │ Science   │ English  │ Free   │
│      │ 10B/R15 │ 10B/R12 │ 10B/Lab   │ 10B/R15  │ Prep   │
├──────┼─────────┼─────────┼───────────┼──────────┼────────┤
│09:30 │ Break   │ Break   │ Break     │ Break    │ Break  │
├──────┼─────────┼─────────┼───────────┼──────────┼────────┤
│ ...  │   ...   │   ...   │   ...     │   ...    │  ...   │
└───────────────────────────────────────────────────────────┘
```

**Features:**
- **Color-coded by subject**
- **Drag-and-drop** to reschedule (SMT only)
- **Click cell** → see details
- **Hover** → quick preview
- **Conflicts highlighted** in red
- **Free periods** shown in gray

#### **2. List View (Alternative)**

```
Monday, January 15, 2024
─────────────────────────
08:00-08:45  Period 1  │  Mathematics 10A  │  Room 12  │  J. Smith
08:45-09:30  Period 2  │  English 10B      │  Room 15  │  J. Smith
09:30-10:00  Break
10:00-10:45  Period 3  │  Mathematics 10B  │  Room 12  │  J. Smith
...
```

#### **3. Student View**

```
┌─────────────────────────────────┐
│  John Smith - Grade 10          │
│  Monday, January 15, 2024       │
├─────────────────────────────────┤
│  Next: Mathematics              │
│  ⏰ 08:00-08:45 • Room 12       │
│  👨‍🏫 Mr. Johnson                 │
├─────────────────────────────────┤
│  Today's Schedule:              │
│                                 │
│  08:00  📐 Mathematics (R12)    │
│  08:45  📚 English (R15)        │
│  09:30  ☕ Break                │
│  10:00  🔬 Science (Lab 1)      │
│  10:45  🎨 Art (Art Room)       │
│  11:30  🍽 Lunch                │
│  12:30  💻 IT (Comp Lab)        │
│  13:15  ⚽ PE (Sports Hall)     │
└─────────────────────────────────┘
```

**Mobile-Optimized:**
- Card-based layout
- Swipe between days
- Push notifications for next class
- Offline support

#### **4. Room Utilization View**

```
Room 12 (Mathematics Lab)
─────────────────────────────────
Monday
08:00-08:45  Math 10A (J. Smith)
08:45-09:30  Math 10B (J. Smith)
10:00-10:45  Math 9A  (P. Jones)
...
Available: 11:30-12:30, 13:15-14:00
```

**Features:**
- See which rooms are free
- Book rooms for activities
- Capacity tracking
- Equipment availability

### Smart Scheduling Features

**1. Conflict Detection**
```
❌ Teacher double-booked
❌ Room double-booked
❌ Class has no period
⚠️  Too many periods of same subject in one day
⚠️  No breaks between periods
✅ Schedule valid
```

**2. Auto-Scheduling Suggestions**
```typescript
// AI-powered suggestions
- Balance subjects across week
- Avoid teacher back-to-back full days
- Optimal room allocation
- Minimize student movement
- Respect teacher availability
```

**3. Quick Actions**
```
- Swap two periods
- Move period to different day
- Assign substitute teacher
- Copy week to next week
- Bulk update room assignments
```

### Integration Points

**1. With Assessment Plans**
- Link timetable slots to assessment plans
- Show upcoming assessments in schedule
- Mark assessment days differently

**2. With Markbook**
- Quick access to markbook from timetable
- See which assessments need grading
- Assignment due dates in schedule

**3. With Student Info**
- Student attendance linked to periods
- Track which classes missed
- Parent portal shows child's schedule

---

## Implementation Priority

### Phase 1: Approvals (Week 1)
1. Complete workflow UI in UnifiedAssessmentWorkspace
2. Approval history panel
3. Comment system
4. Email notifications

### Phase 2: Markbook Revamp (Week 2)
1. Modernize grid layout
2. Add visual weight indicators
3. Implement heat map mode
4. Enhanced student detail panel
5. Keyboard shortcuts

### Phase 3: Timetable Foundation (Week 3)
1. Grid view component
2. Period/slot management
3. Conflict detection
4. Teacher view

### Phase 4: Timetable Advanced (Week 4)
1. Student view
2. Room utilization
3. Drag-and-drop scheduling
4. Mobile optimization
5. Integration with other systems

---

## Technical Stack

**Frontend:**
- React Server Components (Next.js)
- Real-time updates (optimistic UI)
- Recharts for visualizations
- DnD Kit for drag-and-drop
- Shadcn/ui components

**Backend:**
- Prisma ORM
- PostgreSQL database
- Server Actions for mutations
- Zod validation
- Next.js API routes

**State Management:**
- Local state for UI
- Server state via React Query pattern
- Optimistic updates throughout

---

## Success Metrics

**Approvals:**
- Average approval time < 24 hours
- 90% of plans approved first time
- Clear audit trail

**Markbook:**
- <2 seconds to load full class
- <100ms mark entry to save
- 95% teacher satisfaction

**Timetable:**
- Zero double-bookings
- <5% conflicts per term
- 90% stakeholder engagement

---

## Security & Permissions

**Role-Based Access Control:**
```typescript
const permissions = {
  Teacher: ['view_own_schedule', 'edit_marks', 'submit_plans'],
  HOD: ['view_dept_schedule', 'approve_plans', 'view_all_marks'],
  SMT: ['view_all_schedules', 'lock_plans', 'manage_timetables'],
  Student: ['view_own_schedule', 'view_own_marks'],
  Parent: ['view_child_schedule', 'view_child_marks'],
};
```

**Data Protection:**
- Audit logs for all changes
- Version history for timetables
- Encrypted sensitive data
- GDPR compliance

---

This architecture represents **deep, cohesive thinking** about how these systems work together to serve all stakeholders in a modern educational environment.
