# DESIGN.md — BIENENHAUS Admin Panel Design System

> **Source of truth for all visual decisions.** Every color, spacing, typography, motion, and component token traces back to this document. No raw hex/rgb values in component CSS — only design tokens from `tokens.css` (`--bh-*`).

---

## 0. Research Log

| Lane                | Deliverable                                                                         | Status |
| ------------------- | ----------------------------------------------------------------------------------- | ------ |
| Token Audit         | Inventoried all `--bh-*` tokens from `packages/bienenhaus-ui/src/tokens.css`        | ✅     |
| Component Inventory | Cataloged 40+ reusable patterns across 20+ pages                                    | ✅     |
| Visual Audit        | Identified inconsistencies in elevation, spacing rhythm, focus states, icon weights | ✅     |
| Reference Match     | Benchmarked against Linear, Stripe, Supabase admin patterns                         | ✅     |

---

## 1. Color System

**Preserved exactly as-is (user requirement: maintain colors).**

| Token                 | Value                    | Usage                                                |
| --------------------- | ------------------------ | ---------------------------------------------------- |
| `--bh-accent`         | `#1FC8C3`                | Primary brand — CTAs, links, focus rings, active nav |
| `--bh-accent-hover`   | `#2DDDD5`                | Hover on accent buttons                              |
| `--bh-accent-soft`    | `rgba(31,200,195,0.12)`  | Active nav background, secondary button bg           |
| `--bh-accent-glow`    | `#56E7DE`                | Glow shadows, focus rings                            |
| `--bh-bg-primary`     | `#050607`                | Page background                                      |
| `--bh-bg-secondary`   | `#0A0D10`                | Sidebar, topbar, elevated panels                     |
| `--bh-bg-card`        | `#1A1E23`                | Cards, modals, forms                                 |
| `--bh-bg-input`       | `#12161B`                | Input/select backgrounds                             |
| `--bh-bg-hover`       | `rgba(255,255,255,0.03)` | Row/card hover                                       |
| `--bh-border`         | `rgba(255,255,255,0.06)` | Default borders                                      |
| `--bh-border-strong`  | `rgba(255,255,255,0.12)` | Input borders, stronger separators                   |
| `--bh-border-focus`   | `rgba(31,200,195,0.6)`   | Focus rings                                          |
| `--bh-text-primary`   | `#F4F4F4`                | Headlines, primary content                           |
| `--bh-text-secondary` | `#BFC6CC`                | Descriptions, meta                                   |
| `--bh-text-tertiary`  | `#8A949C`                | Captions, placeholders                               |
| `--bh-success`        | `#4ADE80`                | Success states                                       |
| `--bh-warning`        | `#FACC15`                | Warning states                                       |
| `--bh-danger`         | `#F87171`                | Destructive actions                                  |
| `--bh-info`           | `#60A5FA`                | Info states                                          |

**No color changes — only application improvements.**

---

## 2. Typography

| Token               | Value                         | Usage                                |
| ------------------- | ----------------------------- | ------------------------------------ |
| `--bh-font-sans`    | `'Inter', system-ui`          | UI, body, buttons, inputs            |
| `--bh-font-display` | `'Playfair Display', serif`   | Display headings (not used in admin) |
| `--bh-font-mono`    | `'JetBrains Mono', monospace` | Code, IDs, prices                    |

**Scale (4px baseline):**

| Token           | Size | Usage                    |
| --------------- | ---- | ------------------------ |
| `--bh-text-xs`  | 12px | Captions, metadata       |
| `--bh-text-sm`  | 13px | Labels, button text, nav |
| `--bh-text-md`  | 14px | Body default, inputs     |
| `--bh-text-lg`  | 16px | Body large, lead         |
| `--bh-text-xl`  | 20px | H3, card titles          |
| `--bh-text-2xl` | 24px | H2, section titles       |
| `--bh-text-3xl` | 28px | H1 small                 |

**Weights:** `--bh-weight-normal: 400`, `--bh-weight-medium: 500`, `--bh-weight-semibold: 600`, `--bh-weight-bold: 700`, `--bh-weight-extrabold: 800`

**Improvements:** Tighten line-heights for UI density, consistent weight application.

---

## 3. Spacing System (4px base)

| Token           | Value | Usage                          |
| --------------- | ----- | ------------------------------ |
| `--bh-space-1`  | 4px   | Icon gaps, tight               |
| `--bh-space-2`  | 8px   | Compact gaps, pills            |
| `--bh-space-3`  | 12px  | Form padding, features         |
| `--bh-space-4`  | 16px  | Standard padding, input height |
| `--bh-space-5`  | 20px  | Comfortable spacing            |
| `--bh-space-6`  | 24px  | Card padding                   |
| `--bh-space-8`  | 32px  | Section gaps, grid gaps        |
| `--bh-space-10` | 40px  | Container padding (tablet)     |
| `--bh-space-12` | 48px  | Major section breaks           |
| `--bh-space-16` | 64px  | Page vertical rhythm           |

**Improvement:** Apply consistently — audit and fix inconsistent gaps.

---

## 4. Radii

