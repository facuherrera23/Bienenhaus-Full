# reviewing-interface-quality — Visual Quality Audit Framework

> **Quality gate skill.** Use this when verifying visual work BEFORE declaring it done.
> This is the gate that ensures senior-level quality, not "I think it looks OK."
> It pairs with `bienenhaus-design-system` for token compliance and `building-accessible-interfaces` for a11y.

---

## 🎯 When This Skill Activates

- After implementing any UI change (verified or not, this gate must run)
- Before a PR handoff
- When the user asks "does this look right?"
- When you suspect visual regression
- After refactoring CSS/tokens that might cause visual drift
- When reviewing a colleague's work

**This is the LAST gate before "done."** No "done" without this passing.

---

## 📐 The 7 Audit Dimensions

Audit every UI change against these 7 dimensions. All must pass.

### Dimension 1: Design System Compliance

**What it checks:** Did you use tokens or hardcoded values?

**Audit checklist:**

- [ ] All colors are `--bh-*` tokens (no hex literals in CSS)
- [ ] All spacing uses `--bh-space-*` scale (no arbitrary `12px`, `13px`, `17px`)
- [ ] All font sizes use `--bh-text-*` scale
- [ ] All font weights use `--bh-weight-*`
- [ ] All easings use `--bh-ease-*` (no `ease` default, no `cubic-bezier(...)` inline)
- [ ] All durations use `--bh-dur-*`
- [ ] All radii use `--bh-radius-*`
- [ ] All shadows use `--bh-shadow-*`
- [ ] All z-index uses `--bh-z-*`
- [ ] All breakpoints use `--bh-bp-*` (or standard media queries)

**How to verify:** Grep your changed CSS files for forbidden patterns:

- `grep "#[0-9a-fA-F]{3,8}" — hex colors outside tokens
- `grep "px" — pixel values (could be valid, but should be token or arbitrary spacing)
- `grep "cubic-bezier" — custom easings
- `grep "transition:.*[0-9]+ms" — hardcoded durations

**Fail criterion:** Any hardcoded color/spacing/size/easing outside token definitions.

### Dimension 2: Responsive Coverage

**What it checks:** Does it work on all 4 breakpoints?

**Audit checklist:**

- [ ] Mobile (375px) — usable, no horizontal scroll, touch targets ≥ 44px
- [ ] Tablet (768px) — adapts layout if needed, no cramped UI
- [ ] Desktop (1024px) — full layout, breathing room
- [ ] Wide desktop (1280px+) — content doesn't stretch weirdly, max-width respected

**How to verify:**

```javascript
// Playwright resize sequence
await playwright_browser_resize(1280, 800);
await playwright_browser_take_screenshot({ filename: 'desktop-1280.png' });

await playwright_browser_resize(768, 1024);
await playwright_browser_take_screenshot({ filename: 'tablet-768.png' });

await playwright_browser_resize(375, 667);
await playwright_browser_take_screenshot({ filename: 'mobile-375.png' });
```

**Fail criterion:**

- Horizontal scroll on mobile
- Text truncation that loses critical info
- Touch target < 44x44 px
- Content overflowing viewport
- Fixed-width elements that break layout
- Sidebar/topbar doesn't adapt

### Dimension 3: Component States (all 6)

**What it checks:** Are all interactive states implemented?

**Audit checklist per interactive element:**

- [ ] `default` — base styles correct
- [ ] `hover` — visible, subtle change
- [ ] `active` (press) — visible feedback
- [ ] `focus-visible` — keyboard focus is visible (2px outline)
- [ ] `disabled` — visually distinct, `cursor: not-allowed`, `opacity: 0.55`
- [ ] `error` (if input) — border + message accessible

**Extended states (where applicable):**

- [ ] `loading` — skeleton or spinner with `aria-busy`
- [ ] `empty` — designed empty state (not just "no data")
- [ ] `selected` — selected row, active tab
- [ ] `success` — confirmation feedback

**How to verify:**

- `playwright_browser_hover` — screenshot hover state
- Tab through — verify focus visible at each element
- Force disabled state via DevTools or props
- Trigger error state (invalid form input)
- Check for empty state (clear data, reload)

**Fail criterion:** Any interactive element missing a required state.

### Dimension 4: Accessibility

**What it checks:** WCAG AA+ compliance.

