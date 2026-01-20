---
description: Revamp an existing page or component to be "World Class" using the Designer agent.
---

# UI Revamp Workflow

This workflow focuses purely on aesthetics and user experience.

## Step 1: Design Review
**Agent**: [PixelPerfect (Designer)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\PixelPerfect.md)

**Instructions**:
1.  Analyze the target page/component.
2.  Identify "ugly" or "basic" elements (e.g., standard browser inputs, plain tables).
3.  Propose a new design using modern principles (Cards, Shadows, Gradients, Motion).
    -   *Optional*: Use `generate_image` to visualize the new look.

## Step 2: Stylistic Implementation
**Agent**: [PixelPerfect (Designer)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\PixelPerfect.md)

**Instructions**:
1.  Refactor the code to use ShadcnUI/Tailwind primitives.
2.  Add `framer-motion` for entrance animations.
3.  Ensure responsive design (check Mobile view).
4.  Add "delighters" like hover effects and loaders.

## Step 3: Visual QA
**Agent**: [GuardRail (QA)](c:\Users\Guneev\AppDev\SchoolMatica\SchoolMatica\.agent\roles\GuardRail.md)

**Instructions**:
1.  Verify that the new design didn't break functionality.
2.  Check for horizontal scrolling on mobile (common bug).
3.  Check color contrast for accessibility.
