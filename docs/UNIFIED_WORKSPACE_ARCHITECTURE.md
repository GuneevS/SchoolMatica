# Unified Assessment Workspace Architecture

## Problem Statement

**Before:** The assessment interface was fragmented across multiple redundant components:
- ❌ `PlanEditor` - Original table-based editor
- ❌ `PlanEditorGrouped` - Term-grouped version with tabs
- ❌ `PlanEditorOptimized` - Card-based version
- ❌ `AssessmentConfigCard` - Individual assessment cards
- ❌ `TermWeightConfig` - Separate term weight panel
- ❌ `WeightAdjusterPanel` - Separate weight adjustment
- ❌ `AssessmentFlexibilityGuide` - Educational sidebar

**Issues:**
1. Components didn't update when changes were made
2. No local state management - required full page reloads
3. UI was cluttered and confusing
4. Redundant information scattered across panels
5. No cohesive user experience

## Solution: Unified Workspace

### Single Component Architecture

**ONE component** (`UnifiedAssessmentWorkspace`) handles everything:
- ✅ Assessment management (CRUD)
- ✅ Term weight configuration
- ✅ Real-time updates
- ✅ Live calculations
- ✅ Status indicators
- ✅ Validation feedback

### Core Design Principles

#### 1. **Single Source of Truth**
```typescript
const [assessments, setAssessments] = useState(plan.assessments);
const [termWeights, setTermWeights] = useState<Record<string, number>>(...);
const [hasChanges, setHasChanges] = useState(false);
```
Local state ensures immediate UI updates, then syncs to server.

#### 2. **Optimistic Updates**
```typescript
// Update UI immediately
setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
setHasChanges(true);

// Then sync to server
await fetch(`/api/assessments/${id}`, { method: "PATCH", ... });
```

#### 3. **Term-Centric Organization**
- Tabs for each term (T1, T2, T3, T4)
- Each tab contains:
  - Term weight configuration
  - Term statistics
  - List of assessments in that term
  - Add assessment button

#### 4. **Integrated Calculations**
Every change shows immediate impact:
```
Assessment Weight (10%) → Term Weight (30%) → Final Contribution (3%)
```

## Component Structure

### Layout Hierarchy

```
UnifiedAssessmentWorkspace
├── Header Card
│   ├── Status indicators
│   ├── Total counts
│   └── Action buttons (Save, Submit)
│
├── Tabs (Term-based)
│   ├── Tab List (T1, T2, T3, T4)
│   │   └── Badge showing assessment count
│   │
│   └── Term Weight Quick View
│       └── Inline term weight summary
│
└── Tab Content (per term)
    ├── Term Overview (2-column grid)
    │   ├── Term Weight Configuration
    │   │   ├── Slider control
    │   │   ├── Numeric input
    │   │   └── Statistics
    │   │
    │   └── Assessment Summary
    │       ├── Statistics
    │       ├── Info alerts
    │       └── Add button
    │
    └── Assessments List
        └── Assessment Cards
            ├── Name (editable)
            ├── Total Marks (editable)
            ├── Raw Weight (editable)
            ├── Contribution badge
            └── Delete button
```

## Real-Time Update Flow

### User Makes Change

```
1. User types in assessment name
   ↓
2. onChange fires immediately
   ↓
3. Local state updates (optimistic)
   ↓
4. UI reflects change instantly
   ↓
5. Debounced API call to server
   ↓
6. Server updates database
   ↓
7. Dashboard cache invalidated
   ↓
8. Router refreshes (background)
```

### State Management

```typescript
// Immediate feedback
const updateAssessment = async (id: string, data: Partial<Assessment>) => {
  // 1. Update local state immediately
  setAssessments(prev => prev.map(a => 
    a.id === id ? { ...a, ...data } : a
  ));
  setHasChanges(true);
  
  // 2. Sync to server (async)
  startTransition(async () => {
    await fetch(`/api/assessments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    router.refresh();
  });
};
```

## Feature Integration

### 1. Assessment Management
- **Add:** Click "Add Assessment" in any term tab
- **Edit:** Inline editing with instant feedback
- **Delete:** One-click removal with optimistic update
- **Move:** Change term via dropdown

### 2. Weight Configuration  
- **Term Weights:** Slider + numeric input per term
- **Assessment Weights:** Raw weight input per assessment
- **Validation:** Real-time checking (must sum to 100%)
- **Save:** Explicit save button when changes pending

### 3. Live Calculations
Every assessment shows:
```
[Assessment: 80%] × [Term: 30%] = Final: 24%
       ↑               ↑              ↑
   percentage    term weight    contribution
