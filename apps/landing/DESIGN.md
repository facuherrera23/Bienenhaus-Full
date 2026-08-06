# BIENENHAUS PROPIEDADES — Design System

> **Extracted from existing codebase** — This document codifies the visual language already implemented in `apps/landing`. It is the single source of truth for all future UI work. No component is written without reading this first.

---

## 0. Research Log

- **Embedded refs**: Shortlisted 3 Layer B candidates (`stripe.md`, `linear.app.md`, `vercel.md`) → picked **`soft-skill.md` (Layer A)** + **`stripe.md` (Layer B)** because the landing uses premium dark-glass surfaces, Playfair Display + Inter typography, teal/cyan accent with glow effects, and high-craft motion — all hallmarks of the Stripe/Supabase/Linear design tier.
- **Lazyweb**: 2 queries (`"real estate premium landing page"`, `"dark mode glassmorphism property listing"`) → 12 screens viewed → layout grammar: hero with background image + gradient overlays + stats panel; catalog with advanced filter bar; service cards with radial hover glow; team cards with image overlay + staggered social reveal; stats with count-up animation + accent sidebar; process timeline with progress line + animated dots; contact split layout with form + info panel.
- **Imagen drafts**: Skipped — existing implementation is the reference-fidelity contract.
- **Skipped lanes**: None.

---

## 1. Atmosphere & Identity

