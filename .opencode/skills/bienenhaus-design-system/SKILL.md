# Bienenhaus Design System Skill

**Authoritative source for all frontend design decisions in Bienenhaus Propiedades.**

This skill has **absolute priority** over any generic design skills (frontend-design, frontend-design-systems, etc.) when working on Bienenhaus. The Bienenhaus Design DNA overrides generic patterns.

---

## 🏷️ Identidad Visual

### Philosophy
- **Modern Luxury Dark UI** — Dark-first palette with teal/cyan accent, sophisticated but not generic "premium" aesthetics
- **Inmobiliaria de alto nivel** — Transmite confianza, claridad, profesionalismo
- **Sofisticación sutil** — Sin elementos típicos de IA, sin excesos decorativos
- **Claridad por encima** — Cada información tiene un propósito visual definido
- **Producto SaaS premium** — Sensación de herramienta profesional, no sitio web corporativo

### Valores Clave
- **Confianza** — Colores oscuros profundos, contraste suficiente, jerarquía clara
- **Claridad** — Jerarquía visual fuerte, sin ruido visual innecesario
- **Profesionalismo** — Tipografía balanceada, espaciado consistente, componentes predecibles
- **Calidad producto** — Sensación de aplicación web cuidadosamente construida

---

## 🎨 Design Tokens (Single Source of Truth)

### Colores (Prefijo `--bh-*`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-bg-primary` | `#050607` | Background página, hero, secciones principales |
| `--bh-bg-secondary` | `#0a0d10` | Navbar scrolleado, paneles elevados |
| `--bh-bg-card` | `#1a1e23` | Cards, modals, formularios, dropdowns |
| `--bh-bg-raised` | `#1d2229` | Cards elevadas, popovers, tooltips |
| `--bh-bg-overlay` | `rgba(4,5,6,0.72)` | Modales scrims |
| `--bh-bg-input` | `#12161b` | Inputs, selects, textareas |
| `--bh-bg-hover` | `rgba(255,255,255,0.03)` | Hover cards, filas, botones |
| `--bh-bg-active` | `rgba(255,255,255,0.06)` | Estado activo/presionado |

**Borders:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-border` | `rgba(255,255,255,0.06)` | Bordes por defecto cards/dividers |
| `--bh-border-input` | `rgba(255,255,255,0.08)` | Bordes input/select focus |
| `--bh-border-strong` | `rgba(255,255,255,0.12)` | Separaciones más fuertes |
| `--bh-border-focus` | `rgba(32,184,171,0.6)` | Rings focus, bordes accent |

**Accent (Firma de marca — Teal/Cyan):**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-accent` | `#1fc8c3` | CTAs, links, focus, badges |
| `--bh-accent-hover` | `#2dddd5` | Hover estado elements accent |
| `--bh-accent-soft` | `rgba(31,200,195,0.12)` | Fondos sutil accent |
| `--bh-accent-deep` | `#0f8577` | Gradient depth end, logo, paneles hero |
| `--bh-accent-glow` | `#56e7de` | Color glow shadows |
| `--bh-accent-glow-soft` | `rgba(31,200,195,0.15)` | Sombra glow sutil |

**Textos:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-text-primary` | `#f4f4f4` | Headlines, body, contenido primary |
| `--bh-text-secondary` | `#bfc6cc` | Descripciones, meta, info secundaria |
| `--bh-text-tertiary` | `#8a949c` | Captions, placeholders, disabled,-muted |
| `--bh-text-disabled` | `#5b646b` | Texto explícito disabled |
| `--bh-white` | `#ffffff` | Texto sobre superficies accent/sólidas |

**Status Colors:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-success` | `#4ade80` | Estados success, confirmations |
| `--bh-warning` | `#facc15` | Warnings, cautions |
| `--bh-danger` | `#f87171` | Errors, acciones destructivas |
| `--bh-info` | `#60a5fa` | Informational |
| `--bh-purple` | `#a78bfa` | Publish/featured states (icons actividad) |

### Tipografía

**Fuentes:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body, componentes |
|

| `--bh-font-display` | `'Playfair Display', 'Georgia', serif` | Headings, titulares |

