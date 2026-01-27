# Persona Analyzer

*Identify user roles, map journeys, and detect UX issues from a user's perspective.*

---

## Purpose

Analyze the application from user perspectives:
1. **Persona Detection** - Identify user roles from code
2. **Journey Mapping** - Map workflows for each persona
3. **UX Analysis** - Find usability issues
4. **Recommendations** - Suggest improvements

---

## Phase 1: Persona Detection

### Sources to Analyze

#### 1. Database Models

```typescript
// Look for User/Role models in prisma/schema.prisma

model AppUser {
  id            String   @id
  email         String   @unique
  name          String
  role          String   // Simple role field
  schoolId      String?  // Multi-tenant indicator
}

// Or role assignment tables:
model RoleAssignment {
  id          String   @id
  userId      String
  roleId      String
  role        Role     @relation(...)
}

model Role {
  id          String   @id
  name        String   // "teacher", "admin", etc.
  priority    Int      // Permission level
  permissions String[] // Or relation to Permission model
}
```

**Extract**:
- All role names
- Role hierarchy (priority/level)
- Permissions per role

#### 2. Permission System

```typescript
// Look in lib/auth.ts or similar

export const PERMISSION_KEYS = [
  "class:read",
  "class:create",
  "class:update",
  "assessment:read",
  "assessment:create",
  "mark:read",
  "mark:update",
  // ... many more
] as const;

// Or permission objects:
const ROLES = {
  teacher: {
    priority: 60,
    permissions: ["class:read", "mark:update", ...]
  },
  hod: {
    priority: 70,
    permissions: ["class:read", "class:create", "teacher:manage", ...]
  },
  // ...
};
```

**Extract**:
- Permission categories (class, assessment, mark, etc.)
- Actions per category (read, create, update, delete)
- Role-permission mappings

#### 3. UI Components

```typescript
// Look for role-based rendering

// Dashboard variants:
if (role === "teacher") {
  return <TeacherDashboard />;
} else if (role === "admin") {
  return <AdminDashboard />;
}

// Permission gates:
{hasPermission("assessment:create") && (
  <Button>Create Assessment</Button>
)}

// Navigation menus:
const navItems = [
  { label: "Dashboard", href: "/dashboard", roles: ["*"] },
  { label: "Users", href: "/admin/users", roles: ["admin", "smt"] },
  { label: "Schools", href: "/admin/schools", roles: ["system_admin"] },
];
```

**Extract**:
- Role-specific UI elements
- Permission-gated features
- Navigation structure per role

---

## Phase 2: Persona Profiles

### Generate Persona Cards

For each detected role, create:

```yaml
persona:
  name: "Teacher"
  role_id: "teacher"
  priority: 60
  description: "Classroom educator managing students and assessments"

  primary_goals:
    - Enter and track student marks
    - View class performance
    - Generate reports
    - Manage class resources

  permissions:
    can_do:
      - View own classes
      - Create/edit marks
      - View student details
      - Generate class reports
    cannot_do:
      - Create new classes
      - Manage other teachers
      - Access admin settings
      - View other schools

  key_workflows:
    - Mark entry for assessments
    - View markbook grid
    - Generate progress reports
    - Review student performance

  pain_points:
    - "[To be discovered during journey mapping]"

  ui_touchpoints:
    dashboard: "/dashboard"
    classes: "/classes"
    markbook: "/classes/[id]"
    reports: "/reports"
```

### SchoolMatica Detected Personas

Based on code analysis:

```yaml
personas:
  system_admin:
    priority: 100
    description: "Platform administrator with full system access"
    scope: "All schools"
    key_features:
      - Manage all schools
      - Create/manage system roles
      - View platform analytics
      - System configuration

  school_admin:
    priority: 90
    description: "School-level administrator"
    scope: "Single school"
    key_features:
      - Manage school users
      - Configure school settings
      - View school-wide reports
      - Manage subjects and classes

  smt:
    priority: 80
    description: "Senior Management Team member"
    scope: "Single school, oversight"
    key_features:
      - Approve assessment plans
      - Review moderation threads
      - View department summaries
      - Strategic oversight

  hod:
    priority: 70
    description: "Head of Department"
    scope: "Department within school"
    key_features:
      - Manage department teachers
      - Create assessment plans
      - Moderate assessments
      - Department reporting

  teacher:
    priority: 60
    description: "Classroom teacher"
    scope: "Assigned classes only"
    key_features:
      - Enter student marks
      - View class markbook
      - Submit for moderation
      - Generate class reports

  # Future personas (identified but not fully implemented):
  student:
    priority: 30
    description: "Learner viewing own progress"
    scope: "Own data only"
    status: "Not yet implemented"

  parent:
    priority: 20
    description: "Guardian viewing child's progress"
    scope: "Own children only"
    status: "Not yet implemented"
```