```

### 4. Visual Feedback
- 🟢 Green checkmark: All weights valid
- 🟡 Amber warning: Weights don't sum to 100%
- 🔵 Blue badge: Unsaved changes
- 📊 Progress updates during save

## Benefits

### For Users
✅ **Immediate feedback** - See changes instantly
✅ **Clear organization** - Everything in logical tabs
✅ **Less clutter** - One cohesive interface
✅ **Better understanding** - See full calculation chain
✅ **Undo-friendly** - Changes aren't saved until you click Save

### For Developers
✅ **Single component** - Easier to maintain
✅ **Clear state flow** - Predictable updates
✅ **Better performance** - Optimistic updates
✅ **Less code** - Removed 6 redundant components
✅ **Easier testing** - One component to test

## Migration from Old System

### Removed Components
These are NO LONGER USED:
- ~~`components/plans/plan-editor.tsx`~~
- ~~`components/plans/plan-editor-grouped.tsx`~~
- ~~`components/plans/plan-editor-optimized.tsx`~~
- ~~`components/plans/assessment-config-card.tsx`~~
- ~~`components/plans/term-weight-config.tsx`~~
- ~~`components/plans/weight-adjuster-panel.tsx`~~
- ~~`components/plans/assessment-flexibility-guide.tsx`~~

### Current Architecture
```
app/assessment-plans/[planId]/page.tsx
├── AuroraHero (header)
├── UnifiedAssessmentWorkspace ← MAIN COMPONENT
├── PlanDocuments (sidebar)
└── ModerationPanel (sidebar)
```

Clean, simple, integrated.

## Key User Workflows

### Workflow 1: Add Assessment
1. Click term tab (e.g., T2)
2. Click "Add Assessment to T2"
3. Assessment appears immediately
4. Edit name, marks, weight inline
5. See live contribution calculation
6. Changes auto-save

### Workflow 2: Configure Term Weights
1. Click any term tab
2. Adjust slider or type percentage
3. See "Unsaved changes" indicator
4. Verify total = 100% (green check)
5. Click "Save Changes"
6. Confirmation appears

### Workflow 3: Edit Assessment
1. Navigate to term tab
2. Click in any field (name, marks, weight)
3. Type new value
4. See immediate update in badges
5. Contribution recalculates live
6. No save button needed

## Technical Details

### Props Interface
```typescript
interface Props {
  plan: AssessmentPlan & { assessments: Assessment[] };
  termWeights: TermWeights | null;
  weightInsights?: AssessmentWeightInsightMap;
}
```

### State Shape
```typescript
{
  assessments: Assessment[];           // Local copy
  termWeights: Record<string, number>; // Local copy
  hasChanges: boolean;                 // Dirty flag
  isPending: boolean;                  // Loading state
}
```

### API Endpoints Used
- `PATCH /api/assessments/:id` - Update assessment
- `POST /api/assessments` - Create assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `PATCH /api/assessment-plans/:id` - Update term weights
- `POST /api/revalidate` - Cache invalidation

## Best Practices

### DO ✅
- Keep all assessment logic in UnifiedWorkspace
- Use local state for immediate feedback
- Show unsaved changes indicator
- Validate before saving
- Provide visual confirmation

### DON'T ❌
- Create separate components for parts of the workflow
- Require page reload to see changes
- Save every keystroke to server
- Hide validation errors
- Scatter related functionality

## Future Enhancements

- [ ] Drag-and-drop reordering within terms
- [ ] Bulk import/export assessments
- [ ] Assessment templates
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality
- [ ] Assessment duplication
- [ ] Copy between terms

## Summary

The Unified Assessment Workspace represents a **complete reimagining** of the assessment management interface:

**Before:** 7 scattered components, no real-time updates, confusing UX
**After:** 1 unified component, instant feedback, cohesive experience

**Impact:**
- 🎯 Better UX - Everything in one place
- ⚡ Faster - Optimistic updates
- 🧹 Cleaner - Removed redundancy
- 🔧 Maintainable - Single source of truth
- 📈 Scalable - Clear patterns for future features

This is the gold standard for integrated workspace design in the application.