| `--bh-font-mono` | `'JetBrains Mono', 'SFMono-Regular', Consolas, monospace` | Código, monospace |

**Type Scale (base 4px):**
| Token | Tamaño | Uso |
|-------|--------|-----|
| `--bh-text-xs` | 12px | Captions, metadata |
| `--bh-text-sm` | 13px | Labels, button text, nav |
| `--bh-text-md` | 14px | Body default, inputs |
| `--bh-text-lg` | 16px | Body large, lead paragraphs |
| `--bh-text-xl` | 20px | H3, card titles |
| `--bh-text-2xl` | 24px | H2, section subtitles |
| `--bh-text-3xl` | 28px | H1 small |
| `--bh-text-4xl` | 36px | H1 |
| `--bh-text-5xl` | 48px | Display small |
| `--bh-text-6xl` | 64px | Display |
| `--bh-text-7xl` | 72px | Display large (hero) |
| `--bh-text-8xl` | 96px | Stat numbers |
| `--bh-text-9xl` | 120px | Stat numbers featured |

**Line Heights:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-leading-tight` | 1.1 | Tight text |
| `--bh-leading-snug` | 1.2 | Tight/normal |
| `--bh-leading-normal` | 1.5 | Normal body |
| `--bh-leading-relaxed` | 1.6 | Relaxed paragraphs |
| `--bh-leading-loose` | 1.7 | Loose text |

**Font Weights:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-weight-normal` | 400 | Texto normal |
| `--bh-weight-medium` | 500 | Medium text |
| `--bh-weight-semibold` | 600 | Semibold |
| `--bh-weight-bold` | 700 | Bold |
| `--bh-weight-extrabold` | 800 | Extrabold |

### Spacing (4px base unit)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-space-1` | 4px | Icon-to-label, tight gaps |
| `--bh-space-2` | 8px | Compact gaps, pill spacing |
| `--bh-space-3` | 12px | Form field padding, card features |
| `--bh-space-4` | 16px | Standard padding, input height |
| `--bh-space-5` | 20px | Comfortable section spacing |
| `--bh-space-6` | 24px | Generous card padding |
| `--bh-space-7` | 28px | Hero stats panel padding |
| `--bh-space-8` | 32px | Separated groups, grid gaps |
| `--bh-space-9` | 36px | Hero actions gap |
| `--bh-space-10` | 40px | Section inner, container pad (tablet) |
| `--bh-space-12` | 48px | Major section breaks |
| `--bh-space-16` | 64px | Page vertical rhythm |
| `--bh-space-20` | 80px | Hero, major section padding |
| `--bh-space-24` | 96px | Maximum separation |

### Layout Tokens (Admin Spec)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-sidebar-w` | 280px | Anchura sidebar normal |
| `--bh-sidebar-w-collapsed` | 88px | Anchura sidebar colapsado |
| `--bh-topbar-h` | 72px | Altura topbar |
| `--bh-breadcrumb-h` | 56px | Altura breadcrumb |
| `--bh-sidebar-logo-h` | 64px | Altura logo sidebar (spec §32) |
| `--bh-main-pad` | 32px | Padding main content (spec §24/§49) |
| `--bh-main-gap` | 32px | Gap vertical main content (spec §49) |

### Radii

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-radius-sm` | 6px | Elementos pequeños: badges, pills |
| `--bh-radius-md` | 10px | Botones, inputs, dropdowns |
| `--bh-radius-lg` | 14px | Cards (mobile), inputs mayores |
| `--bh-radius-xl` | 20px | Cards (desktop), modals |
| `--bh-radius-2xl` | 24px | Large cards, panels |
| `--bh-radius-3xl` | 28px | Featured cards, hero panels |
| `--bh-radius-4xl` | 30px | Stat cards, panel stats |
| `--bh-radius-full` | 999px | Pills, avatars, icon buttons |

### Shadows & Glows

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Sombra pequeña |
| `--bh-shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` | Sombra media |
| `--bh-shadow-lg` | `0 12px 32px rgba(0,0,0,0.45)` | Sombra grande |
| `--bh-shadow-xl` | `0 24px 60px rgba(0,0,0,0.45)` | Sombra x-large |
| `--bh-shadow-glow` | `0 0 24px var(--bh-accent-glow-soft)` | Glow sutil |
| `--bh-shadow-glow-lg` | `0 0 40px var(--bh-accent-glow-soft), 0 20px 60px rgba(0,0,0,0.3)` | Glow grande |

### Motion

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-ease-premium` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Easing firma |
| `--bh-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Énfasis exits |
| `--bh-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Estándar |
| `--bh-ease` | `var(--bh-ease-premium)` | Easing por defecto admin |