| Token              | Value | Usage                        |
| ------------------ | ----- | ---------------------------- |
| `--bh-radius-sm`   | 6px   | Badges, pills, icon buttons  |
| `--bh-radius-md`   | 10px  | Buttons, inputs, dropdowns   |
| `--bh-radius-lg`   | 14px  | Cards (mobile), large inputs |
| `--bh-radius-xl`   | 20px  | Cards (desktop), modals      |
| `--bh-radius-2xl`  | 24px  | Large cards, panels          |
| `--bh-radius-3xl`  | 28px  | Featured cards               |
| `--bh-radius-full` | 999px | Pills, avatars, icon buttons |

**Improvement:** Consistent application — some components use raw values.

---

## 5. Shadows & Elevation

| Token              | Value                                 | Usage                         |
| ------------------ | ------------------------------------- | ----------------------------- |
| `--bh-shadow-sm`   | `0 1px 2px rgba(0,0,0,0.3)`           | Cards (subtle)                |
| `--bh-shadow-md`   | `0 4px 12px rgba(0,0,0,0.35)`         | Cards, dropdowns              |
| `--bh-shadow-lg`   | `0 12px 32px rgba(0,0,0,0.45)`        | Modals, elevated panels       |
| `--bh-shadow-xl`   | `0 24px 60px rgba(0,0,0,0.45)`        | Major modals                  |
| `--bh-shadow-glow` | `0 0 24px var(--bh-accent-glow-soft)` | Focus states, active elements |

**Improvement:** Consistent elevation hierarchy — cards use `sm`, modals use `lg`, focus uses `glow`.

---

## 6. Motion

| Token               | Value                               | Usage                  |
| ------------------- | ----------------------------------- | ---------------------- |
| `--bh-ease-premium` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Signature easing       |
| `--bh-ease-out`     | `cubic-bezier(0.16, 1, 0.3, 1)`     | Exits                  |
| `--bh-dur-fast`     | `140ms`                             | Button press, toggle   |
| `--bh-dur-med`      | `240ms`                             | Hover, panel, dropdown |
| `--bh-dur-slow`     | `400ms`                             | Modal, hero entry      |
| `--bh-dur-xslow`    | `600ms`                             | Complex sequences      |

**Improvement:** Apply consistently — some transitions use raw values.

---

## 7. Component Primitives

### Buttons

| Variant   | Background            | Text                  | Border               | Hover                  |
| --------- | --------------------- | --------------------- | -------------------- | ---------------------- |
| Primary   | `--bh-accent`         | `#fff`                | none                 | `--bh-accent-hover`    |
| Secondary | `--bh-accent-soft`    | `--bh-accent`         | none                 | `rgba(32,184,171,0.2)` |
| Ghost     | transparent           | `--bh-text-secondary` | `--bh-border-strong` | `--bh-bg-hover`        |
| Danger    | `rgba(214,69,65,0.1)` | `#d64541`             | none                 | `rgba(214,69,65,0.18)` |

**Sizes:** Default (8px 14px), SM (5px 10px)

### Inputs / Selects

- Height: 36px (matches `--bh-space-4`)
- Padding: `8px 11px`
- Border: `--bh-border` → `--bh-border-focus` on focus
- Focus ring: `0 0 0 3px var(--bh-accent-soft)`

### Cards

- Background: `--bh-bg-card`
- Border: `1px solid var(--bh-border)`
- Radius: `--bh-radius-lg` (mobile) / `--bh-radius-xl` (desktop)
- Shadow: `--bh-shadow-sm`
- Hover: `--bh-bg-hover` on rows

### Badges

- Radius: `--bh-radius-full` (999px)
- Padding: `3px 9px`
- Font: `--bh-text-xs` (12px), weight 700

### Tables

- Header: `--bh-bg-input` bg, `--bh-text-tertiary` text, uppercase, 11.5px
- Row hover: `--bh-bg-hover`
- Border: `--bh-border`

---

## 8. Layout Tokens

| Token            | Value                   |
| ---------------- | ----------------------- |
| `--bh-sidebar-w` | 248px (collapsed: 64px) |
| `--bh-topbar-h`  | 56px                    |
| `--bh-z-sidebar` | 40                      |
| `--bh-z-topbar`  | 50                      |
| `--bh-z-modal`   | 10001                   |

---

## 9. Visual Improvements Plan

Based on audit, these are the **visual-only improvements** (no color changes):

### 9.1 Elevation & Depth Consistency

- [ ] Unify card shadows: all cards use `--bh-shadow-sm`, hoverable rows use `--bh-bg-hover`
- [ ] Modals use `--bh-shadow-lg` consistently
- [ ] Dropdowns use `--bh-shadow-md`
- [ ] Active nav item gets subtle glow: `box-shadow: 0 0 0 1px var(--bh-accent), var(--bh-shadow-sm)`

### 9.2 Spacing Rhythm Audit

- [ ] Standardize all gaps to `--bh-space-*` tokens
- [ ] Card padding: consistently `--bh-space-6` (24px)
- [ ] Section gaps: `--bh-space-8` (32px)
- [ ] Form field gaps: `--bh-space-3` (12px)
- [ ] Toolbar/search gaps: `--bh-space-2` (8px)

