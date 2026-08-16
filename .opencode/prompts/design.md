# /design — Senior Design Workflow Command

> Orchestrates the full design workflow for Bienenhaus frontend work.
> Loads all 6 design skills and runs the senior design workflow end-to-end.

## Invocation

```
/design [task description or area]
```

## Argument: $ARGUMENTS

The user's design request or the area/component to work on.

---

## Workflow

When the user runs `/design`, follow this orchestration:

### Phase 1: Skill Loading and Context

**Always start by loading the design skills context:**

```
Loaded design skill stack (6 skills):
- bienenhaus-design-system (PRIORITY OVERRIDE — tokens, colours, components)
- frontend-design (visual principles Awwwards-level)
- frontend-design-systems (atomic design methodology)
- designing-frontend-interfaces (BEFORE/IMPLEMENT/ITERATE workflow)
- building-accessible-interfaces (WCAG AA+ rules)
- reviewing-interface-quality (7-dimension audit gate)
```

### Phase 2: Understand

Read the request ($ARGUMENTS) and answer:

1. What problem does this UI solve functionally?
2. Who uses it? (super_admin, admin, staff, viewer, public)
3. What is the PRIMARY action the user must take?
4. What is the SECONDARY action?
5. What information is CRITICAL vs SUPPORT vs NOISE?

### Phase 3: Research

Use `codegraph_explore` to find existing patterns:
- Look for similar components/pages already in Bienenhaus
- Check `@bienenhaus/ui` atoms/molecules to reuse
- Check tokens available in `bienenhaus-design-system`
- Identify 2-3 visual references (premium SaaS, inmobiliarias, CRMs)

### Phase 4: Sketch

1. Mental or ASCII sketch the layout: mobile (375px) + desktop (1280px)
2. Identify the FOCAL POINT (what user sees first)
3. Identify all states: default, hover, focus, active, disabled, error, loading, empty

### Phase 5: Compose

Implement with the rules:
- ALL values from `--bh-*` tokens (NEVER hardcoded)
- Mobile-first CSS, `@media (min-width: ...)` progressive
- All 6 states implemented (default/hover/focus/active/disabled/error)
- `prefers-reduced-motion: reduce` fallback for every animation
- Skip link if new page
- Semantics first (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA only when needed (remember: no ARIA is better than bad ARIA)

### Phase 6: Verify (Playwright)

1. Navigate to the changed page
2. Take screenshots at:
   - Desktop (1280x800)
   - Tablet (768x1024)
   - Mobile (375x667)
3. Keyboard Tab through flow, verify focus visible
4. Open DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → verify all animations stop
5. Console messages at level `error` → must be empty

### Phase 7: Review (7-Dimension Audit)

Run the 7 dimensions from `reviewing-interface-quality`:

| # | Dimension | Check |
|---|---|---|
| 1 | Design System Compliance | All tokens `--bh-*`, no hardcoded values |
| 2 | Responsive Coverage | 375, 768, 1024, 1280 — no horizontal scroll, touch targets 44px+ |
| 3 | Component States | All 6 states implemented and verified |
| 4 | Accessibility | contrast AA, focus, keyboard, ARIA, reduced motion, screen reader |
| 5 | Motion Quality | `--bh-ease-*`, `--bh-dur-*`, no layout-thrash animations |
| 6 | Visual Hierarchy | One focal point, whitespace intentional, typography limited |
| 7 | Fidelity vs Intent | Matches design spec, no console errors, no missing elements |

### Phase 8: Report

Final report structure:

```markdown
# Design Workflow Report — $ARGUMENTS

## Understanding
[Phase 2 answers]

## Research
[Phase 3 findings — existing patterns reused, tokens used, references]

## Implementation
[Phase 5 description — files touched, tokens used, states implemented]

## Verification
[Phase 6 evidence — screenshots URLs, keyboard test result, reduced motion test, console check]

## Audit Result
| Dimension | Status | Note |
|---|---|---|
| 1. Design System Compliance | PASS/FAIL | [detail] |
| 2. Responsive Coverage | PASS/FAIL | [detail] |
| 3. Component States | PASS/FAIL | [detail] |
| 4. Accessibility | PASS/FAIL | [detail] |
| 5. Motion Quality | PASS/FAIL | [detail] |
| 6. Visual Hierarchy | PASS/FAIL | [detail] |
| 7. Fidelity vs Intent | PASS/FAIL | [detail] |

## Recommendation
[READY for merge | BLOCKED with required fixes list]
```

---

## Behavioral Rules

- **NEVER** skip the audit gate. "Should be fine" is not done.
- **NEVER** skip responsive verification. Mobile is mandatory.
- **NEVER** skip the reduced motion check.
- **NEVER** use hardcoded values. Tokens are the law.
- **ALWAYS** use `bienenhaus-design-system` tokens for values.
- **ALWAYS** reuse `@bienenhaus/ui` components when available.
- **ALWAYS** think in hierarchy: what is the focal point?
- **ALWAYS** implement all 6 states for interactive elements.
- **ALWAYS** verify by running the audit dimensions.

## When to Ask vs Decide

Ask the user if:
- The description is genuinely ambiguous (two valid interpretations)
- It requires a scope expansion (touching other modules)
- It's destructive (deleting visual elements, changing routes)

Otherwise decide:
- Token choice (use the closest semantic token)
- Component name (PascalCase, kebab-case file)
- Layout structure (sidebar+main, full-bleed, etc.)
- Empty state copy
- Animation timing (use `--bh-dur-*`)
