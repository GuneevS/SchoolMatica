---
name: SchoolMatica UI Design System
description: Design tokens, component patterns, Aurora hero layout, and visual standards
---

# UI Design System Skill

## Tech Stack
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: `tailwindcss-animate`, `tw-animate-css`

## Color System (HSL Custom Properties)
From `globals.css`:
- `--accent-violet` — Primary brand color (purple)
- `--accent-iris` — Secondary accent (blue-purple)
- `--accent-mint` — Success/positive (green)
- `--accent-gold` — Warning/attention (amber)
- `--accent-coral` — Error/destructive (red)
- `--accent-cobalt` — Info (blue)

### Usage Pattern
```css
/* Background with opacity */
bg-[hsl(var(--accent-violet))/0.12]
dark:bg-[hsl(var(--accent-violet))/0.28]

/* Text color */
text-[hsl(var(--accent-violet))]

/* Button styling */
className="bg-[hsl(var(--accent-violet))] hover:bg-[hsl(var(--accent-violet))/0.9]"
```

## Page Layout Pattern: AuroraHero
Every major page uses the `AuroraHero` + `HeroMetricPanel` pattern:

```tsx
<AuroraHero
  eyebrow="Section Name"
  title={<><span className="gradient-text">Primary</span> title</>}
  description="Page description..."
  badges={[
    { label: "Badge text", color: "hsl(var(--accent-iris))" },
  ]}
  actions={<Button>Action</Button>}
  aside={
    <HeroMetricPanel
      title="Panel title"
      icon={<Icon className="h-4 w-4" />}
      metrics={[
        { label: "Metric", value: "42", helper: "context", accent: "highlight" },
      ]}
    />
  }
/>
```

## Card Pattern
```tsx
<Card className="surface-panel rounded-[24px] border border-[hsl(var(--border-strong))/0.5] shadow-ambient">
  <CardHeader className="border-b border-[hsl(var(--border))/0.5] pb-4">
    ...
  </CardHeader>
  <CardContent className="space-y-4 pt-4">
    ...
  </CardContent>
</Card>
```

## Status Badges
Use consistent status coloring:
- ✅ Emerald: Paid, Completed, Approved, Active
- 🟡 Amber: Partially Paid, Pending, Warning
- 🔴 Red: Overdue, Failed, Rejected
- 🔵 Blue: Sent, Processing, Info
- ⚪ Slate: Draft, Inactive

## Component Library
All from `components/ui/`:
`accordion`, `avatar`, `badge`, `button`, `card`, `checkbox`, `command`, `dialog`,
`dropdown-menu`, `input`, `label`, `popover`, `progress`, `scroll-area`, `select`,
`separator`, `slider`, `status-badge`, `table`, `tabs`, `tooltip`

## Stat Grid Pattern
```tsx
<div className="grid grid-cols-3 gap-3 text-sm">
  <div className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/5 p-3 text-center">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">Label</p>
    <p className="text-2xl font-semibold text-foreground">42</p>
  </div>
</div>
```

## Dark Mode
- Always support both light and dark modes
- Use `dark:` prefix for dark mode overrides
- Use `bg-white/5` and `bg-white/10` for subtle dark mode backgrounds
- CSS variables auto-switch via the theme system

## Key Design Rules
1. **24px border radius** on cards (`rounded-[24px]`)
2. **Uppercase tracking** for labels (`text-xs uppercase tracking-[0.4em]`)
3. **Gradient text** for headings (`className="gradient-text"`)
4. **Surface panels** use `surface-panel` class
5. **Shadow ambient** for elevated cards (`shadow-ambient`)
6. **Stagger grid** animation class (`stagger-grid`)
