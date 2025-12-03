# Assessment Flexibility System

## Core Concept

**Total Marks and Weight Percentage are COMPLETELY INDEPENDENT**

This design gives educators maximum flexibility in assessment design while maintaining precise control over grade contributions.

## How It Works

### The Formula

```
Student Grade Contribution = (Student Mark ÷ Total Mark) × 100 × (Weight ÷ 100)
```

**Step by step:**
1. **Convert to percentage:** `(student_mark / total_mark) × 100`
2. **Apply weight:** `percentage × (weight / 100)`
3. **Sum all weighted percentages** for final grade

### Real-World Examples

#### Example 1: Quick Quiz (High Impact)
- **Total Marks:** 5
- **Weight:** 90%
- **Student Score:** 4/5

**Calculation:**
- Percentage: (4 ÷ 5) × 100 = **80%**
- Contribution: 80% × (90 ÷ 100) = **72%** to final grade

#### Example 2: Major Test (Low Impact)
- **Total Marks:** 100
- **Weight:** 10%
- **Student Score:** 85/100

**Calculation:**
- Percentage: (85 ÷ 100) × 100 = **85%**
- Contribution: 85% × (10 ÷ 100) = **8.5%** to final grade

#### Example 3: Project (Medium Impact)
- **Total Marks:** 50
- **Weight:** 60%
- **Student Score:** 40/50

**Calculation:**
- Percentage: (40 ÷ 50) × 100 = **80%**
- Contribution: 80% × (60 ÷ 100) = **48%** to final grade

## UI Features

### AssessmentConfigCard
- **Visual Layout:** Card-based design emphasizing independence
- **Three Key Fields:**
  - Total Marks (any value)
  - Term (T1-T4)
  - Weight Value (normalized to percentage)
- **Live Examples:** Shows calculation with 75% performance
- **Tooltips:** Contextual help explaining each field
- **Progress Bar:** Visual representation of contribution

### PlanEditorOptimized
- **Card Grid Layout:** Modern, scannable interface
- **Drag-and-Drop:** Reorder assessments easily
- **Term Statistics:** Aggregated view per term
- **Real-time Updates:** Immediate feedback on changes
- **Example Toggle:** Show/hide calculation examples

### AssessmentFlexibilityGuide
- **Educational Component:** Teaches the concept
- **Real Examples:** Three scenarios with calculations
- **Formula Breakdown:** Step-by-step explanation
- **Pro Tips:** Best practices for assessment design

## Benefits

### For Educators
✅ **Flexibility:** Design assessments of any size
✅ **Control:** Precise weight distribution
✅ **Balance:** Mix quick checks with major evaluations
✅ **Clarity:** Clear visual feedback on contributions

### For Students
✅ **Transparency:** Understand exactly how grades are calculated
✅ **Fairness:** Consistent percentage-based conversion
✅ **Predictability:** Can calculate their own contributions

## Assessment Strategy Examples

### Continuous Assessment (Term 1)
```
1. Weekly Quiz (5 marks)     → 5% each  = 20% total
2. Mid-term Test (50 marks)  → 30%
3. Project (50 marks)        → 30%
4. Final Test (100 marks)    → 20%
                              ─────
                              100% total
```

### Exam-Heavy (Term 2)
```
1. Quiz 1 (10 marks)         → 10%
2. Quiz 2 (10 marks)         → 10%
3. Mid-term (100 marks)      → 30%
4. Final Exam (100 marks)    → 50%
                              ─────
                              100% total
```

### Project-Based (Term 3)
```
1. Small Project (20 marks)  → 20%
2. Medium Project (50 marks) → 30%
3. Major Project (100 marks) → 40%
4. Presentation (10 marks)   → 10%
                              ─────
                              100% total
```

## Technical Implementation

### Calculation Function
```typescript
export function calculateStudentSba(args: {
  assessments: (Assessment & { marks: Mark[] })[];
  studentId: string;
  termWeights?: TermWeights | null;
}) {
  const usable = assessments.map((assessment) => {
    const mark = assessment.marks.find((m) => m.studentId === studentId);
    
    // Convert to percentage
    const percent = (mark.rawMark / assessment.totalMark) * 100;
    
    // Get weight
    const weight = assessment.weightPercent;
    
    return { percent, weightPercent: weight };
  });
  
  // Calculate weighted average
  const totalWeight = usable.reduce((sum, item) => sum + item.weightPercent, 0);
  const sbaPercent = usable.reduce((sum, item) => {
    const adjustedWeight = (item.weightPercent / totalWeight) * 100;
    return sum + (item.percent * adjustedWeight) / 100;
  }, 0);
  
  return { sbaPercent };
}
```

### Weight Normalization
The system automatically normalizes raw weights to percentages:
- Raw weights can be any positive number
- System converts to percentages summing to 100%
- Example: [10, 20, 30, 40] → [10%, 20%, 30%, 40%]

## Best Practices

### DO ✅
- Use appropriate total marks for assessment type
- Set weights based on educational importance
- Mix different assessment sizes for variety
- Provide clear examples to students
- Balance formative and summative assessments

### DON'T ❌
- Assume total marks = weight percentage
- Make all assessments the same total
- Ignore the power of small, weighted quizzes
- Forget to explain the system to students
- Over-complicate with too many assessments

## Migration from Other Systems

If migrating from a system where total marks = weight:

**Old System:**
- Test 1: 30 marks = 30%
- Test 2: 70 marks = 70%

**New System (Same Result):**
- Test 1: ANY marks, Weight: 30%
- Test 2: ANY marks, Weight: 70%

**New System (More Flexible):**
- Test 1: 50 marks, Weight: 30%
- Test 2: 100 marks, Weight: 70%

## Future Enhancements

- [ ] Templates with common assessment patterns
- [ ] Bulk import from spreadsheets
- [ ] Grade prediction calculator for students
- [ ] Historical weight distribution analysis
- [ ] Recommendations based on subject/grade level