**Audit checklist:**

- [ ] Contrast: text ≥ 4.5:1, large text ≥ 3:1, UI ≥ 3:1 (use Chrome DevTools)
- [ ] Focus: visible on `:focus-visible` for all interactive elements
- [ ] Keyboard: every interactive element reachable and operable by Tab
- [ ] ARIA: only where needed, no redundant, no broken
- [ ] Labels: every input has a label (`<label for>` or `aria-label`)
- [ ] Alt text: every meaningful image has `alt`; decorative has `alt=""`
- [ ] Heading order: logical (h1 → h2 → h3, no jumps)
- [ ] Reduced motion: animations stop on `prefers-reduced-motion: reduce`
- [ ] No `outline: none` without replacement
- [ ] Skip link present and functional
- [ ] Modal focus trap works (Tab stays inside, Escape closes)
- [ ] Color is not the only signal (use icon/text + color for status)

**How to verify:**

```bash
# Lighthouse audit
npx lighthouse http://localhost:5173 --only=accessibility --view

# axe DevTools (browser extension)
# Or Playwright axe
```

**Fail criterion:** Any axe critical/serious violation, OR manual check fails.

### Dimension 5: Motion Quality

**What it checks:** Motion is subtle, functional, consistent.

**Audit checklist:**

- [ ] All animations use `--bh-ease-*` (no `ease` default, no custom `cubic-bezier` inline)
- [ ] All durations use `--bh-dur-*` (no `0.3s`, `300ms` hardcoded)
- [ ] No animations on properties that cause layout thrash (`width`, `height`, `top`, `left`)
- [ ] Animations use `transform` and `opacity` whenever possible
- [ ] `prefers-reduced-motion: reduce` is respected (verify with DevTools)
- [ ] No infinite animations except intentional loaders (and those reduced-motion-stop)
- [ ] Hover state changes are 140-240ms max (not slow, not instant)
- [ ] Modal/drawer entries are 200-400ms max
- [ ] No "loading" animation that spins indefinitely without reduced-motion fallback

**How to verify:**

- Trigger DevTools → Rendering → "Emulate prefers-reduced-motion: reduce"
- Reload page
- All animations should be instant (0.01ms)
- No staggered entrance animations still running

**Fail criterion:** Any animation that doesn't respect reduced motion, or uses non-token easing/duration.

### Dimension 6: Visual Hierarchy & Composition

**What it checks:** Does the UI communicate hierarchy clearly?

**Audit checklist:**

- [ ] One clear point focal per view (what user sees first)
- [ ] Hierarchy levels distinguishable (size, weight, color, space)
- [ ] Whitespace intentional (not just "filler"; breathes)
- [ ] Grouping clear (proximity communicates relation)
- [ ] Alignment consistent (no random misalignments)
- [ ] Typography: 2 fonts max (Inter + Playfair in Bienenhaus), 3-4 weights
- [ ] Color: 60-30-10 rule (60% bg, 30% secondary, 10% accent)
- [ ] No competing focal points (no "everything is highlighted")
- [ ] Empty space not awkwardly broken
- [ ] Information density appropriate (not cramped, not too sparse)

**Subjective, but verifiable:** Show to a colleague. Ask "what do you look at first?" If they say anything other than your intended focal point, hierarchy failed.

**Fail criterion:** No clear focal point, OR multiple competing focal points, OR cramped/cluttered.

### Dimension 7: Fidelity vs Intent

**What it checks:** Does the implementation match the design intent?

**Audit checklist:**

- [ ] If Figma/design exists: does implementation match?
- [ ] If no design: does implementation match the skill spec (`bienenhaus-design-system`)?
- [ ] No missing elements (icons, labels, spacing)
- [ ] Text doesn't truncate unexpectedly
- [ ] Images are the right format (WebP for photos, SVG for icons)
- [ ] No broken images or 404 errors
- [ ] No console errors / warnings (Playwright `console_messages` level `error`)
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No CSS warnings (specifically `@media` quirks, vendor prefixes missing)

**How to verify:**

```javascript
// Playwright console check
const messages = await playwright_browser_console_messages({ level: 'error' });
// Should be empty
```

**Fail criterion:** Console errors, missing visual elements, implementation diverges from design intent.

---

## 🔄 Audit Workflow (the gate sequence)