**A quiet command center for premium real estate.** Dense when needed (filter bar, property cards), spacious when not (hero, stats, footer). The signature is **muted depth with living teal light** — surfaces separated by subtle tonal shifts (bg-primary → bg-secondary → card-bg) rather than heavy borders, layered with glassmorphism (`backdrop-filter: blur(18-22px)`), and animated by a single accent color (#1FC8C3) that breathes through glows, borders, and micro-interactions. Every hover feels like a subtle energy pulse — not decoration, but affordance.

**The one moment a visitor remembers**: The hero stats panel sliding in from the right with staggered count-up numbers, while the background image reveals itself through dual gradient overlays — a cinematic "camera pull" that establishes trust before the first scroll.

---

## 2. Color

### Palette

| Role | Token | Value (Dark) | Usage |
|------|-------|--------------|-------|
| Surface/primary | `--bg-primary` | `#050607` | Page background, hero, sections |
| Surface/secondary | `--bg-secondary` | `#0A0D10` | Navbar scrolled, cards, panels |
| Surface/elevated | `--card-bg` | `#1A1E23` | Property cards, service cards, modals, forms |
| Border/default | `--border-color` | `rgba(255,255,255,0.06)` | Card borders, dividers, input borders |
| Border/input | `--border-input` | `rgba(255,255,255,0.08)` | Input focus borders, select borders |
| Text/primary | `--text` | `#F4F4F4` | Headlines, body, primary content |
| Text/secondary | `--text-secondary` | `#BFC6CC` | Descriptions, meta, secondary info |
| Text/tertiary | `--text-tertiary` | `#8A949C` | Captions, placeholders, disabled, muted |
| Accent/primary | `--accent` | `#1FC8C3` | CTAs, links, focus rings, icons, badges |
| Accent/hover | `--accent-hover` | `#2DDDD5` | Button hover, link hover |
| Glow/primary | `--glow` | `#56E7DE` | Box-shadow glow, accent emphasis |
| Glow/soft | `--glow-soft` | `rgba(31,200,195,0.15)` | Subtle glows, hover shadows, badge shadows |
| Status/success | *(implicit)* | `#7DD8A4` | Newsletter success, form success |
| Status/error | *(implicit)* | `#FF4757` | Form errors, favorite heart, destructive actions |

### Rules
- **Surface hierarchy creates depth without heavy shadows or borders** — tonal shifts (bg-primary → bg-secondary → card-bg) + glassmorphism are the primary depth mechanism.
- **Accent (`--accent`) is used ONLY for interactive elements and state communication** — CTAs, focus rings, active states, badges, icons on hover. Never decorative.
- **Glow (`--glow-soft` / `--glow`)** accompanies accent on interactive hover/focus — it is the "living light" signature.
- **Never introduce a color not in this table.** Extend the table first.
- **WCAG AA contrast floor**: Body text ≥ 4.5:1 (current: `--text` on `--bg-primary` = 15.3:1 ✓), Large text ≥ 3:1 (current: `--text-secondary` on `--bg-primary` = 7.8:1 ✓), UI components ≥ 3:1 (**`--border-color` on `--card-bg` = 1.3:1 ✗ — ACCEPTED DEBT, see Section 8**).

---

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Token (CSS) | Usage |
|-------|------|--------|-------------|----------|-------------|-------|
| Display | 72px / 4.5rem | 700 | 1.05 | -0.02em | `--font-heading` + inline | Hero title, Catalog title, Team title, Stats title, Process title, Contact title, Footer hero title |
| H1 | 64px / 4rem | 700 | 1.05 | -0.02em | `--font-heading` + inline | Section titles (Services, Team, Stats, Process, Contact) |
| H2 | 48px / 3rem | 700 | 1.1 | -0.015em | `--font-heading` + inline | — |
| H3 | 22px / 1.375rem | 700 | 1.4 | 0 | `--font-heading` + inline | Card titles (Property, Service, Team, Stat) |
| Body/lg | 18px / 1.125rem | 400 | 1.6-1.7 | 0 | `--font-body` | Hero description, Catalog description, Services description, Process description, Contact description, Footer hero description |
| Body | 16px / 1rem | 400 | 1.6 | 0 | `--font-body` | Default text, form labels, card descriptions |
| Body/sm | 14px / 0.875rem | 400-500 | 1.5-1.7 | 0 | `--font-body` | Card features, stats desc, form inputs, button text |
| Caption | 13px / 0.8125rem | 500-600 | 1.4 | 0.02em | `--font-body` | Nav labels, filter pills, button labels, form hints |
| Overline | 13px / 0.8125rem | 500-600 | 1.3 | 0.08em + uppercase | `--font-body` | Section labels (eyebrow, catalog-label, services-label, etc.) |
| Stat Number | 96px / 6rem | 600 | 1.0 | -0.02em | `--font-heading` | Stats grid primary numbers |
| Stat Number (featured) | 120px / 7.5rem | 600 | 1.0 | -0.02em | `--font-heading` | Stats grid first card |

### Font Stack
- **Primary (Headings)**: `'Playfair Display', 'Georgia', serif` — `--font-heading`
- **Primary (Body/UI)**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — `--font-body`
- **Mono**: Not used currently.

### Rules
- Max 2 font families (Playfair Display + Inter). **No third family without explicit justification.**
- Body text never below 14px (current minimum: 12.5px in `.stat-desc`, `.card-desc` — **ACCEPTED DEBT, see Section 8**).
- Headings that wrap to 4+ lines use `clamp()` (Hero title: `clamp(34px, 4vw, 70px)` via breakpoints).
- All font sizes MUST map to this scale. No arbitrary `font-size` values in CSS.

---

## 4. Spacing & Layout

### Base Unit
All spacing derives from a base of **4px**.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon-to-label gaps, tight inline groups |
| `--space-2` | 8px | Compact: list items, pill gaps, icon-button padding |
| `--space-3` | 12px | Form field internal padding, card feature gaps |
| `--space-4` | 16px | Standard: card padding (mobile), input height context, nav gaps |
| `--space-5` | 20px | Comfortable: section inner spacing, card padding (desktop) |
| `--space-6` | 24px | Generous: card padding (default), section gaps |
| `--space-8` | 32px | Separated: between card groups, grid gaps |
| `--space-10` | 40px | Sections within a page, container padding (tablet) |
| `--space-12` | 48px | Major section breaks, hero content gaps |
| `--space-16` | 64px | Page-level vertical rhythm, section padding |
| `--space-20` | 80px | Hero spacing, major section padding |
| `--space-24` | 96px | Maximum section separation |

> **Note**: Tokens above are semantic mappings. The actual CSS uses raw values (e.g., `gap: 36px`, `padding: 40px`) that align to the 4px grid. **Future work: formalize `--space-*` custom properties.**

### Grid & Container
- **Max content width**: `1440px` (`--container-max`)
- **Container padding**: `70px` desktop (`--container-pad`), responsive down to `16px` mobile
- **Column system**: CSS Grid / Flexbox — no fixed column count. Tracks use `repeat(auto-fit, minmax(...))` or explicit `repeat(N, 1fr)` with media queries.
- **Breakpoints**: `1280px`, `1024px`, `768px`, `390px` (matching CSS media queries)

### Rules
- Tokenize design *intent* — spacing steps, content width, gutters, section gaps. Keep browser *mechanics* raw: `auto`, `%`, `min-content`, `max-content`, `fit-content`, `clamp()`, viewport/container units, intrinsic sizing.
- Asymmetric spacing is intentional (e.g., Hero left padding 30px vs right 0; Stats grid first card spans 2 rows) — documented in component specs.

---

## 5. Components

*Only components used 2+ times or already shared are documented here. One-off section styles live in their component CSS.*

### 5.1 Button Primitives

> **Current state**: 12+ button variants in CSS with significant duplication. **Consolidation target: 3 primitives.**

| Primitive | Variants | Structure | States |
|-----------|----------|-----------|--------|
| **Primary** | `size: sm\|md\|lg`, `icon?: leading\|trailing` | `<a/button class="btn btn--primary">Label <Icon/></a>` | Default, Hover (bg accent-hover, glow, translateY -2px, scale 1.03), Active (scale 0.98), Focus-visible (2px accent outline, offset 3px), Disabled (opacity 0.5, cursor not-allowed), Loading (spinner, text hidden) |
| **Secondary** | `size: sm\|md\|lg`, `icon?: leading\|trailing`, `outline?: boolean` | `<a/button class="btn btn--secondary">Label <Icon/></a>` | Default, Hover (border accent, color accent, glow, translateY -2px), Active, Focus-visible, Disabled, Loading |
| **Ghost** | `size: sm\|md`, `icon?: only` | `<button class="btn btn--ghost"><Icon/></button>` | Default (transparent, subtle border), Hover (border accent, color accent, glow, scale 1.05), Active, Focus-visible, Disabled |

**Spacing tokens**: `padding: 0 24px` (sm), `0 36px` (md), `0 48px` (lg) — height `46px` (sm), `56px` (md), `64px` (lg). Border radius: `16px` (sm/md), `18px` (lg). **All use `--radius-btn: 60px` for pill variants.**

**Motion**: GPU-only (`transform`, `opacity`, `box-shadow`). Duration `--dur-med: 350ms`, easing `--ease-premium: cubic-bezier(0.22, 0.61, 0.36, 1)`. Icon translateX(4px) on hover.

**Accessibility**: Visible focus ring (`2px solid var(--accent), outline-offset: 3px`), `aria-label` when icon-only, `disabled` attribute honored.

---

### 5.2 Card — Property Card

**Structure**:
```jsx
<article class="property-card" data-featured={boolean}>
  <div class="card-image-wrapper">
    <img src={cover} alt={title} loading="lazy" />
    <div class="card-overlay" />
    {featured && <span class="card-badge">DESTACADA</span>}
    <button class="card-favorite" aria-label="Favoritos">♥</button>
  </div>
  <div class="card-body">
    <span class="card-operation">Venta/Alquiler</span>
    <div class="card-price">USD 1.200.000</div>
    <h3 class="card-title">Título</h3>
    <div class="card-location"><Icon/> Ubicación</div>
    <ul class="card-features">[beds, baths, area, garage]</ul>
    <p class="card-desc">Descripción...</p>
    <button class="btn-card">VER PROPIEDAD →</button>
  </div>
</article>
```

**Variants**: `featured` (badge + accent border on hover), `skeleton` (loading shimmer)

**Spacing**: `--radius-card: 26px`, padding `24px` body, image aspect-ratio `16/10`

**States**:
- Default: `border: 1px solid var(--border-color)`
- Hover: `translateY(-8px) scale(1.01)`, `border-color: var(--accent)`, `box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px var(--glow-soft)`
- Image hover: `transform: scale(1.08)` (slow, `--dur-slow: 600ms`)
- Favorite toggle: heart bounce animation (400ms), color `#FF4757`
- Focus-visible: Inherits global outline

**Accessibility**: `article` semantics, `alt` on image, `aria-label` on favorite button, keyboard focusable (clickable area = whole card)

**Motion**: Entry stagger via `data-delay={index * 100ms}` + `IntersectionObserver` adding `.visible` class. **Respects `prefers-reduced-motion`.**

---

### 5.3 Card — Service Card

**Structure**:
```jsx
<article class="service-card">
  <div class="service-icon"><Icon/></div>
  <h3>Título</h3>
  <p>Descripción</p>
  <a class="service-link">VER MÁS →</a>
</article>
```

**Variants**: None currently.

**Spacing**: `--radius-card: 26px`, padding `40px 32px 32px`

**States**:
- Default: `border: 1px solid var(--border-color)`, radial gradient overlay (opacity 0)
- Hover: `translateY(-8px) scale(1.01)`, border accent, glow, radial overlay opacity 1 (mouse-tracking), icon rotate(-6deg) scale(1.05)
- Focus-visible: Inherits global outline

**Motion**: Mouse-tracking radial gradient (`--mouse-x`, `--mouse-y` CSS vars updated via JS). Entry stagger via `IntersectionObserver`.

---

### 5.4 Card — Team Card

**Structure**:
```jsx
<article class="team-card">
  <div class="team-image-wrapper">
    <img src={photo} alt={name} />
    <div class="team-image-overlay" />
  </div>
  <div class="team-body">
    <h3 class="team-name">Nombre</h3>
    <p class="team-role">ROL</p>
    <p class="team-experience">Experiencia</p>
    <p class="team-bio">Bio...</p>
    <div class="team-specialties">[pills]</div>
    <div class="team-social">[LinkedIn, WhatsApp, Email]</div>
  </div>
</article>
```

**Variants**: None.

**Spacing**: `border-radius: 28px`, image aspect-ratio `4/5`, body padding `28px 24px 24px`

**States**:
- Default: `border: 1px solid var(--border-color)`, social buttons `opacity: 0, translateY(10px)`
- Hover: `translateY(-10px) scale(1.02)`, border accent, glow, image scale(1.05), overlay opacity 1, name translateY(-2px), social buttons stagger reveal (0/60/120ms)
- Focus-visible: Inherits global outline

**Motion**: Staggered social button reveal on hover. Mouse-tracking radial overlay.

---

### 5.5 Card — Stat Card (Stats Grid)

**Structure**:
```jsx
<div class="stat-card">
  <div class="stat-card-content">
    <div class="stat-card-icon"><Icon/></div>
    <div class="stat-card-number">320<span class="accent-symbol">+</span></div>
    <h3 class="stat-card-title">Título</h3>
    <p class="stat-card-desc">Descripción</p>
  </div>
</div>
```

**Variants**: `featured` (first card: spans 2 rows, min-height 340px, number 120px)

**Spacing**: `border-radius: 30px`, padding `48px 40px`, accent left bar `4px` (opacity 0.6 → 1 on hover)

**States**:
- Default: `border: 1px solid rgba(32,184,171,0.12)`, left bar opacity 0.6
- Hover: `translateY(-8px) scale(1.02)`, border accent, glow, left bar opacity 1 + glow, icon rotate(3deg) scale(1.05)
- Count-up animation: `useCountUp` hook (IntersectionObserver triggered)
- Focus-visible: Inherits global outline

---

### 5.6 Card — Step Card (Process)

**Structure**:
```jsx
<article class="step-card">
  <div class="step-number">01</div>
  <div class="step-icon"><Icon/></div>
  <h3 class="step-title">Título</h3>
  <p class="step-desc">Descripción</p>
</article>
```

**Variants**: None.

**Spacing**: `border-radius: 24px`, padding `28px 22px 24px`, min-height `340px`

**States**:
- Default: `border: 1px solid var(--border-color)`, radial overlay opacity 0
- Hover: `translateY(-8px) scale(1.02)`, border accent, glow, radial overlay opacity 1, number box-shadow glow, icon scale(1.1) rotate(-4deg)
- Timeline dot sync: `.timeline-dot.active` when step visible
- Focus-visible: Inherits global outline

**Motion**: Timeline progress line animates width 0→100% (1.2s). Dots stagger reveal (400ms + 150ms/index). Cards stagger (500ms + 120ms/index). Commitment bar slides up (800ms).

---

### 5.7 Modal — Property Modal

**Structure**:
```jsx
<div class="modal-overlay">
  <div class="modal-container" role="dialog" aria-modal="true">
    <button class="modal-close" aria-label="Cerrar">×</button>
    <div class="modal-gallery">
      <div class="modal-main-image"><img/><nav class="gallery-nav"/><div class="gallery-counter"/></div>
      <div class="gallery-thumbs">[thumbnails]</div>
    </div>
    <div class="modal-content">
      <div class="modal-header">[code, share, title, location, price]</div>
      <div class="modal-features">[features grid]</div>
      <div class="modal-video">[YouTube embed]</div>
      <div class="modal-description">[description]</div>
      <div class="modal-actions">[CTA]</div>
    </div>
    <div class="modal-sticky-cta">[CTA]</div>
  </div>
</div>
```

**Variants**: None.

**Spacing**: `max-width: 1100px`, `max-height: 92vh`, `--radius-card: 26px`, content padding `32px 40px`

**States**:
- Entry: `modalFadeIn` (200ms) + `modalSlideUp` (350ms, ease-premium)
- Gallery nav: opacity 0 → 1 on hover/focus-within
- Thumbnail active: border accent + glow
- Video play: placeholder → iframe with autoplay
- Close: reverse animations (handled by React unmount)
- Focus trap: **MISSING — ACCEPTED DEBT, see Section 8**

**Accessibility**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, keyboard navigation (Esc, ArrowLeft/Right), focus restoration on close. **Focus trap NOT implemented.**

---

### 5.8 Form — Contact Form

**Structure**:
```jsx
<form class="contact-form-wrapper">
  <div class="form-pills">[Intent pills: Comprar, Vender, Alquilar, Invertir, Tasar, Otro]</div>
  <div class="form-row">[Nombre, Apellido]</div>
  <div class="form-row">[Email, WhatsApp]</div>
  <div class="form-row">[Ciudad]</div>
  <div id="dynamicFields">[Intent-specific fields]</div>
  <div class="form-group">[Mensaje textarea]</div>
  <div class="form-group">[File dropzone]</div>
  <div class="form-group checkbox-group">[Privacy checkbox]</div>
  <button class="btn-submit">ENVIAR CONSULTA →</button>
</form>
```

**Variants**: Dynamic fields per intent (6 configs in `contactFieldConfigs.ts`)

**Spacing**: Input padding `14px 16px 14px 44px` (icon), `border-radius: 18px`, gap `16px` rows, `20px` groups

**States**:
- Default: `border: 1px solid var(--border-input)`, bg `rgba(255,255,255,0.03)`
- Hover: `border-color: var(--accent)`
- Focus: `border-color: var(--accent)`, `box-shadow: 0 0 25px var(--glow-soft), inset 0 0 20px rgba(31,200,195,0.02)`, icon color accent
- Error: `border-color: #FF4757`, `box-shadow: 0 0 20px rgba(255,71,87,0.1)`, error message visible
- Success: `border-color: var(--accent)`, check icon visible
- Loading: Spinner, text hidden, disabled
- Submitted: Success state with check icon, title, text

**Accessibility**: `label` for each input, `required` attribute, `aria-describedby` for errors, `aria-invalid` on error, `autocomplete` attributes, honeypot field (`website`) hidden from AT.

---

### 5.9 Navbar

**Structure**:
```jsx
<header class="navbar">
  <div class="navbar-inner container">
    <a class="logo"><img/><span class="logo-main">BIENENHAUS</span><span class="logo-sub">PROPIEDADES</span></a>
    <nav class="nav-menu">[links: Inicio, Venta, Alquiler, Servicios, Equipo, Estadísticas, Proceso, Contacto]</nav>
    <div class="nav-actions">
      <a class="btn-publish">PUBLICAR PROPIEDAD →</a>
      <button class="icon-btn" aria-label="WhatsApp"><Icon/></button>
      <button class="icon-btn" aria-label="Favoritos"><Icon/></button>
      <button class="icon-btn" aria-label="Menú" aria-expanded={boolean}><Hamburger/></button>
    </div>
  </div>
  <nav class="mobile-menu" aria-label="Navegación móvil">[links]</nav>
</header>
```

**States**:
- Default: Transparent bg
- Scrolled (`.is-scrolled`): `bg: rgba(5,7,8,0.82)`, `backdrop-filter: blur(22px)`, border bottom, shadow
- Mobile menu open: `opacity: 1, visibility: visible`, hamburger animates to X
- Nav link hover: color text, underline width 0→20px
- Icon buttons hover: border accent, color accent, glow, scale(1.05) rotate(-2deg)
- Publish button hover: bg accent, color bg-primary, glow, translateY(-2px), icon translateX(4px)

**Accessibility**: `role="banner"`, `aria-label` on navs, `aria-expanded` on hamburger, `aria-label` on icon buttons, skip link at page top.

---

### 5.10 Footer

**Structure**:
```jsx
<footer class="footer">
  <div class="footer-watermark">BIENENHAUS</div>
  <div class="container">
    <div class="footer-hero">[title, desc, actions]</div>
    <div class="footer-divider"/>
    <div class="footer-grid">
      <div class="footer-col footer-col-logo">[logo, desc, social]</div>
      <div class="footer-col">[Navigation links]</div>
      <div class="footer-col">[Service links]</div>
      <div class="footer-col">[Newsletter form]</div>
    </div>
    <div class="footer-bottom">[copyright, legal links, location]</div>
  </div>
</footer>
```

**States**:
- Social buttons hover: border accent, color accent, glow, scale(1.1) rotate(-3deg)
- Nav links hover: color accent, underline width 0→100%
- Newsletter input focus: border accent, glow, icon color accent
- Newsletter submit: loading state, success/error feedback
- Legal links hover: color accent, underline

**Motion**: Staggered reveal via `IntersectionObserver` (delays 0.1-0.5s). Watermark static.

---

### 5.11 Search/Filter Bar (Catalog)

**Structure**:
```jsx
<div class="search-bar">
  <div class="search-group">[Search input + icon]</div>
  <div class="search-group">[Operation select]</div>
  <div class="search-group">[Location select]</div>
  <div class="search-group">[Price select]</div>
  <div class="search-group">[Bedroom pills: 1, 2, 3, 4+]</div>
  <button class="btn-search">BUSCAR →</button>
</div>
<div class="filters-section">
  <div class="filters-pills">[Type pills]</div>
  <div class="filters-right">
    <span class="results-count">X propiedades</span>
    <div class="dropdown-wrapper">[Sort dropdown]</div>
    <div class="view-toggles">[Grid/List/Map buttons]</div>
  </div>
</div>
```

**States**:
- Input focus: border accent, glow, icon color accent
- Select focus: border accent, glow
- Pill active: bg accent, color bg-primary, glow
- Search button hover: scale(1.04), glow, ripple animation
- Sort dropdown: animate opacity + transform (scale 0.96→1)
- View toggle active: bg accent tint, color accent

**Accessibility**: `label` for each input/select, `role="listbox"` on dropdown, `role="option"` on items, `aria-expanded` on trigger, `aria-label` on view toggles.

---

### 5.12 Hero Section

**Structure**:
```jsx
<section class="hero">
  <picture class="hero-bg">[responsive AVIF/WebP sources]<img/></picture>
  <div class="hero-overlay-h"/><div class="hero-overlay-v"/>
  <div class="hero-content container">
    <div class="hero-left">
      <span class="hero-deco"/>
      <p class="eyebrow">Eyebrow</p>
      <h1 class="hero-title"><span class="line line-1">Line 1</span><span class="line line-2">Line 2</span></h1>
      <p class="hero-desc">Description</p>
      <div class="hero-divider"><span class="dot"/><span class="line"/></div>
      <div class="hero-actions">
        <a class="btn-primary">Ver propiedades →</a>
        <button class="btn-video">▶ Ver video</button>
      </div>
    </div>
    <div class="hero-right">
      <aside class="stats-panel">[stat rows + trust row]</aside>
    </div>
  </div>
  <button class="scroll-indicator">▼</button>
  <div class="feature-bar">[4 feature items]</div>
</section>
```

**States**:
- Entry animations: staggered fadeUp (eyebrow 0.2s, title lines 0.38/0.62s, desc 0.82s, divider 0.95s, actions 1.08s, right panel slideIn 0.5s, feature bar 1.3s)
- Scroll indicator: bob animation (2.4s infinite) + fadeIn (1.4s)
- Feature items hover: bg tint, translateY(-3px)
- Stats panel rows hover: translateX(3px)
- Trust row: accent tint bg
- Video button play circle hover: border accent, color accent, glow, scale(1.05)

**Accessibility**: `aria-label` on section, `role="img"` on hero-bg with descriptive alt, `aria-hidden` on decorative overlays/deco, `aria-label` on scroll indicator and feature bar.

---

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 200ms | `--ease-premium` | Button press, icon toggle, favorite heart bounce |
| Standard | 350ms | `--ease-premium` | Panel open, hover transitions, card lift, dropdown, modal slide |
| Emphasis | 600ms | `--ease-premium` | Hero entry stagger, image scale hover, page transitions |
| Scroll-driven | Tied to scroll | Linear | Reveal animations (IntersectionObserver), timeline progress |

### Tokens
```css
--ease-premium: cubic-bezier(0.22, 0.61, 0.36, 1);
--dur-fast: 200ms;
--dur-med: 350ms;
--dur-slow: 600ms;
```

### Rules
- **Only animate `transform`, `opacity`, `filter`** — never layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`).
- **Every interactive element has hover + active + focus states** — documented per component in Section 5.
- **Scroll-triggered animations use `IntersectionObserver`** — never scroll listeners. `useReveal` hook manages this.
- **Reduced motion**: Respect `prefers-reduced-motion: reduce` — disable non-essential animation (see Section 8 for current implementation gap).
- **Motion serves meaning** — every animation maps to a real interaction, state change, or affordance. No decorative micro-animations.

### Interaction Patterns (beui.dev aligned)
- **Card lift + glow**: Property, Service, Team, Stat, Step cards — communicates "clickable" + "premium"
- **Radial mouse-tracking glow**: Service, Team, Step cards — communicates "alive surface"
- **Staggered reveal**: All grid sections — communicates "crafted, not generated"
- **Icon translate on hover**: Buttons, links — communicates "direction/forward"
- **Heart bounce**: Favorite toggle — communicates "state changed with delight"
- **Timeline progress + dots**: Process section — communicates "guided journey"

---

## 7. Depth & Surface

### Strategy: **Mixed (Tonal Shift + Glassmorphism + Subtle Borders + Accent Glows)**

| Level | Technique | Value | Usage |
|-------|-----------|-------|-------|
| Base | Tonal shift | `--bg-primary` → `--bg-secondary` → `--card-bg` | Page → Sections → Cards |
| Cards | Glassmorphism + Border | `backdrop-filter: blur(18px)` + `border: 1px solid var(--border-color)` | Property cards, Service cards, Team cards, Stat cards, Modals, Forms |
| Elevated | Glassmorphism + Shadow + Glow | `backdrop-filter: blur(22px)` + `box-shadow: 0 24px 60px rgba(0,0,0,0.45)` + `0 0 40px var(--glow-soft)` | Hero stats panel, Modals, Mobile menu |
| Interactive Hover | Border + Glow + Transform | `border-color: var(--accent)` + `box-shadow: 0 0 40px var(--glow-soft)` + `translateY(-8px) scale(1.01)` | All cards, buttons, inputs |
| Focus | Outline | `outline: 2px solid var(--accent); outline-offset: 3px` | All interactive elements |

### Rules
- **No heavy `box-shadow` at rest** — depth comes from tonal hierarchy + glassmorphism.
- **Glow is the "living" signal** — only on hover/focus/active of accent-colored elements.
- **Borders are subtle** (`rgba(255,255,255,0.06)`) — they separate, not dominate.

---

## 8. Accessibility Constraints & Accepted Debt

### Constraints (MUST HOLD)
- **WCAG Target**: 2.2 AA
- **Contrast floor**: 4.5:1 body text / 3:1 large text & UI components
- **Visible focus** on every interactive element (`:focus-visible` with 2px accent outline)
- **Full keyboard reachability** — all interactive elements focusable and operable
- **`prefers-reduced-motion` respected** — non-essential animation disabled
- **Semantic HTML** — landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`), proper heading hierarchy, `alt` on meaningful images, labels on all inputs
- **ARIA correctness** — `role`, `aria-label`, `aria-expanded`, `aria-controls`, `aria-modal`, `aria-labelledby`, `aria-describedby` where needed

