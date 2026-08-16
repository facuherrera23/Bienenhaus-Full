# frontend-design-systems — Methodology for Building & Evolving Design Systems

> **Generic design system methodology.** Use when building new components, evolving the system,
> or deciding structure. For exact token values, defer to `bienenhaus-design-system`.

---

## 🎯 What This Skill Covers

How to think about, structure, evolve, and maintain a frontend design system.
This is the engineering discipline that makes design scalable across teams and time.

---

## 🏗️ Atomic Design (Brad Frost)

Design systems are not "one big CSS file". They're layered: small pieces compose into bigger ones.

### Layers

| Layer | What | Example (Bienenhaus) |
|---|---|---|
| **Tokens** | Design decisions as data | `--bh-accent: #1fc8c3` |
| **Atoms** | Single-purpose building blocks | `Button`, `Badge`, `Input` |
| **Molecules** | 2+ atoms composed | `FormField` (label + input + error), `SearchInput` |
| **Templates** | Layout patterns with placeholders | Sidebar + Topbar + Main grid |
| **Pages** | Real content rendered in templates | `PropertiesPage`, `DashboardPage` |

### Rules of Composition

- **Atoms don't know about molecules.** An atom is self-contained, no external context assumed.
- **Molecules compose atoms, don't modify them.** If you need to modify an atom in a molecule, the atom API is wrong.
- **Templates don't contain business data.** They define layout — pages fill data.
- **Pages are the most volatile.** They change often. The system below should be stable.

### Anti-patterns

- ❌ Atoms that depend on parent context (atoms should work anywhere)
- ❌ Molecules that override atom internals with `!important`
- ❌ Pages that re-implement molecule behavior (copy-paste)
- ❌ Templates hard-coded to specific page content

---

## 🎨 Token Architecture

### Token Layers

A mature design system has **3 tiers** of tokens:

```
Tier 1: Primitive tokens  (raw values)
        --bh-color-teal: #1fc8c3;
        
Tier 2: Semantic tokens  (meaning)
        --bh-accent: var(--bh-color-teal);
        
Tier 3: Component tokens  (specific use)
        --bh-button-primary-bg: var(--bh-accent);
```

**Why 3 tiers?**

- Tier 1 enables theming (swap raw values → rebrand)
- Tier 2 enables naming by meaning (semantic > decorative)
- Tier 3 enables component-level overrides without leaking

### Token Categories (checklist)

| Category | What | Example token |
|---|---|---|
| Color | backgrounds, text, borders, accent, status | `--bh-bg-*`, `--bh-text-*`, `--bh-accent*` |
| Typography | font-family, size, weight, line-height, letter-spacing | `--bh-font-sans`, `--bh-text-md`, `--bh-weight-bold` |
| Spacing | 4px scale | `--bh-space-1` (4px) → `--bh-space-24` (96px) |
| Layout | widths, heights, max-widths | `--bh-sidebar-w: 280px` |
| Radii | border-radius scale | `--bh-radius-sm` → `--bh-radius-full` |
| Shadows | shadow tiers | `--bh-shadow-sm` → `--bh-shadow-xl` |
| Motion | duration, easing | `--bh-dur-fast`, `--bh-ease-premium` |
| Z-index | layer stacking | `--bh-z-dropdown`, `--bh-z-modal` |

### Token Naming Rules

- **Prefix consistently** — `--bh-*` (Bienenhaus prefix) prevents collisions
- **Semantic over decorative** — `--bh-accent` not `--bh-teal` (meaning over color)
- **No "global" visual changes** — `--bh-bg-primary` (semantic) not `--bh-bg-dark` (descriptive)
- **Scale-based, not arbitrary** — `--bh-space-1`, `--bh-space-2`, `--bh-space-4` (not `--bh-space-3px`)

---

## 🧩 Component API Design

### Principles

1. **Composition over configuration.** `<Button variant="danger">` not `<DangerButton>`.
2. **Props are the API.** Stable, predictable, documented.
3. **Forwarded attributes.** Always pass through `...props` so consumers can override.
4. **Children for content.** Don't build `<Button label="Save">`. Build `<Button>Save</Button>`.
5. **No magic side effects.** A component renders. It doesn't fetch, subscribe, or mutate global state.

### Required Props (every interactive component)

| Prop | Type | Required | Purpose |
|---|---|---|---|
| `aria-label` | string | if no visible label | Accessibility |
| `disabled` | boolean | optional | Disable interaction |
| `onClick` / event | function | depends | Behavior |
| `className` | string | optional | Custom styling hook |
| `data-testid` | string | optional | Test targeting |

### States Every Component Must Support

| State | How |
|---|---|
| `default` | base styles |
| `hover` | `:hover` — subtle change |
| `focus` | `:focus-visible` — outline visible |
| `active` | `:active` — pressed feedback |
| `disabled` | `disabled` attr — opacity + cursor |
| `error` (inputs) | `aria-invalid="true"` — border + message |

### Component Checklist (before adding to system)

- [ ] Works in isolation (no parent context needed)
- [ ] Has clear, minimal prop API
- [ ] All 6 states implemented and verified
- [ ] Accessible (keyboard, focus, ARIA, contrast)
- [ ] Mobile-first responsive (works 375px → 1280px+)
- [ ] Respects `prefers-reduced-motion`
- [ ] Story file (`*.stories.tsx`) — all variants + states
- [ ] Test file (`*.test.tsx`) — behavior, not just render
- [ ] CSS scoped — no global leakage (CSS Modules)
- [ ] Documentation comment (what it does, why it exists)

