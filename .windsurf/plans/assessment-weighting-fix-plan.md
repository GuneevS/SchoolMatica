# Assessment Plan Weighting System - Comprehensive Fix Plan

## Executive Summary

The assessment plan weighting system has several critical issues that prevent intuitive weight management. This document outlines the root causes and provides a detailed implementation plan.

## Issues Identified

### 1. Landing Page Demo Issues (FIXED)
- **"Term erm" Typo**: The `term.substring(1)` was incorrectly extracting characters from keys like "term1", resulting in "erm1" instead of "1"
- **Pie Chart Colors**: All segments were showing the same color (red) due to compliance-based coloring logic
- **Status**: ✅ Fixed in `interactive-assessment-planner-demo.tsx`

### 2. Weight Normalization Logic Issues

#### Current Behavior
The `normaliseWeights` function in `lib/calculations.ts` normalizes weights **globally across all assessments** in a plan, not per-term. This causes:
- When adding an assessment to Term 1, it affects weights in Term 2, 3, and 4
- No automatic balancing within a term when assessments are added/removed
- Term weights and assessment weights are disconnected

#### Expected Behavior (CAPS Compliance)
- Each term should have assessments that sum to 100% **within that term**
- Term weights (e.g., T1=20%, T2=25%, T3=25%, T4=30%) determine how each term contributes to the final grade
- When an assessment is added to a term, other assessments **in that same term** should auto-adjust

### 3. UI/UX Issues in Assessment Workspace

- No visual feedback when weights don't sum to 100%
- Sliders and inputs don't auto-balance other assessments
- Term weight changes don't trigger recalculation
- Missing validation for CAPS compliance

## Implementation Plan

### Phase 1: Fix Weight Normalization Logic

#### 1.1 Create Per-Term Normalization Function
```typescript
// lib/calculations.ts
export function normaliseWeightsPerTerm<T extends { rawWeight: number; term: string }>(
  assessments: T[],
  options: { precision?: number } = {},
) {
  const precision = options.precision ?? 2;
  
  // Group by term
  const termGroups = assessments.reduce((acc, a) => {
    if (!acc[a.term]) acc[a.term] = [];
    acc[a.term].push(a);
    return acc;
  }, {} as Record<string, T[]>);
  
  // Normalize each term independently
  const result: (T & { weightPercent: number })[] = [];
  
  for (const [term, termAssessments] of Object.entries(termGroups)) {
    const totalRaw = termAssessments.reduce((sum, a) => sum + (a.rawWeight || 0), 0);
    
    if (totalRaw === 0) {
      termAssessments.forEach(a => result.push({ ...a, weightPercent: 0 }));
      continue;
    }
    
    const withWeights = termAssessments.map(a => ({
      ...a,
      weightPercent: Number(((a.rawWeight / totalRaw) * 100).toFixed(precision)),
    }));
    
    // Distribute rounding error
    const sum = withWeights.reduce((acc, a) => acc + a.weightPercent, 0);
    const diff = Number((100 - sum).toFixed(precision));
    if (Math.abs(diff) > 0 && withWeights.length > 0) {
      const largest = withWeights.reduce((max, a, idx) => 
        a.weightPercent > withWeights[max].weightPercent ? idx : max, 0);
      withWeights[largest].weightPercent = Number(
        (withWeights[largest].weightPercent + diff).toFixed(precision)
      );
    }
    
    result.push(...withWeights);
  }
  
  return result;
}
```

#### 1.2 Update Assessment Service
```typescript
// lib/assessment-service.ts
export async function recalculateWeightsForPlan(planId: string, options?: { perTerm?: boolean }) {
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: { assessments: true },
  });

  if (!plan || plan.assessments.length === 0) return;

  // Use per-term normalization by default
  const normalised = options?.perTerm !== false 
    ? normaliseWeightsPerTerm(plan.assessments)
    : normaliseWeights(plan.assessments);
    
  await Promise.all(
    normalised.map((assessment) =>
      prisma.assessment.update({
        where: { id: assessment.id },
        data: { weightPercent: assessment.weightPercent },
      }),
    ),
  );
}
```