**Durations:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-dur-fast` | 140ms | Micro: botón press, toggle |
| `--bh-dur-med` | 240ms | Standard: hover, panel, dropdown |
| `--bh-dur-slow` | 400ms | Énfasis: modal, hero entry |
| `--bh-dur-xslow` | 600ms | Hero image scale, sequences complejas |
| `--bh-dur-sidebar` | 200ms | Expand/collapse sidebar (spec §56) |
| `--bh-dur-dropdown` | 150ms | Dropdown/popover (spec §56) |
| `--bh-dur-drawer` | 250ms | Mobile drawer slide-in (spec §56) |
| `--bh-dur-modal` | 200ms | Modal open/close (spec §56) |
| `--bh-dur-hover` | 150ms | Hover states (spec §56) |

### Z-Index

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-z-dropdown` | 50 | Dropdowns |
| `--bh-z-sticky` | 100 | Sticky elements |
| `--bh-z-navbar` | 999 | Navbar |
| `--bh-z-mobile-menu` | 998 | Mobile menu |
| `--bh-z-modal-overlay` | 10000 | Modal overlay |
| `--bh-z-modal` | 10001 | Modal container |
| `--bh-z-toast` | 11000 | Toast notifications |
| `--bh-z-tooltip` | 12000 | Toolips |
| `--bh-z-command` | 13000 | Command palette |
| `--bh-z-drawer` | 9999 | Mobile sidebar drawer (spec §54: below Modal 10001) |
| `--bh-z-scrim` | 9998 | Sidebar scrim (spec §54: below Drawer 9999) |

**Admin aliases:**
| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-z-sidebar` | 40 | Sidebar z-index |
| `--bh-z-topbar` | 50 | Topbar z-index |

### Breakpoints (para referencia — usar en media queries, NO como tokens puros)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bh-bp-sm` | 640px | Small |
| `--bh-bp-md` | 768px | Tablet |
| `--bh-bp-lg` | 1024px | Desktop |
| `--bh-bp-xl` | 1280px | Wide desktop |
| `--bh-bp-2xl` | 1536px | 2xl |

---

## 📦 Componentes

### Buttons

| Variante | Descripción | Tokens |
|----------|-------------|--------|
| `primary` | Primary action | `--bh-accent`, `--bh-white` |
| `secondary` | Secondary action | `--bh-accent-soft`, `--bh-accent` |
| `ghost` | Bare minimum | `transparent`, `--bh-text-secondary` |
| `danger` | Destructive action | `--bh-danger-bg`, `--bh-danger` |

**Tallas:**
| Talla | Tamaño | Padding |
|-------|--------|---------|
| `sm` | Pequeño | `5px 10px`, font 12.5px |
| `md` | Medium (default) | `8px 14px`, font 13.5px |
| `lg` | Grande | `padding mayores` |

**Estados:**
| Estado | Descripción | Tokens |
|--------|-------------|--------|
| `default` | Estado normal | Tokens por variante |
| `hover` | Hover | `--bh-accent-hover` para primary, `--bh-bg-hover` para ghost |
| `focus` | Focus visible | `outline: 2px solid var(--bh-accent)`, `outline-offset: 3px` |
| `active` | Presionado | `--bh-bg-active`, transform `translateY(1px)` |
| `disabled` | Deshabilitado | `opacity: 0.55`, `cursor: not-allowed`, `aria-busy` |
| `loading` | Cargando | `aria-busy`, spinner interno, `disabled` visual |

### Inputs / Selects / Textareas

| Campo | Descripción |
|-------|-------------|
| `default` | Fondo `--bh-bg-input`, borde `--bh-border-input`, texto `--bh-text-primary` |
| `focus` | Borde `--bh-border-focus`, shadow `--bh-ring-focus` |
| `disabled` | `--bh-text-disabled`, `cursor: not-allowed` |
| `error` | Border rojo suave, feedback visual |