### Accepted Debt

| Item | Location | Why Accepted | Owner / Exit |
|------|----------|--------------|--------------|
| **Border contrast below 3:1** (`--border-color` on `--card-bg` = 1.3:1) | All cards, inputs, buttons, modals | Brand requires ultra-subtle borders on dark surfaces; fixing requires lightening border (breaks aesthetic) or darkening card-bg (reduces depth). User sign-off on current aesthetic. | **Fix when**: Design system v2 with tonal-shift-only depth strategy (no borders). |
| **Body text below 14px minimum** (12.5px in `.stat-desc`, `.card-desc`, `.trust-desc`, `.feature-desc`) | Stats, PropertyCard, Hero feature bar | Dense info presentation for premium feel; 12.5px at 400 weight on dark bg remains readable for target audience. | **Fix when**: User requests larger base size or accessibility audit flags. |
| **Modal focus trap missing** | `PropertyModal.tsx` | Current focus restoration works for happy path; focus trap lib adds ~3KB. Deferred to keep bundle lean. | **Fix when**: Accessibility audit flags or user reports trap issue. Add `focus-trap-react` or native `<dialog>` migration. |
| **`prefers-reduced-motion` implementation incomplete** | `landing.css:133-142` | Current rule uses `0.01ms` duration which still runs animations (causes flash/layout shift). Proper fix requires `animation: none !important` + `transition-duration: 0s !important`. | **Fix in next sprint**: Update media query to properly disable animations. |
| **FontAwesome full kit loaded** (~100 KB) for ~30 icons | `index.html` + components | Migration to Lucide Preact (already in deps) requires systematic replacement across 14 components. | **Fix in Phase 1 CSS Modules migration**: Replace all `<i className="fas/far/fab fa-*">` with `<IconName />` from `lucide-preact`. |
| **Unsized media causing potential CLS** | Hero image (no explicit width/height), PropertyCard images (aspect-ratio only) | Hero uses `object-fit: cover` on fixed-height container; cards use `aspect-ratio`. Low risk but not explicit. | **Fix when**: Lighthouse CLS audit flags. Add `width`/`height` attributes or `contain-intrinsic-size`. |
| **12+ button variants not consolidated** | `landing.css` (btn-primary, btn-outline, btn-search, btn-load-more, btn-stats, btn-process, btn-team, btn-contact-secondary, btn-footer-primary, btn-footer-secondary, btn-newsletter, btn-submit, btn-publish, btn-card, btn-video, icon-btn) | Extraction in progress; consolidation blocked by DESIGN.md creation gate. | **Fix in Phase 1**: Implement 3 primitives (Primary, Secondary, Ghost) + size/icon props. |
| **CSS monolítico (5,177 líneas) sin code-splitting** | `landing.css` | Blocks Critical CSS extraction and route-level style loading. | **Fix in Phase 1**: Migrate to CSS Modules per component + shared `tokens.css`. |
| **3 instancias Supabase Client separadas** | `landing`, `landing supabase-data`, `admin` | Violates DRY, 3 WebSocket connections. Shared package `@bienenhaus/supabase` pending. | **Fix in Phase 4**: Create shared package, migrate both apps. |