Run these in order. Each failure stops the gate and reports.

### Step 1: Compile-time checks (fast)

```bash
# Type safety
pnpm typecheck

# Lint (diff-scoped in CI, but check full for audit)
pnpm lint

# Unit tests (modules affected)
pnpm test
```

**Fail:** Stop here. Fix before continuing.

### Step 2: Build check

```bash
pnpm build
```

**Fail:** Build error = rejected. Fix before visual audit.

### Step 3: Visual audit (Playwright)

```javascript
// Navigate to changed page
await playwright_browser_navigate('http://localhost:5173/changed-page');

// Desktop screenshot
await playwright_browser_resize(1280, 800);
await playwright_browser_snapshot(); // a11y tree
await playwright_browser_take_screenshot({ filename: 'desktop.png' });

// Tablet
await playwright_browser_resize(768, 1024);
await playwright_browser_take_screenshot({ filename: 'tablet.png' });

// Mobile
await playwright_browser_resize(375, 667);
await playwright_browser_take_screenshot({ filename: 'mobile.png' });

// Console
const errors = await playwright_browser_console_messages({ level: 'error' });
```

### Step 4: A11y audit

```bash
# Lighthouse
npx lighthouse http://localhost:5173/changed-page --only=accessibility --view

# Or in Playwright: axe integration
```

### Step 5: Reduced motion check

DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
Reload page → verify animations are instant.

### Step 6: Token compliance grep

Grep changed CSS files for forbidden patterns (see Dimension 1).

### Step 7: Synthesis verdict

- All 7 dimensions pass → ✅ READY
- Any dimension fails → ❌ BLOCKED with specific failure note

---

## 📋 Audit Report Template

When you complete an audit, structure the report like this:

```markdown
# Visual Audit Report — [Feature/Page Name]
Date: [YYYY-MM-DD]
Auditor: [Agent name]
Changes reviewed: [commit/PR/file list]

## Dimensions Verdict

| Dimension | Status | Notes |
|---|---|---|
| 1. Design System Compliance | ✅/❌ | [specific findings] |
| 2. Responsive Coverage | ✅/❌ | [specific findings] |
| 3. Component States | ✅/❌ | [specific findings] |
| 4. Accessibility | ✅/❌ | [specific findings] |
| 5. Motion Quality | ✅/❌ | [specific findings] |
| 6. Visual Hierarchy | ✅/❌ | [specific findings] |
| 7. Fidelity vs Intent | ✅/❌ | [specific findings] |

## Evidence

[Screenshots at 1280, 768, 375]
[Lighthouse score]
[Console errors if any]

## Failures (if any)

[Detailed list of failures with file/line references]

## Recommendation

[READY | BLOCKED with required fixes]
```

---

## 🚫 Anti-Patterns in Auditing

| Anti-pattern | Why bad | Fix |
|---|---|---|
| "I think it looks good" | No evidence | Screenshot or it didn't happen |
| Only desktop screenshot | Mobile/users exist | All 4 breakpoints |
| Lighthouse without looking at score | Auto-pass = no audit | Read the actual failures |
| Skipping reduced motion test | Reduced motion users exist | Always test |
| "Tests pass, must be good" | Tests don't validate visual | Visual audit separate from tests |
| "I'll review later" | Later doesn't exist | Review at the same time as the change |
| One-big-bang audit at end | Catches too late | Continuous audit per change |

---

## 🎯 Definition of "Done" for Visual Work

A UI change is "done" when:

- [ ] All 7 audit dimensions pass
- [ ] Type-check passes
- [ ] Build passes
- [ ] Unit tests pass (modules affected)
- [ ] E2E smoke passes (if flow has E2E)
- [ ] No new console errors
- [ ] No new ESLint errors
- [ ] Audit report filed (or implicit approved)

**"Should work" is not done. "Verified" is done.**

---

## 🔗 When Other Skills Take Over

| Audit area | This skill | Additional |
|---|---|---|
| Token values verification | ❌ spec | `bienenhaus-design-system` for token definitions |
| A11y specific remediation | ❌ rules | `building-accessible-interfaces` |
| Process for next iteration if audit fails | ❌ | `designing-frontend-interfaces` Phase 5 |
| Visual principles for new round of design | ❌ | `frontend-design` |
| Component API issues found in audit | ❌ | `frontend-design-systems` |