### Cards

| Tipo | Descripción |
|------|-------------|
| `default` | `--bh-bg-card`, `--bh-border`, shadow `--bh-shadow-sm` |
| `hover` | `--bh-border-strong` en hover, `--bh-shadow-md` |
| `elevated` | `--bh-bg-raised`, shadow `--bh-shadow-md` |

### Tables

| Característica | Descripción |
|----------------|-------------|
| `sticky header` | `.table th` position sticky top: 0, z-index 1 |
| `row hover` | `--bh-bg-hover` en `tr:hover` |
| `row selected` | `background: rgba(31,200,195,0.04)`, shadow inset |
| `select column` | Width 18px, `accent-color: var(--bh-accent)` |
| `cell property` | Flex display gap 11px, img 46x34, min-width 240px |

### Badges

| Variante | Descripción | Tokens |
|----------|-------------|--------|
| `--bh-success` | Éxito | `--bh-success`, `--bh-success-soft` |
| `--bh-warning` | Advertencia | `--bh-warning`, `--bh-warning-soft` |
| `--bh-info` | Informacional | `--bh-info`, `--bh-info-soft` |
| `--bh-neutral` | Neutral | `--bh-bg-hover`, `--bh-text-tertiary` |
| `--bh-danger` | Peligro | `--bh-danger`, `--bh-danger-soft` |

### Modales

| Componente | Descripción |
|------------|-------------|
| `backdrop` | Fixed inset, `--bh-bg-overlay`, backdrop-filter blur, transición opacity |
| `card` | Max-width 480px, `--bh-bg-card`, border `--bh-border-strong`, shadow `--bh-shadow-xl`, transition transform+opacity |
| `size variants` | `modal--large` (960px), `.modal--medium` (720px) |
| `header` | Flex al items-between, padding `--bh-space-4 --bh-space-5`, border-bottom |
| `body` | Flex column, gap `--bh-space-4`, padding `--bh-space-5` |
| `actions` | Flex justify-end gap `--bh-space-3`, border-top |
| `close button` | 30x30, `--bh-text-tertiary`, hover `--bh-bg-hover` |

### Empty States

| Componente | Descripción |
|------------|-------------|
| `container` | Flex flex-col align-items-center justify-center, gap `--bh-space-3` |
| `icono` | SVG 48x48, color `--bh-text-tertiary`, opacity 0.5 |
| `título` | Font size `--bh-text-primary`, font weight 700 |
| `descripción` | Color `--bh-text-tertiary`, font size `--bh-text-sm` |

### Loading States

| Componente | Descripción |
|------------|-------------|
| `skeleton` | Estado óseo con animación bh-spin, dimensiones consistentes |
| `placeholder` | States "no data" con ilustración y botón CTA |

### Tooltips

| Componente | Descripción |
|------------|-------------|
| `default` | Posicionado automáticamente, fondo `--bh-bg-card`, border `--bh-border` |
| `dark` | Legible sobre fondos oscuros |
| `reduced motion` | Animaciones desactivadas via `prefers-reduced-motion` |

### Navigation

| Componente | Descripción |
|------------|-------------|
| `sidebar` | Fixed 280px, flex col, transition width 200ms ease premium |
| `collapsed` | 88px, justify-content center, padding 9px 0 |
| `topbar` | Sticky 72px, flex between gap 16px, backdrop blur 8px |
| `breadcrumb` | 56px height, navegación secondary |
| `skip link` | Position absolute left -9999, visible:focus |

---

## 📐 Layout

### Admin Panel Layout