---

## Phase 3: Journey Mapping

### Journey Template

For each persona, map key workflows:

```yaml
journey:
  persona: "teacher"
  journey_name: "Enter Marks for Assessment"
  frequency: "Daily during assessment period"
  importance: "Critical"

  steps:
    - step: 1
      action: "Navigate to Classes"
      ui_element: "Sidebar > Classes"
      expected_state: "List of assigned classes"
      potential_issues:
        - "No loading indicator while fetching"
        - "No empty state if no classes assigned"

    - step: 2
      action: "Select a class"
      ui_element: "Class card/row"
      expected_state: "Class markbook view"
      potential_issues:
        - "Large classes may load slowly"
        - "No visual feedback on click"

    - step: 3
      action: "Enter marks in cells"
      ui_element: "Markbook grid cells"
      expected_state: "Mark accepted, cell updated"
      potential_issues:
        - "No validation feedback for invalid marks"
        - "Auto-save may not be obvious"
        - "What happens if network disconnects?"

    - step: 4
      action: "Mark absent students"
      ui_element: "Absent toggle/checkbox"
      expected_state: "Student marked as absent"
      potential_issues:
        - "How to undo an absence?"
        - "Visual distinction for absent marks?"

    - step: 5
      action: "Save and confirm"
      ui_element: "Save button or auto-save"
      expected_state: "Success message, marks persisted"
      potential_issues:
        - "No confirmation of save"
        - "Unclear what happens on failure"

  overall_assessment:
    friction_points: ["Step 3", "Step 5"]
    improvement_opportunities:
      - Add auto-save indicator
      - Add validation tooltips
      - Add undo capability
```

### Key Journeys per Persona

```yaml
journeys_to_map:
  system_admin:
    - Create new school
    - Add school administrator
    - View platform metrics

  school_admin:
    - Onboard new teacher
    - Configure grade levels
    - View school reports

  smt:
    - Review pending approvals
    - Approve assessment plan
    - View cross-department metrics

  hod:
    - Create assessment plan
    - Review teacher submissions
    - Moderate assessments

  teacher:
    - Enter marks for assessment
    - View class performance
    - Submit for moderation
    - Generate progress report
```

---

## Phase 4: UX Issue Detection

### Issue Categories

#### 1. Missing States

```yaml
missing_states:
  loading:
    check: "Components should show loading state while fetching"
    patterns:
      - if (isLoading) return <Skeleton />
      - <Suspense fallback={<Loading />}>
    issues:
      - "No Skeleton component while loading marks"
      - "Page flash on navigation"

  error:
    check: "Components should handle and display errors"
    patterns:
      - if (error) return <Alert variant="destructive">
      - try/catch with user feedback
    issues:
      - "API errors shown as console logs only"
      - "Network failure not communicated to user"

  empty:
    check: "Components should show meaningful empty states"
    patterns:
      - if (data.length === 0) return <EmptyState />
    issues:
      - "Empty class list shows blank page"
      - "No guidance on what to do first"

  success:
    check: "Actions should confirm success"
    patterns:
      - toast({ title: "Saved successfully" })
      - Success message component
    issues:
      - "Mark save doesn't confirm success"
      - "Form submission has no feedback"
```

#### 2. Confusing Workflows

```yaml
confusing_workflows:
  too_many_steps:
    threshold: "> 5 clicks to complete common action"
    check: "Count clicks for key journeys"
    issues:
      - "Creating assessment requires 8 steps"

  hidden_features:
    check: "Important features should be discoverable"
    issues:
      - "Bulk mark import hidden in dropdown"
      - "Export feature not visible"

  inconsistent_patterns:
    check: "Similar actions should work similarly"
    issues:
      - "Edit button in different positions across screens"
      - "Delete confirmation inconsistent"

  unclear_next_steps:
    check: "User should know what to do next"
    issues:
      - "After creating plan, unclear how to add assessments"
      - "Approval workflow status not visible"
```

