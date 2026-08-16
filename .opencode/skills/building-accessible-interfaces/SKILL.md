# building-accessible-interfaces — WCAG AA+ Accessibility for Senior Frontend

> **Accessibility is not optional. It is not a feature. It is not a "nice to have."**
> In Bienenhaus, WCAG AA+ is the minimum bar. Every interactive element must be keyboard-navigable,
> focus-visible, screen-reader-friendly, and respect user motion preferences.

---

## 🎯 What This Skill Covers

Practical accessibility rules for frontend engineers: contrast, focus, keyboard, ARIA, reduced motion, screen reader.
This is not a WCAG dumping ground — this is the actionable subset that matters for SaaS UIs.

---

## 🏛️ WCAG Levels (context)

| Level | Meaning | Bienenhaus target |
|---|---|---|
| A | Minimum (no major barriers) | ❌ Not enough |
| AA | Industry standard (most legal requirements) | ✅ **Minimum bar** |
| AAA | Highest (specialized, not always achievable) | ⭐ Target where feasible |

**Bienenhaus policy:** AA is mandatory. AAA where it doesn't compromise design.

---

## 📏 Contrast Ratios (Non-Negotiable)

### Rules

| Element type | AA minimum | AAA minimum |
|---|---|---|
| Body text (< 18pt / < 14pt bold) | 4.5:1 | 7:1 |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 | 4.5:1 |
| UI components (buttons, borders, icons) | 3:1 | N/A |
| Disabled elements | exempt | exempt |
| Pure decoration | exempt | exempt |
| Focus indicator | 3:1 against adjacent colors | 3:1 |

### How to compute

Contrast ratio = (L1 + 0.05) / (L2 + 0.05) where L is relative luminance.

**Tools:**
- Chrome DevTools: "Color" inspection shows contrast ratio
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- In code: compute via relative luminance formula (sRGB → linear)

### Bienenhaus validated contrasts (already in tokens)