---

## 📦 Component Documentation (Stories)

A design system without documentation is a graveyard. Every component needs:

### Story Structure

```tsx
// Button.stories.tsx
export default {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
};

export const Default = () => <Button>Click me</Button>;
export const Primary = () => <Button variant="primary">Save</Button>;
export const Danger = () => <Button variant="danger">Delete</Button>;
export const Disabled = () => <Button disabled>Disabled</Button>;
export const Loading = () => <Button aria-busy>Loading...</Button>;
```

### Story Rules

- **Every variant + size + state** gets a story
- **Every interaction** documented (hover, focus, disabled, loading)
- **Composition stories** — show how it looks combined with other atoms
- **Edge case stories** — long text, empty text, RTL (if applicable)

---

## 🔄 Evolving the System (without breaking)

### Principles

1. **Additive, not destructive.** New tokens/components are additive. Removing deprecation is slow + communicated.
2. **Version if breaking.** Major change → version bump + migration guide.
3. **Deprecation path.** Deprecated component: notify consumers → wait → remove in major.
4. **Never break consumer code silently.** If a component API changes, consumers should see a compile error, not a silent behavior change.

### Migration Patterns

| Pattern | When | How |
|---|---|---|
| **Add prop** | Feature add, non-breaking | Just add, no migration |
| **Rename prop** | API improvement | Keep old prop as alias, mark deprecated, deprecate in next minor, remove in major |
| **Restructure internal CSS** | Refactor, no API change | Internal change, no consumer impact |
| **Change token value** | Design refresh | Update tier 1 primitive, semantic tokens cascade. Document visible changes |
| **Remove component** | Unused / replaced | Mark deprecated → 1 release notice → remove |

### Migration Checklist

- [ ] Renames have a compatibility shim (deprecated alias)
- [ ] Breaking changes get a migration guide in `docs/runbooks/`
- [ ] Test suites updated before consumers fail
- [ ] Storybook still renders after migration
- [ ] E2E suite (Playwright) still passes (key flows)
- [ ] Type-check passes across all workspaces

---

## 🧪 Testing the System

### Unit Tests (Vitest)

Every component should test:

- Renders correctly with default props
- Renders all variants + sizes
- Calls event handlers (onClick, onChange, etc)
- Disabled state works (no click fires, `aria-disabled` or `disabled` attr)
- ARIA attributes correct (`aria-busy`, `aria-label`, `aria-expanded`)
- ForwardRef / className forwarding works

### Visual Regression (Playwright snapshot diff)

- Capture baseline of each component in every variant + state
- 0.1% pixel difference threshold
- Platform-specific baselines (mobile vs desktop)

### E2E Smoke (Playwright)

- Use the actual component in a real page flow
- Verify keyboard interaction (Tab order, Enter, Space)
- Verify focus visible
- Verify responsive at 375px, 768px, 1024px

---

## 🚫 Anti-Patterns in Design Systems

| Anti-pattern | Why bad | Fix |
|---|---|---|
| "One big components folder" | No layering, hard to find | Separate atoms/molecules/templates |
| Tokens with aesthetic names (`--bh-dark`) | Not semantic, breaks on theme swap | Use semantic names (`--bh-bg-primary`) |
| Components that fetch data | Mixing transport with view | Components are dumb — pass data via props |
| `!important` to override atom | Breaks composition | Fix the atom API, not the cascade |
| Hardcoded values inside components | Not using tokens | Use tokens, propose new ones if needed |
| Storybook without edge-case stories | Shows only "happy path" | Add long text, empty, loading, error stories |
| No deprecation path | Silent breaks | Alias + communicate + slow removal |
| "I'll just add it to the button" | Button becomes a god component | New prop only if truly universal; else compose molecule |
| Mixed responsive strategies | Some `display: none` mobile, some grid change | One strategy per component (mobile-first CSS) |

---

## 📊 Design System Health Metrics (Bienenhaus-specific)

| Metric | Healthy | Warning |
|---|---|---|
| Token coverage (% components using tokens vs hardcoded) | > 95% | < 80% means drift |
| Component reuse (how many pages use each atom) | > 3 pages | < 2 uses = candidate for removal |
| Story coverage (% variants/states documented) | > 90% | < 70% means no living doc |
| Test coverage (component .test.tsx) | > 80% | < 50% means trusting luck |
| Migration debt (deprecated components still in use) | 0 | > 3 means stalled cleanup |

---

## 🛠️ When Bienenhaus specifics override

| This skill says... | Bienenhaus says... |
|---|---|
| Use Tier 1/2/3 token layers | Single-layer semantic tokens in `tokens.css` (simpler for now) |
| Storybook for docs | `*.stories.tsx` files exist, runner pending per roadmap |
| General atoms | `@bienenhaus/ui` package is the canonical atoms location |
| General CSS | CSS Modules + custom props, no Tailwind, no styled-components |
| General icon library | Lucide Preact, not FontAwesome/Material |
| General state mgmt | preact-signals (UI) + TanStack Query (server) |

**Conflict resolution:** Bienenhaus wins. This skill informs methodology, not concrete values.