| Área | Descripción | Tokens |
|------|-------------|--------|
| `sidebar` | Fixed inset 0 auto 0, flex col, width `--bh-sidebar-w` (280px), z-index `--bh-z-sidebar` (40), border-right 1px `--bh-border`, transition width 200ms var(--bh-ease) | |
| `sidebar collapsed` | Width `--bh-sidebar-w-collapsed` (88px), `.sidebar-link` justify-content center padding 9px 0 | |
| `topbar` | Sticky top: 0, z-index `--bh-z-topbar` (50), flex between gap 16px, padding 0 24px, height `--bh-topbar-h` (72px), bg `rgba(8,9,11,0.86)`, backdrop-filter blur 8px, border-bottom 1px `--bh-border` | |
| `main content` | Flex flex-col min-height 100vh, margin-left sidebar width, transition margin | |
| `content area` | Padding `--bh-space-6` (24px) lateral, `--bh-space-4` (32px) bottom, max-width 1240px | |
| `container` | Max-width 1440px, padding `--bh-space-10` (40px) tablet, `--bh-space-7` (24px) mobile | |

### Landing Layout (hereda tokens pero con alias legacy)

| Área | Descripción |
|------|-------------|
| `hero` | Background image local, CTA primary, scroll suave |
| `catalogo` | Filtros, paginación "Cargar más", modal detalle |
| `cards` | Grid responsive, spacing `--bh-space-8` |

### Responsive Breakpoints (Evaluación Mínima)

| Breakpoint | Ancho | Cuando evaluar |
|------------|-------|----------------|
| `mobile` | 375px | Cada cambio visual/UX |
| `tablet` | 768px | Cada cambio visual/UX |
| `desktop` | 1024px | Cada cambio visual/UX |
| `wide desktop` | 1280px+ | Layouts complejos, dashboards |

---

## 🌳 Estados Completos (Rule)

**TODO componente interactivo debe contemplar estos 6 estados:**

| Estado | Requisito | Verificación |
|--------|-----------|--------------|
| `default` | Estado base sin interacción | Tokens por defecto |
| `hover` | Mouse sobre elemento | `--bh-accent-hover` en buttons, `--bh-bg-hover` en cards |
| `focus` | Teclado focus-visible | `outline: 2px solid var(--bh-accent)`, `outline-offset: 3px` |
| `active` | Mouse presionado / Enter teclado | Transform translateY(1px), `--bh-bg-active` |
| `disabled` | Estado no interactivo | `opacity: 0.55`, `cursor: not-allowed`, `aria-busy` |
| `error` | Estado de error | Border rojo `--bh-danger-border`, mensaje accesible |

### Accesibilidad (Nunca negociable)

| Regla | Requisito | Nivel |
|-------|-----------|-------|
| `keyboard navigation` | Tab order funcional, Enter/Space activan | WCAG AA |
| `focus visible` | Siempre visible cuando navega teclado | `2px solid var(--bh-accent)`, `outline-offset: 3px` |
| `semantic HTML` | `<button>` para acciones, `<nav>` para navegación, etc. | — |
| `ARIA` | Cuándo corresponda, nunca decorative | `aria-label`, `aria-expanded`, `aria-hidden` |
| `contraste` | ≥ 4.5:1 texto, ≥ 3:1 UI components | WCAG AA |
| `reduced motion` | `prefers-reduced-motion: reduce` → `--bh-dur-*` a `0s`, `animation-duration: 0.01ms` | — |
| `labels` | Todos los inputs tienen label asociado | — |

---

## 📱 Responsive

**Prohibido implementar únicamente desktop.**

**Cada cambio debe evaluarse como mínimo en 4 breakpoints:**

| Breakpoint | Ancho | Testear |
|------------|-------|---------|
| `mobile` | 375px | iPhone tamaño estándar |
| `tablet` | 768px | iPad/tablet tamaño estándar |
| `desktop` | 1024px | Desktop estándar |
| `wide desktop` | 1280px+ | Monitores grandes, dashboards |

**Patrones responsive obligatorios:**

1. **Sidebar**: 280px → colapsado 88px → expandido en mobile (full width)
2. **Topbar**: Siempre visible, ajustes menores en mobile
3. **Grid cards**: De N columnas a 1 columna móvil
4. **Modales**: `modal--large` en desktop, `.modal--medium` en tablet, full-width en mobile
5. **Tablas**: Headers sticky, scroll horizontal en mobile, `--bh-bp-md` ajustes de padding

---

## 🎭 Animaciones

**Características:**