#### 3. Accessibility Issues

```yaml
accessibility:
  aria_labels:
    check: "Interactive elements have accessible names"
    patterns:
      - aria-label="..."
      - aria-labelledby="..."
    issues:
      - "Icon buttons without labels"
      - "Form fields without labels"

  keyboard_navigation:
    check: "All features accessible via keyboard"
    issues:
      - "Modal can't be closed with Escape"
      - "Dropdown not navigable with arrows"

  color_contrast:
    check: "Text meets WCAG AA contrast"
    issues:
      - "Light gray text on white background"
      - "Error state hard to distinguish"

  focus_indicators:
    check: "Focus state visible on all interactive elements"
    issues:
      - "No visible focus on buttons"
      - "Focus gets lost in modal"
```

#### 4. Responsiveness

```yaml
responsiveness:
  mobile_layout:
    check: "Layout works on mobile (< 768px)"
    issues:
      - "Markbook table not scrollable"
      - "Sidebar overlaps content"

  touch_targets:
    check: "Touch targets >= 44px"
    issues:
      - "Small action buttons hard to tap"
      - "Links too close together"

  content_visibility:
    check: "Important content visible on all sizes"
    issues:
      - "Help text hidden on mobile"
      - "Actions hidden behind overflow menu"
```

---

## Phase 5: Recommendations

### Priority Framework

```yaml
prioritization:
  P0_critical:
    criteria: "Blocks core workflow or causes data loss"
    examples:
      - "Marks not saving"
      - "Cannot submit for approval"

  P1_high:
    criteria: "Significant friction in daily workflows"
    examples:
      - "No feedback on save"
      - "Confusing navigation"

  P2_medium:
    criteria: "Improvement to user experience"
    examples:
      - "Better empty states"
      - "Keyboard shortcuts"

  P3_low:
    criteria: "Nice to have, polish"
    examples:
      - "Animation smoothness"
      - "Advanced filtering"
```

### Recommendation Template

```yaml
recommendation:
  id: "REC-001"
  priority: "P1"
  persona: "teacher"
  journey: "Mark entry"

  issue: "No feedback when marks are auto-saved"

  current_state: |
    Teacher enters mark, cell updates visually,
    but no confirmation that data is saved.

  proposed_solution: |
    1. Add subtle "Saving..." indicator when request in flight
    2. Show "Saved" checkmark on success
    3. Show error toast on failure with retry option

  implementation:
    files:
      - components/markbook/mark-cell.tsx
      - components/ui/save-indicator.tsx
    effort: "Small (2-4 hours)"

  expected_impact:
    user_confidence: "High"
    support_tickets: "Reduce by ~20%"
```

---

## Output: persona_analysis.md

```markdown
# Persona Analysis Report

**Generated**: 2026-01-25T12:00:00Z
**Personas Detected**: 7
**Journeys Mapped**: 15
**UX Issues Found**: 28

## Detected Personas

| Persona | Priority | Scope | Implementation |
|---------|----------|-------|----------------|
| System Admin | 100 | All schools | Complete |
| School Admin | 90 | Single school | Complete |
| SMT | 80 | School oversight | Complete |
| HOD | 70 | Department | Complete |
| Teacher | 60 | Classes | Complete |
| Student | 30 | Own data | Not implemented |
| Parent | 20 | Child data | Not implemented |

## Key Findings

### Teacher Persona - Critical Journey Issues

1. **Mark Entry Workflow** (Daily use)
   - No save confirmation feedback
   - Unclear handling of network errors
   - Absent mark toggle hard to find

2. **Report Generation** (Weekly use)
   - Too many clicks to generate
   - No preview before download
   - Export format not clear

### HOD Persona - Approval Workflow Issues

1. **Assessment Plan Review**
   - Pending items not prominent
   - No notification of new submissions
   - Comparison view missing

## Recommendations by Priority

### P1 - High Priority (Implement within 2 weeks)

1. Add save confirmation to mark entry
2. Show loading states on all data fetches
3. Improve error handling with user feedback

### P2 - Medium Priority (Implement within 1 month)

1. Add empty states with guidance
2. Improve mobile responsiveness
3. Add keyboard shortcuts for power users

### P3 - Low Priority (Backlog)

1. Add onboarding tour for new users
2. Implement student/parent portals
3. Add advanced filtering and search
```