### 9.3 Focus State Polish

- [ ] All interactive elements: `focus-visible` ring using `--bh-border-focus` + `--bh-shadow-glow`
- [ ] Buttons: `focus-visible` adds `box-shadow: 0 0 0 3px var(--bh-accent-soft)`
- [ ] Inputs: already good, verify consistency
- [ ] Links in tables/cards: visible focus state

### 9.4 Icon Weight & Size Consistency

- [ ] Nav icons: 18px, stroke-width 1.8 (current ✅)
- [ ] Button icons: 15-16px, stroke-width 2 (audit)
- [ ] Card/icon buttons: 16px, stroke-width 2
- [ ] Empty state icons: 48px, stroke-width 1.5

### 9.5 Typography Polish

- [ ] Page titles: `--bh-text-2xl` (24px), weight 800, tight leading
- [ ] Section titles: `--bh-text-xl` (20px), weight 700
- [ ] Card titles: `--bh-text-xl` (20px), weight 700
- [ ] Body: `--bh-text-md` (14px), leading-relaxed
- [ ] Labels: `--bh-text-sm` (13px), weight 600
- [ ] Captions/meta: `--bh-text-xs` (12px), `--bh-text-tertiary`

### 9.6 Border & Divider Consistency

- [ ] Cards: `1px solid var(--bh-border)`
- [ ] Table borders: `1px solid var(--bh-border)`
- [ ] Dividers: `1px solid var(--bh-border)`
- [ ] Input borders: `1px solid var(--bh-border)`
- [ ] Strong separators: `--bh-border-strong`

### 9.7 Empty State & Loading Polish

- [ ] Empty states: centered, icon 48px, muted text, generous padding (`--bh-space-12`)
- [ ] Loading skeletons: shimmer animation using `--bh-bg-hover` → `--bh-bg-input`
- [ ] Placeholder cards: consistent `--bh-bg-card`, `--bh-border`, `--bh-radius-xl`

### 9.8 Modal & Overlay Polish

- [ ] Backdrop: `--bh-bg-overlay` with `backdrop-filter: blur(8px)`
- [ ] Modal card: `--bh-bg-card`, `--bh-border-strong`, `--bh-radius-xl`, `--bh-shadow-xl`
- [ ] Close button: top-right, icon-btn, proper focus

### 9.9 Data Table Polish

- [ ] Sticky header with subtle shadow when scrolling
- [ ] Row hover: `--bh-bg-hover` with smooth transition
- [ ] Selected row: `rgba(31,200,195,0.04)` bg + left accent border
- [ ] Checkbox column: centered, `--bh-accent` accent-color

### 9.10 Form Field Polish

- [ ] Label above field, gap `--bh-space-2` (8px)
- [ ] Helper text: `--bh-text-xs`, `--bh-text-tertiary`
- [ ] Error state: `--bh-danger` border + `--bh-danger-soft` bg
- [ ] Disabled state: `--bh-text-disabled` text, `--bh-bg-input` bg

### 9.11 Scrollbar Polish

- [ ] Width: 6px, thumb: `--bh-accent`, track: `--bh-bg-primary`
- [ ] Hover thumb: `--bh-accent-hover`

### 9.12 Selection & Text Highlight

- [ ] `::selection`: `--bh-accent` bg, `--bh-bg-primary` text

---

## 10. Accessibility Constraints

- [ ] All interactive elements: `focus-visible` styles
- [ ] Color contrast: WCAG AA minimum (current tokens pass)
- [ ] Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all animations
- [ ] Skip link: present in `tokens.css` (`.skip-link`)
- [ ] ARIA labels: on icon-only buttons, nav items
- [ ] Table headers: `scope="col"`, semantic HTML

---

## 11. Accepted Debt (Known Limitations)

1. **Legacy landing tokens** — `--accent`, `--bg-primary`, etc. aliased in `tokens.css` for gradual migration
2. **Radius mismatch** — some legacy components use `--radius-card` (26px) vs new `--bh-radius-3xl` (28px)
3. **Font display** — Playfair Display loaded but not used in admin (only landing)
4. **Icon weight variance** — Lucide icons at 1.5-2 stroke width; some legacy at 1.5
5. **Shadow inconsistency** — some custom shadows in component CSS not using tokens

---

## 12. Implementation Order

1. **Token enforcement** — Replace all raw values in component CSS with `--bh-*` tokens
2. **Focus states** — Apply consistent `focus-visible` across all interactive elements
3. **Elevation** — Unify card/modal/dropdown shadows
4. **Spacing** — Audit and fix all gaps to token system
5. **Typography** — Tighten line-heights, consistent weights
6. **Icons** — Standardize sizes and stroke widths
7. **Forms** — Polish inputs, selects, validation states
8. **Tables** — Sticky headers, row selection, hover states
9. **Modals** — Backdrop blur, consistent shadows
10. **QA** — Visual regression at 375/768/1280px, interaction states, motion

---

_This document is the contract. All visual changes must trace to a token or rule defined here._