### Phase 2: Improve UI Auto-Adjustment

#### 2.1 Add Auto-Balance Toggle
Allow users to choose between:
- **Auto-balance mode**: When one weight changes, others in the term auto-adjust
- **Manual mode**: User controls each weight independently

#### 2.2 Implement Smart Weight Adjustment
```typescript
// In unified-assessment-workspace.tsx
const adjustOtherWeightsInTerm = (changedId: string, newWeight: number, term: string) => {
  const termAssessments = assessments.filter(a => a.term === term);
  const others = termAssessments.filter(a => a.id !== changedId);
  
  if (others.length === 0) return;
  
  const remainingWeight = 100 - newWeight;
  const currentOthersTotal = others.reduce((sum, a) => sum + a.weightPercent, 0);
  
  if (currentOthersTotal === 0) {
    // Distribute equally
    const equalShare = remainingWeight / others.length;
    others.forEach(a => updateAssessment(a.id, { rawWeight: equalShare }));
  } else {
    // Proportional adjustment
    others.forEach(a => {
      const proportion = a.weightPercent / currentOthersTotal;
      const newRaw = remainingWeight * proportion;
      updateAssessment(a.id, { rawWeight: newRaw });
    });
  }
};
```

### Phase 3: Add CAPS Compliance Validation

#### 3.1 Create Validation Function
```typescript
export function validateCAPSCompliance(assessments: Assessment[], termWeights: TermWeights) {
  const issues: string[] = [];
  
  // Check term weights sum to 100%
  const termWeightTotal = Object.values(termWeights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(termWeightTotal - 100) > 0.01) {
    issues.push(`Term weights must sum to 100% (current: ${termWeightTotal.toFixed(1)}%)`);
  }
  
  // Check each term's assessments sum to 100%
  const termGroups = assessments.reduce((acc, a) => {
    if (!acc[a.term]) acc[a.term] = [];
    acc[a.term].push(a);
    return acc;
  }, {} as Record<string, Assessment[]>);
  
  for (const [term, termAssessments] of Object.entries(termGroups)) {
    const total = termAssessments.reduce((sum, a) => sum + a.weightPercent, 0);
    if (Math.abs(total - 100) > 0.01) {
      issues.push(`${term} assessments must sum to 100% (current: ${total.toFixed(1)}%)`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
```

### Phase 4: Enhance Landing Page Interactivity

#### 4.1 Add Real-Time Weight Adjustment Demo
- Show how changing one assessment affects others
- Animate pie chart transitions
- Add tooltips explaining CAPS requirements

#### 4.2 Improve Visual Design
- Use distinct, vibrant colors for each term
- Add gradient backgrounds
- Implement smooth animations
- Add micro-interactions on hover

## Files to Modify

| File | Changes |
|------|---------|
| `lib/calculations.ts` | Add `normaliseWeightsPerTerm` function |
| `lib/assessment-service.ts` | Update to use per-term normalization |
| `components/plans/unified-assessment-workspace.tsx` | Add auto-balance logic, validation UI |
| `components/landing/interactive-demos/interactive-assessment-planner-demo.tsx` | Improve interactivity |
| `app/api/assessments/route.ts` | Ensure per-term recalculation |
| `app/api/assessments/[assessmentId]/route.ts` | Ensure per-term recalculation |

## Testing Checklist

- [ ] Adding assessment to T1 only affects T1 weights
- [ ] Deleting assessment recalculates remaining weights in that term
- [ ] Each term's assessments sum to exactly 100%
- [ ] Term weights can be configured independently
- [ ] CAPS compliance validation shows clear errors
- [ ] Landing page demo shows correct term names
- [ ] Pie chart shows distinct colors per term
- [ ] Auto-balance mode works correctly

## Timeline

1. **Phase 1** (Core Logic): 1-2 hours
2. **Phase 2** (UI Auto-Adjustment): 2-3 hours
3. **Phase 3** (Validation): 1 hour
4. **Phase 4** (Landing Page): 1-2 hours

Total: ~6-8 hours of development