| Atributo | Valor |
|----------|-------|
| `sutiles` | No roban atención del contenido |
| `rápidas` | 140ms--240ms para micro-interacciones |
| `funcionales` | Sirven para feedback visual (no decorativo) |
| `coherentes` | Mismo easing `--bh-ease-premium` en todo el proyecto |
| `no invasivas` | No afectan rendimiento ni accesibilidad |

**Easing obligatorio:**

| Uso | Easing |
|-----|--------|
| Default admin | `--bh-ease-premium: cubic-bezier(0.22, 0.61, 0.36, 1)` |
| Emphasis exits | `--bh-ease-out: cubic-bezier(0.16, 1, 0.3, 1)` |
| Standard | `--bh-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)` |

**Respecto reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
    :root {
        --bh-dur-fast: 0s;
        --bh-dur-med: 0s;
        --bh-dur-slow: 0s;
        --bh-dur-xslow: 0s;
        --dur-fast: 0s;
        --dur-med: 0s;
        --dur-slow: 0s;
    }
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
    }
}
```

---

## ♿ Accesibilidad (WCAG AA+ — NOT OPTIONAL)

### Contraste Obligatorio

| Elemento | Razón | Razón |
|----------|-------|-------|
| `texto` | ≥ 4.5:1 | WCAG AA normal |
| `texto grande` (≥ 18pt or ≥ 14pt bold) | ≥ 3:1 | WCAG AA |
| ` UI elements (botons, borders, badges) | ≥ 3:1 | UI components |