---

## Validation Checklist (Post-Implementation)

After every component implementation or modification, verify:

- [ ] All colors reference tokens from Section 2. No raw hex outside `DESIGN.md`.
- [ ] All font sizes match Section 3 scale. No arbitrary sizes.
- [ ] Spacing intent maps to 4px grid (Section 4); browser mechanics (`clamp()`, intrinsic sizing) stay raw.
- [ ] Interactive elements have all required states (Section 5 + Section 6).
- [ ] Depth treatment matches Mixed strategy (Section 7).
- [ ] Component reused 2+ times? Documented in Section 5.
- [ ] Motion follows timing table (Section 6). No arbitrary durations.
- [ ] Component visual QA passed for each primitive and required state at 375px / 768px / 1280px.
- [ ] Section 8 accessibility constraints hold; any new debt recorded in Section 8.
- [ ] Survives content stress: empty, long label, unbroken string. Reflows to one readable column at 375px with no horizontal scroll of primary content.

---

## Memory Management

### When to UPDATE DESIGN.md
- New reusable component emerges (used 2+ times) → add to Section 5
- Color added for genuine new semantic role → add to Section 2
- Spacing token insufficient for real need → add to Section 4
- User explicitly changes direction ("make it warmer", "go brutalist")
- Accepted debt resolved or new debt accepted → update Section 8 table

### When NOT to Update
- One-off styling for unique section — use inline override, don't pollute system
- "I might need this later" — add it when you do
- Temporary experiment — experiments don't get tokens

### Discipline
> The design system that grows every week is dying. The one that holds its size or shrinks is getting sharper. Every addition must justify itself by removing ambiguity, not adding options.

---

*Generated from codebase extraction on 2026-08-06. This `DESIGN.md` is the implementation contract for all future landing UI work.*