| Combination | Ratio | Status |
|---|---|---|
| `--bh-text-primary` (#f4f4f4) on `--bh-bg-primary` (#050607) | ~17:1 | ✅ AAA |
| `--bh-text-secondary` (#bfc6cc) on `--bh-bg-secondary` (#0a0d10) | ~9:1 | ✅ AAA |
| `--bh-text-tertiary` (#8a949c) on `--bh-bg-card` (#1a1e23) | ~5.5:1 | ✅ AA |
| `--bh-accent` (#1fc8c3) on `--bh-bg-primary` | ~6.8:1 | ✅ AA |
| `--bh-text-tertiary` on `--bh-bg-hover` (rgba 0.03) | ~5:1 on primary | ✅ AA |

**If you introduce a new color combination, verify it. Don't assume.**

---

## 🔍 Focus Visible (Critical)

### Rules

1. **Every interactive element** must have a visible focus state when navigated by keyboard.
2. Focus must be visible against the element's background AND against adjacent colors.
3. **Never** `outline: none` without a replacement that is MORE visible (not less).
4. Focus must appear on `:focus-visible` (keyboard), NOT on `:focus` (mouse click).

### Bienenhaus focus rule (global)

```css
:focus-visible {
  outline: 2px solid var(--bh-accent);
  outline-offset: 3px;
  border-radius: inherit; /* respects rounded parent */
}
```

### Element-specific overrides

| Element | Override | Why |
|---|---|---|
| Buttons | Keep default outline | Outline visible against accent bg |
| Inputs | Border focuses to `--bh-border-focus` + outline | Double indicator for clarity |
| Modals | Focus trap inside modal | User can't Tab outside modal |
| Drawer | Focus trap + Escape closes | Same modal rules |
| Link in text | `text-decoration: underline` on focus | Matches user expectation |

### Anti-patterns

- ❌ `outline: none` globally (accessibility blocker)
- ❌ `outline: 0` without replacement
- ❌ Focus state same as hover state (user can't tell keyboard vs mouse)
- ❌ `:focus` instead of `:focus-visible` (focus ring on mouse click = annoying)

---

## ⌨️ Keyboard Navigation (Critical)

### Tab order rules

1. **Logical flow** — Tab follows visual reading order (left-to-right, top-to-bottom)
2. **No Tab traps** (except modals/drawers — intentional)
3. **Skip links** — first Tab in page lands on "Skip to content"
4. **No disabled elements in Tab order** (use `disabled` attr or `tabindex="-1"`)

### Element keyboard behavior (browser default, but verify)

| Element | Tab focus? | Enter | Space | Notes |
|---|---|---|---|---|
| `<button>` | Yes | activates | activates | works out of the box |
| `<a href>` | Yes | navigates | no-op | only with `href` |
| `<input>` | Yes | no-op | no-op | type-dependent |
| `<select>` | Yes | opens | opens | arrow keys navigate |
| `<textarea>` | Yes | newline if no button | no-op | |
| `<div role="button">` | Only with `tabindex="0"` | must handle Enter + Space | must handle | HIGH FRICTION — prefer `<button>` |
| `<div role="link">` | Only with `tabindex="0"` | must handle Enter | no-op | prefer `<a>` |

**Rule:** Prefer native HTML elements. `<button>` for action, `<a>` for navigation, `<input>` for forms.
Only use `role=` when native doesn't fit.

### Modal focus trap

When modal opens:

1. Focus moves to first interactive element in modal (or modal container)
2. Tab cycles within modal only (last element → first element)
3. Shift+Tab reverse cycles
4. Escape closes modal AND returns focus to trigger element
5. Clicking backdrop closes modal (or just notification, depends on UX intent)

**Implementation:** Use a focus trap utility (or implement: query focusable elements, intercept Tab on last).

### Skip link (every page)

```html
<a href="#main" class="skip-link">Skip to content</a>
...
<main id="main">...</main>
```

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: -9999px;
}
.skip-link:focus-visible {
  left: 0;
  top: 0;
  z-index: var(--bh-z-sticky);
  /* visible styling */
}
```

---

## 📢 ARIA (When to use, when NOT)

### The GOLDEN rule of ARIA

> **No ARIA is better than bad ARIA.**
> If native HTML can do it, use native HTML. ARIA is for when native can't.

### When ARIA is REQUIRED

| Scenario | ARIA | Example |
|---|---|---|
| Dynamic status updates | `aria-live="polite"` or `aria-live="assertive"` | Toast notifications, form validation errors |
| Loading state | `aria-busy="true"` | Fetching data, async button |
| Expandable content | `aria-expanded="true/false"` | Accordion, dropdown, mobile menu |
| Hidden content | `aria-hidden="true"` | Decorative icons, visually-hidden helpers |
| Describedby | `aria-describedby="id"` | Input with helper/error text |
| Labelling | `aria-label="text"` | Icon-only button ( MUST have label) |
| Current page | `aria-current="page"` | Active nav link |
| Selected state | `aria-selected="true"` | Tabs, listbox options |
| Disabled state | `aria-disabled="true"` | If using `<div role="button">` (prefer `disabled` attr on `<button>`) |

### When ARIA is NOT needed (use native HTML instead)

| Don't use ARIA for... | Use instead |
|---|---|
| A button | `<button>` (already keyboard + focus + screen reader) |
| A link | `<a href>` (already announces as link) |
| A form field | `<input>` with `<label for>` (already labels properly) |
| A heading | `<h1>` through `<h6>` (already announces as heading) |
| A list | `<ul>` / `<ol>` + `<li>` (already announces as list) |
| A nav | `<nav aria-label="...">` (only aria label needed) |
| A main content | `<main>` (already announces as main region) |

### Common ARIA mistakes

| Mistake | Why bad | Fix |
|---|---|---|
| `aria-label` on element with visible text | SR hears both, confusing | Pick one — usually visible text wins, drop aria-label |
| `role="button"` on `<button>` | Redundant | Remove — `<button>` already has role |
| `aria-hidden="true"` on focusable element | SR can't reach focusable but it's Tab-able | Don't aria-hide focusable elements |
| `aria-live="assertive"` everywhere | Interruptions spam | Use `polite` for most updates |
| Adding `tabindex="0"` to non-interactive div | Adds to tab order without behavior | Use `<button>` if interactive, leave alone if not |
| `aria-expanded="false"` on `<details>` | Redundant — `<details>` is already expanded-aware | Just use native `<details>` |

---

## 🎬 Reduced Motion (Non-Negotiable)

### The rule

Some users experience motion-related discomfort, dizziness, or nausea from animations.
The OS-level preference `prefers-reduced-motion: reduce` exists to communicate this.
**Every animation must respect it.**

### Implementation

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --bh-dur-fast: 0s;
    --bh-dur-med: 0s;
    --bh-dur-slow: 0s;
    --bh-dur-xslow: 0s;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
  }
}
```

### What gets disabled

| Animation/transition | Disabled when reduced motion |
|---|---|
| Hover state color transitions | Yes — instant change |
| Modal open/close transitions | Yes — instant show/hide |
| Drawer slide-in | Yes — instant show |
| Loading spinner | Yes — instant (use static skeleton if loading indicator needed) |
| Page scroll-to-top on click | Yes — instant jump |
| Sidebar expand/collapse | Yes — instant size change |
| Auto-play carousels | Yes — paused |

### What stays

- Color changes (instant, not animated)
- Display changes (instant)
- Layout changes (instant)

### Testing reduced motion

Chrome DevTools:
1. Open DevTools → Rendering panel (Command+Shift+P → "Rendering")
2. Toggle "Emulate CSS media feature prefers-reduced-motion" → "reduce"
3. Reload page → all animations should be instant

---

## 🖥️ Screen Reader Quick Reference

### How screen readers read content

Screen readers linearize the page. They read in DOM order, not visual order.
They announce:

1. Element type ("button", "link", "heading level 1", "list with 5 items")
2. Accessible name (visible text, `aria-label`, `aria-labelledby`)
3. State if relevant ("expanded", "selected", "disabled")
4. Value if relevant (input values, select selection)

### Testing with screen reader

**Free options:**
- **NVDA** (Windows) — free, widely used
- **VoiceOver** (macOS) — built-in
- **TalkBack** (Android) — built-in
- **ChromeVox** (Chrome extension) — for quick checks

**Test pattern:**
1. Close eyes (or look away)
2. Navigate with keyboard (Tab, arrows, Enter)
3. Listen to what's announced
4. Ask: does this make sense without sight?

### Common screen reader issues

| Issue | Why | Fix |
|---|---|---|
| "Button" with no name | Icon-only button without `aria-label` | Add `aria-label="descriptive text"` |
| "Edit text" with no label | Input without `<label for>` or `aria-label` | Add `<label>` |
| "Image" with no description | `<img>` without `alt` | Add `alt="description"` |
| Decorative image announced as image | `alt=""` missing on decorative | Add `alt=""` (empty) to mark as decorative |
| Heading order jumps (h1 → h4) | Visual size used instead of semantics | Use logical heading order |
| Reading order confusing due to CSS grid | CSS visual reorders DOM | Use DOM order matching visual reading order |
| Live regions not announced | `aria-live` missing on dynamic regions | Add `aria-live="polite"` to status containers |

---

## 📋 Accessibility Checklist (every release)

### Visual

- [ ] All text contrast ≥ 4.5:1 (AA)
- [ ] Large text (≥ 18pt) contrast ≥ 3:1
- [ ] UI components (buttons, borders) contrast ≥ 3:1
- [ ] Focus indicator visible (≥ 3:1 against adjacent)
- [ ] Color is not the only signal (also use shape/text/icon for status)

### Keyboard

- [ ] All interactive elements reachable by Tab
- [ ] Tab order is logical (matches reading order)
- [ ] No Tab traps (except modals/drawers)
- [ ] Escape closes modals/drawers
- [ ] Skip link present and works
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate selects, tabs, listboxes

### ARIA

- [ ] No `role="button"` on `<button>` (redundant)
- [ ] Icon-only buttons have `aria-label`
- [ ] Inputs have `<label>` or `aria-label`
- [ ] Dynamic status updates use `aria-live`
- [ ] Loading state uses `aria-busy`
- [ ] Dropdowns use `aria-expanded`
- [ ] Active nav links use `aria-current="page"`
- [ ] Decorative icons have `aria-hidden="true"`

### Motion

- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] No auto-playing video
- [ ] No animations of large areas at high frequency
- [ ] Critical state changes (loading, error) not only conveyed by animation

### Screen reader

- [ ] Page has descriptive `<title>`
- [ ] Page has one `<h1>`
- [ ] Headings logical order (h1 → h2 → h3, not jumping)
- [ ] Images have `alt` (or `alt=""` if decorative)
- [ ] Forms have labels
- [ ] Error messages are accessible (`aria-describedby` + `aria-invalid`)

### Mobile

- [ ] Touch targets ≥ 44x44 px (Apple) / 48x48 dp (Google)
- [ ] No hover-only interactions
- [ ] Pinch zoom not disabled (`user-scalable=yes`)

---

## 🚫 Anti-Patterns (accessibility)

| Anti-pattern | Why bad | Fix |
|---|---|---|
| `outline: none` | No focus indicator for keyboard users | Use `:focus-visible` with 2px solid accent |
| Color-only status | Colorblind users miss status | Add icon + text + color |
| Click handler on `<div>` | No keyboard equivalent | Use `<button>` |
| Modal without focus trap | Tab escapes modal unexpectedly | Implement focus trap |
| Modal without Escape key | User can't close via keyboard | Add Escape handler |
| Hidden content with `display: none` expected as accessible | SR skips it | Use `visibility: hidden` + `aria-hidden="false"` if must be SR-only |
| `tabindex="1"` on random elements | Breaks natural tab order | Use `tabindex="0"` to add to natural order, or remove |
| `aria-label` overrides visible text | Inconsistent experience | Match aria-label with visible text |
| Animated status with no `aria-live` | SR users don't know it's loading | Add `aria-live="polite"` to status container |

---

## 🧪 Testing Workflow (manual + automated)

### Manual (quick)

1. **Tab through page** — every interactive element reachable, focus visible, logical order
2. **Visual contrast check** — Chrome DevTools element inspector shows contrast for text
3. **Scale page at 200%** — does layout still work? (WCAG AA requires 200% zoom)
4. **Reduce motion** — DevTools → Rendering → Emulate reduced motion
5. **Listen with screen reader** — close eyes, navigate, ask "is this usable?"

### Automated

| Tool | Catches | Doesn't catch |
|---|---|---|
| **axe DevTools** (Chrome extension) | Most ARIA issues, contrast issues, missing labels | Logical Tab order quality, semantic appropriateness |
| **Lighthouse Accessibility** (Chrome Audits) | Similar to axe + scoring | Same limitations |
| **Playwright `@axe-core/playwright`** | Programmatic a11y issues in E2E | Same limitations |
| **WAVE** (extension) | Visual overlay of a11y issues | Same limitations |

### Bienenhaus accessibility budget

| Element | Standard |
|---|---|
| Lighthouse Accessibility | ≥ 95 (admin), ≥ 95 (landing) |
| axe critical violations | 0 |
| axe serious violations | 0 |
| manual keyboard nav | All flows usable |
| manual screen reader | All major flows usable |

---

## 🔗 When Other Skills Take Over

| Accessibility area | This skill | Additional |
|---|---|---|
| Specific contrast values | ✅ | Bienenhaus tokens validated in `bienenhaus-design-system` |
| Motion tokens | ✅ rules | `bienenhaus-design-system` has specific tokens |
| Component states (focus, disabled, error) | ✅ rules | `bienenhaus-design-system` has per-component state specs |
| Visual regression (pixel diff) | ❌ | `reviewing-interface-quality` |
| Process for designing accessible UI from scratch | ❌ | `designing-frontend-interfaces` Phase 5 VERIFY |