**Contrastes validados en tokens:**
- `--bh-text-primary` (#f4f4f4) sobre `--bh-bg-primary` (#050607): ratio ∞:1 ✅
- `--bh-text-secondary` sobre `--bh-bg-secondary` ≥ 4.5:1 ✓
- `--bh-text-tertiary` sobre `--bh-bg-card`: ratio ✅
- Focus ring `--bh-border-focus` contra fondos ✅

### Focus Visible

- `outline: 2px solid var(--bh-accent); outline-offset: 3px` — global `:focus-visible`
- Radio buttons, inputs, buttons, links interactivos
- Nunca `outline: none` sin alternativa accesible

### ARIA y Semantic

- ARIA labels solo cuando el contenido visible no es suficiente
- `aria-busy="true"` en estados loading
- `aria-busy="false"` al completar
- `aria-describedby` para error messages
- Lables asociados a inputs via `htmlFor` / `id`

## Reduced Motion

**Siempre respetar `prefers-reduced-motion: reduce`:**

- `--bh-dur-fast: 0s`, `--bh-dur-med: 0s`, `--bh-dur-slow: 0s` en `:root`
- `animation-duration: 0.01ms !important` en todos los elementos
- `animation-iteration-count: 1 !important`
- `transition-duration: 0s !important`
- `scroll-behavior: auto !important`

## Estados de Componentes

**Todo componente interactivo debe contemplar estos estados:**

| Estado | Descripción |
|-------------|------------|
| **default** | Estado por defecto, reposo |
| **hover** | Mouse sobre elemento, cambio sutil de color/fondo |
| **focus** | Cuando elemento tiene focus via teclado |
| **active** | Estadopressed/activated momentary |
| **disabled** | Estado deshabilitado, opacity reduced, cursor not-allowed |
| **loading** | Estado carga: spinner, aria-busy, disabled visual |
| **success** | Estados verdes, checkmarks, confirmaciones |
| **error** | Estados error, border danger, mensajes accesibles |
| **empty** | States cuando no hay datos, con illustration/ilustración |
| **loading** | States spinners, skeleton loaders |

### Estados por Componente

| Componente | Default | Hover | Focus | Active | Disabled | Loading | Success | Error |
|-----------|------|-------|-------|------|--------|------|---------|

### Responsive

**PROHIBIDO implementar solamente desktop.**

Cada cambio debe evaluarse como mínimo en:

- **mobile** (375px — teléfono típico)
- **tablet** (768px)
- **desktop** (1440px o width común)
- **wide desktop** (1440px+)

### Motion

Animaciones:

- Sutiles
- Rápidas
- Funcionales
- Coherentes (mismo easing/duration across componentes)
- No invasivas

Siempre respetar `prefers-reduced-motion`.

### Responsive Design — Prohibido Implementar Solamente Desktop

Cada cambio debe evaluarse como mínimo en:

| Dispositivo | Prioridad |
|-------------|--------|
| **mobile** | 375px (iPhone SE/8/8 Plus equiv) — primera prioridad |
| tablet | 768px | Tablet — iPad Air/Pro standard |
| desktop | 1440px | Width común desktop |
| wide desktop | 1440px+ |

### Jerarquía de Skills (Definida Explicitamente)

**Regla explícita:**

> **Nivel 1 — Bienenhaus**: `bienenhaus-design-system`
> Tiene autoridad sobre:
> * colores
> * tokens
> * componentes
 * layout
 * branding
 * arquitectura visual
 * propios patrones

### Nivel 2 — Arquitectura de diseño
`frontend-design-systems`

### Nivel 3 — Diseño de interfaces

`designing-frontend-interfaces`

### Nivel 4 — Diseño visual

`frontend-design`

### Nivel 5 — Accesibilidad

`building-accessible-interfaces`

### Nivel 6 — Auditoría

`reviewing-interface-quality`

### Nivel 7 — Biblioteca de componentes

`shadcn` (SOLO si compatibilidad técnica clara)

**Regla:** Las skills genéricas jamás deben sobrescribir las reglas específicas de Bienenhaus.

## REGLAS ANTI-DESTRUCCIÓN (en la skill propia)

**NO:**

* cambiar arquitectura sin motivo;
* reemplazar librerías existentes sin análisis;
* convertir todo a otra UI library;
* introducir Tailwind si no corresponde;
* introducir shadcn si no corresponde;
* eliminar componentes porque parezcan redundantes sin comprobar dependencias;
* modificar APIs para resolver problemas visuales;
* modificar backend por una tarea puramente visual;
* cambiar rutas;
- cambiar contratos API;
- eliminar tests;
- eliminar funcionalidad para "simplificar";
- modificar autenticación;
- modificar RLS;
- modificar Supabase por motivos visuales.

**Antes de modificación estructural:**

1. inspeccionar dependencias;
2. comprobar uso;
3. evaluar impacto;
4. modificar;
5. ejecutar tests;
6. revisar regresiones.

---

# FASE 2 — RESULTADOS DE AUDITORÍA

## A. Qué skills existen actualmente

| Skill | Ubicación | Propósito | Estado |
|---|---|---|
| `frontend.md` | `.opencode/agents/frontend.md` | Agente frontend Bienenhaus — Preact/TS/design tokens/a11y |
| `architect` | `.opencode/agents/architect.md` | Arquitectura decisiones, dependencias, análisis |
| `bienenhaus-design-system` | **NO INSTALADA** — skill propia del proyecto |
| `frontend-design`: opencode template genérico | No instalada |
| `frontend-design-systems`: no existe archivo dedicado |
| `designing-frontend-interfaces`: no existe | |
| `building-accessible-interfaces`: no verificado aún |
| `reviewing-interface-quality`: existe `.opencode\agents\reviewing-interface-quality` — NO encontrada aún |
| `shadcn`: NO está instalada ni configurada |

## Skills Externas Necesarias

| Skill | Por qué necesaria |
|-----|------------|
| `frontend-design` | Para definición de principios visuales genéricos que luego se mapeen a tokens Bienenhaus |
| `frontend-design-systems` | No necesaria como externa — el design system `bienenhaus-ui` ya existe y es el authority |
| `designing-frontend-interfaces` | **Sí** — para definir metodología *before* implementar en futuras tareas |
| `building-accessible-interfaces` | **Sí** - asegurar consistencia a11y en futuras tareas |
| `reviewing-interface-quality` | **No** — ya se hace mediante AGENTS.md + CodeGraph + Playwright |
| `shadcn` | **NO** — stack incompatible (Preact + CSS Modules + diseño propio) |

---

## FASE 5 — CREAR SKILL PROPIA DE BIENENHAUS

Vamos a crear la skill `.opencode/skills/bienenhaus-design-system/SKILL.md` que es el núcleo del sistema.

**Vamos a crear la estructura de directorios y el archivo:**
<tool_call>
<function=bash>
<parameter=command>
mkdir -p .opencode/skills/bienenhaus-design-system