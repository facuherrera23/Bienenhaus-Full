# Bienenhaus Design System — Authoritative Skill

> **Authoritative source for all frontend design decisions in Bienenhaus Propiedades.**
>
> **Priority: ABSOLUTE.** This skill overrides every generic design skill when working on Bienenhaus.
> The Bienenhaus Design DNA is the single source of truth. Generic skills inform methodology;
> this skill defines the actual values.

---

## 🏷️ Identidad Visual

### Filosofía

- **Modern Luxury Dark UI** — Dark-first palette with teal/cyan accent. Sophisticated, not generic "premium".
- **Inmobiliaria de alto nivel** — Transmite confianza, claridad, profesionalismo inmobiliario.
- **Sofisticación sutil** — Sin estética típica de IA. Sin excesos decorativos. Sin gradients arcoíris.
- **Claridad sobre decoración** — Cada elemento visual tiene un propósito comunicacional.
- **Producto SaaS premium** — Sensación de herramienta profesional cuidadosamente construida, no sitio corporativo.

### Valores de Marca

| Valor | Traducción visual |
|---|---|
| Confianza | Colores oscuros profundos, contraste suficiente, jerarquía clara |
| Claridad | Jerarquía visual fuerte, sin ruido visual, un propósito por elemento |
| Profesionalismo | Tipografía balanceada, espaciado consistente, componentes predecibles |
| Calidad producto | Sensación de aplicación cuidada, micro-interacciones pulidas |

### Anti-patrones (PROHIBIDO en Bienenhaus)

- ❌ Estética "AI-generated" (gradients morados/rosados, blobs, glassmorphism excesivo)
- ❌ Tailwind / shadcn / Material UI / styled-components (stack incompatible)
- ❌ Colores hardcoded fuera de tokens (`--bh-*`)
- ❌ Iconos decorativos sin propósito comunicacional
- ❌ Animaciones decorativas sin feedback funcional
- ❌ Sombras `0 0 50px` sin justificación jerárquica
- ❌ Borders visibles en superficies que no necesitan separación

---

## 🎨 Design Tokens (Single Source of Truth)

> **Regla absoluta:** Si existe un token para algo, úsalo. No hardcoded colors, sizes, or easings.
> Si necesitás un valor nuevo, propuesta un token nuevo en el PR — no un hardcoded value.

### Colores — Fondo (Dark-first)

| Token | Valor | Uso |
|---|---|---|
| `--bh-bg-primary` | `#050607` | Background página, hero, secciones principales |
| `--bh-bg-secondary` | `#0a0d10` | Navbar scrolleado, paneles elevados |
| `--bh-bg-card` | `#1a1e23` | Cards, modals, formularios, dropdowns |
| `--bh-bg-raised` | `#1d2229` | Cards elevadas, popovers, tooltips |
| `--bh-bg-overlay` | `rgba(4,5,6,0.72)` | Modales scrims (backdrop blur) |
| `--bh-bg-input` | `#12161b` | Inputs, selects, textareas |
| `--bh-bg-hover` | `rgba(255,255,255,0.03)` | Hover cards/filas/botones |
| `--bh-bg-active` | `rgba(255,255,255,0.06)` | Estado activo/presionado |

### Borders

| Token | Valor | Uso |
|---|---|---|
| `--bh-border` | `rgba(255,255,255,0.06)` | Borders por defecto cards/dividers |
| `--bh-border-input` | `rgba(255,255,255,0.08)` | Borders inputs/select textarea |
| `--bh-border-strong` | `rgba(255,255,255,0.12)` | Separaciones más fuertes |
| `--bh-border-focus` | `rgba(32,184,171,0.6)` | Rings focus, bordes accent |

### Accent (Firma de marca — Teal/Cyan)

> `--bh-accent` (#1fc8c3) es la firma de marca. Úsalo con criterio. Si todo es accent, nada es accent.

| Token | Valor | Uso |
|---|---|---|
| `--bh-accent` | `#1fc8c3` | CTAs primarios, links, focus, badges importantes |
| `--bh-accent-hover` | `#2dddd5` | Hover estado elementos accent |
| `--bh-accent-soft` | `rgba(31,200,195,0.12)` | Fondos sutil accent (tablas, badges) |
| `--bh-accent-deep` | `#0f8577` | Gradient depth end, logo, paneles hero |
| `--bh-accent-glow` | `#56e7de` | Color glow shadows (use sparingly) |
| `--bh-accent-glow-soft` | `rgba(31,200,195,0.15)` | Sombra glow sutil |

### Textos

| Token | Valor | Uso |
|---|---|---|
| `--bh-text-primary` | `#f4f4f4` | Headlines, body, contenido primary |
| `--bh-text-secondary` | `#bfc6cc` | Descripciones, meta, info secundaria |
| `--bh-text-tertiary` | `#8a949c` | Captions, placeholders, disabled-muted |
| `--bh-text-disabled` | `#5b646b` | Texto explícito disabled |
| `--bh-white` | `#ffffff` | Texto sobre superficies accent/sólidas |

### Status Colors

| Token | Valor | Uso |
|---|---|---|
| `--bh-success` | `#4ade80` | Estados success, confirmations |
| `--bh-warning` | `#facc15` | Warnings, cautions |
| `--bh-danger` | `#f87171` | Errors, acciones destructivas |
| `--bh-info` | `#60a5fa` | Informational |
| `--bh-purple` | `#a78bfa` | Publish/featured states (icons actividad) |

### Tipografía

**Fuentes:**

| Token | Familia | Uso |
|---|---|---|
| `--bh-font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body, componentes |
| `--bh-font-display` | `'Playfair Display', 'Georgia', serif` | Headings, titulares, hero |
| `--bh-font-mono` | `'JetBrains Mono', 'SFMono-Regular', Consolas, monospace` | Código, monospace |

**Type Scale (base 4px):**

| Token | Tamaño | Uso |
|---|---|---|
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
| `--bh-text-9xl` | 120px | Stat featured numbers |

**Line Heights:**

| Token | Valor | Uso |
|---|---|---|
| `--bh-leading-tight` | 1.1 | Headlines display |
| `--bh-leading-snug` | 1.2 | Headings normales |
| `--bh-leading-normal` | 1.5 | Body default |
| `--bh-leading-relaxed` | 1.6 | Párrafos largos |
| `--bh-leading-loose` | 1.7 | Texto muy relajado |

**Font Weights:**

| Token | Valor | Uso |
|---|---|---|
| `--bh-weight-normal` | 400 | Texto normal |
| `--bh-weight-medium` | 500 | Medium text |
| `--bh-weight-semibold` | 600 | Semibold |
| `--bh-weight-bold` | 700 | Bold (headings) |
| `--bh-weight-extrabold` | 800 | Stat numbers, display heavy |

### Spacing (4px base unit)

| Token | Valor | Uso |
|---|---|---|
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

### Layout Tokens (Admin)

| Token | Valor | Uso |
|---|---|---|
| `--bh-sidebar-w` | 280px | Sidebar normal |
| `--bh-sidebar-w-collapsed` | 88px | Sidebar colapsado |
| `--bh-topbar-h` | 72px | Topbar height |
| `--bh-breadcrumb-h` | 56px | Breadcrumb height |
| `--bh-sidebar-logo-h` | 64px | Logo sidebar height |
| `--bh-main-pad` | 32px | Padding main content |
| `--bh-main-gap` | 32px | Gap vertical main content |

### Radii

| Token | Valor | Uso |
|---|---|---|
| `--bh-radius-sm` | 6px | Badges, pills pequeños |
| `--bh-radius-md` | 10px | Botones, inputs, dropdowns |
| `--bh-radius-lg` | 14px | Cards mobile, inputs mayores |
| `--bh-radius-xl` | 20px | Cards desktop, modals |
| `--bh-radius-2xl` | 24px | Large cards, panels |
| `--bh-radius-3xl` | 28px | Featured cards, hero panels |
| `--bh-radius-4xl` | 30px | Stat cards, panel stats |
| `--bh-radius-full` | 999px | Pills, avatars, icon buttons |

### Shadows & Glows

| Token | Valor | Uso |
|---|---|---|
| `--bh-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Sombra pequeña |
| `--bh-shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` | Sombra media |
| `--bh-shadow-lg` | `0 12px 32px rgba(0,0,0,0.45)` | Sombra grande |
| `--bh-shadow-xl` | `0 24px 60px rgba(0,0,0,0.45)` | Sombra x-large |
| `--bh-shadow-glow` | `0 0 24px var(--bh-accent-glow-soft)` | Glow accent sutil |
| `--bh-shadow-glow-lg` | `0 0 40px var(--bh-accent-glow-soft), 0 20px 60px rgba(0,0,0,0.3)` | Glow grande |

### Motion

**Easing (firma de marca):**

| Token | Valor | Uso |
|---|---|---|
| `--bh-ease-premium` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Easing firma — default admin |
| `--bh-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Énfasis exits |
| `--bh-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard |
| `--bh-ease` | `var(--bh-ease-premium)` | Alias default |

**Durations:**

| Token | Valor | Uso |
|---|---|---|
| `--bh-dur-fast` | 140ms | Micro: button press, toggle |
| `--bh-dur-med` | 240ms | Standard: hover, panel, dropdown |
| `--bh-dur-slow` | 400ms | Énfasis: modal, hero entry |
| `--bh-dur-xslow` | 600ms | Hero image scale, sequences complejas |
| `--bh-dur-sidebar` | 200ms | Expand/collapse sidebar |
| `--bh-dur-dropdown` | 150ms | Dropdown/popover |
| `--bh-dur-drawer` | 250ms | Mobile drawer slide-in |
| `--bh-dur-modal` | 200ms | Modal open/close |
| `--bh-dur-hover` | 150ms | Hover states |

### Z-Index

| Token | Valor | Uso |
|---|---|---|
| `--bh-z-dropdown` | 50 | Dropdowns |
| `--bh-z-sticky` | 100 | Sticky elements |
| `--bh-z-sidebar` | 40 | Sidebar (admin) |
| `--bh-z-topbar` | 50 | Topbar (admin) |
| `--bh-z-navbar` | 999 | Navbar (landing) |
| `--bh-z-mobile-menu` | 998 | Mobile menu |
| `--bh-z-scrim` | 9998 | Sidebar scrim (mobile) |
| `--bh-z-drawer` | 9999 | Mobile sidebar drawer |
| `--bh-z-modal-overlay` | 10000 | Modal overlay |
| `--bh-z-modal` | 10001 | Modal container |
| `--bh-z-toast` | 11000 | Toast notifications |
| `--bh-z-tooltip` | 12000 | Tooltips |
| `--bh-z-command` | 13000 | Command palette |

### Breakpoints (mobile-first)

| Token | Valor | Uso |
|---|---|---|
| `--bh-bp-sm` | 640px | Small phones large |
| `--bh-bp-md` | 768px | Tablet |
| `--bh-bp-lg` | 1024px | Desktop |
| `--bh-bp-xl` | 1280px | Wide desktop |
| `--bh-bp-2xl` | 1536px | 2xl |

---

## 📦 Componentes Canónicos

### Buttons (`@bienenhaus/ui` Button atom)

**Variantes:**

| Variante | Descripción | Background | Texto |
|---|---|---|---|
| `primary` | Primary action | `--bh-accent` | `--bh-white` |
| `secondary` | Secondary action | `--bh-accent-soft` | `--bh-accent` |
| `ghost` | Minimal action | `transparent` | `--bh-text-secondary` |
| `danger` | Destructive action | `--bh-danger` (bg suave) | `--bh-danger` |

**Tallas:**

| Talla | Padding | Font |
|---|---|---|
| `sm` | `5px 10px` | 12.5px |
| `md` (default) | `8px 14px` | 13.5px |
| `lg` | Padding mayores | Mayor |

**Estados (todos obligatorios):**

| Estado | Regla |
|---|---|
| `default` | Tokens por variante |
| `hover` | `--bh-accent-hover` para primary, `--bh-bg-hover` para ghost |
| `focus` | `outline: 2px solid var(--bh-accent); outline-offset: 3px` |
| `active` | `--bh-bg-active`, `transform: translateY(1px)` |
| `disabled` | `opacity: 0.55`, `cursor: not-allowed` |
| `loading` | `aria-busy="true"`, spinner interno, disabled visual |

### Inputs / Selects / Textareas

| Estado | Tokens |
|---|---|
| `default` | bg `--bh-bg-input`, border `--bh-border-input`, text `--bh-text-primary` |
| `focus` | border `--bh-border-focus`, shadow ring focus |
| `disabled` | text `--bh-text-disabled`, `cursor: not-allowed` |
| `error` | border red suave (`--bh-danger`), feedback message accesible |

### Cards

| Tipo | Fondo | Border | Shadow |
|---|---|---|---|
| `default` | `--bh-bg-card` | `--bh-border` | `--bh-shadow-sm` |
| `hover` | (mismo) | `--bh-border-strong` | `--bh-shadow-md` |
| `elevated` | `--bh-bg-raised` | `--bh-border` | `--bh-shadow-md` |

### Tables

| Característica | Regla |
|---|---|
| Sticky header | `.table th` position sticky top:0, z-index 1 |
| Row hover | `--bh-bg-hover` en `tr:hover` |
| Row selected | `background: rgba(31,200,195,0.04)`, inset shadow |
| Select column | width 18px, `accent-color: var(--bh-accent)` |
| Cell property | flex gap 11px, img 46x34, min-width 240px |

### Badges

| Variante | Color | Background soft |
|---|---|---|
| `success` | `--bh-success` | `rgba(74,222,128,0.12)` |
| `warning` | `--bh-warning` | `rgba(250,204,21,0.12)` |
| `info` | `--bh-info` | `rgba(96,165,250,0.12)` |
| `neutral` | `--bh-text-tertiary` | `--bh-bg-hover` |
| `danger` | `--bh-danger` | `rgba(248,113,113,0.12)` |

### Modales

| Elemento | Spec |
|---|---|
| Backdrop | fixed inset, `--bh-bg-overlay`, backdrop-filter blur |
| Card | max-width 480px (default), `--bh-bg-card`, border `--bh-border-strong`, shadow `--bh-shadow-xl` |
| Size variants | `modal--large` (960px), `modal--medium` (720px) |
| Header | flex between, padding `--bh-space-4 --bh-space-5`, border-bottom |
| Body | flex column, gap `--bh-space-4`, padding `--bh-space-5` |
| Actions | flex justify-end, gap `--bh-space-3`, border-top |
| Close button | 30x30, `--bh-text-tertiary`, hover `--bh-bg-hover` |

### Empty States

| Elemento | Spec |
|---|---|
| Container | flex col, center, gap `--bh-space-3` |
| Icono | SVG 48x48, `--bh-text-tertiary`, opacity 0.5 |
| Título | `--bh-text-primary`, weight 700 |
| Descripción | `--bh-text-tertiary`, `--bh-text-sm` |

### Navigation (Admin)

| Componente | Spec |
|---|---|
| Sidebar | Fixed 280px, flex col, transition width `--bh-dur-sidebar` `--bh-ease` |
| Sidebar collapsed | 88px, links justify-center, padding 9px 0 |
| Topbar | Sticky 72px, flex between, backdrop-blur 8px |
| Breadcrumb | 56px height, navegación secondary |
| Skip link | position absolute -9999, visible en `:focus` |

---

## 📐 Layout

### Admin

| Área | Spec |
|---|---|
| Sidebar | Fixed, width `--bh-sidebar-w` (280px), z-index `--bh-z-sidebar` (40), border-right, transition `--bh-dur-sidebar` |
| Sidebar collapsed | width `--bh-sidebar-w-collapsed` (88px), links center |
| Topbar | sticky top:0, z-index `--bh-z-topbar` (50), height `--bh-topbar-h` (72px), bg `rgba(8,9,11,0.86)`, backdrop-blur 8px |
| Main content | flex col, min-height 100vh, margin-left sidebar width, transition margin |
| Content area | padding `--bh-space-6` lateral, `--bh-space-8` bottom, max-width 1240px |
| Container | max-width 1440px, padding `--bh-space-10` tablet, `--bh-space-7` mobile |

### Landing

| Área | Spec |
|---|---|
| Hero | bg image local, CTA primary, scroll suave |
| Catálogo | filtros, paginación "Cargar más", modal detalle |
| Cards | grid responsive, gap `--bh-space-8` |

---

## 🌳 Estados de Componentes (Regla ABSOLUTA)

**TODO componente interactivo DEBE contemplar 6 estados mínimos:**

| Estado | Requisito | Token clave |
|---|---|---|
| `default` | Base sin interacción | tokens por defecto |
| `hover` | Mouse sobre | `--bh-accent-hover` buttons, `--bh-bg-hover` cards |
| `focus` | Keyboard focus-visible | `outline: 2px solid var(--bh-accent); outline-offset: 3px` |
| `active` | Mouse presionado / Enter | `transform translateY(1px)`, `--bh-bg-active` |
| `disabled` | No interactivo | `opacity: 0.55`, `cursor: not-allowed` |
| `error` | Estado error | border `--bh-danger`, mensaje accesible |

**Estados extendidos (cuando aplica):**

| Estado | Cuándo |
|---|---|
| `loading` | Skeleton, spinner, `aria-busy` |
| `success` | Confirmación verde |
| `empty` | No data, ilustración + CTA |
| `selected` | Fila seleccionada, tab activo |

---

## 📱 Responsive (OBLIGATORIO)

> **PROHIBIDO implementar solamente desktop.**

**Mínimo 4 breakpoints por cambio visual/UX:**

| Breakpoint | Ancho | Dispositivo |
|---|---|---|
| `mobile` | 375px | iPhone SE / 8 / Android estándar |
| `tablet` | 768px | iPad Air / Pro |
| `desktop` | 1024px | Desktop estándar |
| `wide desktop` | 1280px+ | Monitores grandes, dashboards |

**Patrones responsive obligatorios:**

1. **Sidebar**: 280px normal → 88px colapsado → full-width en mobile (drawer)
2. **Topbar**: siempre visible, ajustes menores mobile
3. **Grid cards**: N columnas desktop → 1 columna mobile
4. **Modales**: `modal--large` desktop → `modal--medium` tablet → full-width mobile
5. **Tablas**: headers sticky, scroll horizontal mobile

**Mobile-first es la norma.** Escribir CSS mobile-first, luego progressive enhancement hacia desktop.

---

## 🎭 Motion (Reglas)

**Características del motion Bienenhaus:**

| Atributo | Regla |
|---|---|
| Sutiles | No roban atención del contenido |
| Rápidas | 140ms-240ms para micro-interacciones |
| Funcionales | Sirven para feedback visual, no decoración |
| Coherentes | Mismo easing `--bh-ease-premium` en todo el proyecto |
| No invasivas | No afectan performance ni accesibilidad |

**`prefers-reduced-motion: reduce` — SIEMPRE respetar:**

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

### Contraste obligatorio

| Elemento | Ratio mínimo |
|---|---|
| Texto normal | ≥ 4.5:1 |
| Texto grande (≥18pt o ≥14pt bold) | ≥ 3:1 |
| UI components (borders, badges, buttons) | ≥ 3:1 |

**Contrastes validados:**

- `--bh-text-primary` (#f4f4f4) sobre `--bh-bg-primary` (#050607): ∞:1 ✅
- `--bh-text-secondary` (#bfc6cc) sobre `--bh-bg-secondary` (#0a0d10): ≥ 4.5:1 ✅
- `--bh-text-tertiary` (#8a949c) sobre `--bh-bg-card` (#1a1e23): ≥ 3:1 ✅
- `--bh-accent` (#1fc8c3) sobre `--bh-bg-primary`: ~6.8:1 ✅

### Focus visible

- **Global**: `outline: 2px solid var(--bh-accent); outline-offset: 3px` en `:focus-visible`
- Inputs, buttons, links, radio buttons, checkboxes
- **NUNCA** `outline: none` sin alternativa accesible

### ARIA y semántica

- ARIA labels solo cuando el contenido visible no basta
- `aria-busy="true"` en loading, `aria-busy="false"` al completar
- `aria-describedby` para error messages
- Labels asociados a inputs via `for` / `id`
- `aria-expanded` en dropdowns/accordions
- `aria-hidden` en iconos decorativos

### Keyboard navigation

- Tab order funcional y lógico
- Enter/Space activan buttons
- Escape cierra modales/dropdowns
- Skip link en cada página (visible en focus)

### Reduced motion

Ver sección Motion arriba. **No negociable.**

---

## 🧭 Workflow de Diseño (obligatorio)

Cuando trabajes en UI de Bienenhaus, sigue este workflow SIEMPRE:

### 1. BEFORE — Entender antes de tocar

1. Leer este skill (tokens + componentes + reglas)
2. Identificar qué componente/vista vas a tocar
3. CodeGraph el símbolo: `codegraph_explore("ComponentName")`
4. Leer el código actual antes de editar
5. Si es trabajo nuevo: consultar skill `designing-frontend-interfaces` para metodología

### 2. INFORM — Aprender lo que falta

- ¿Necesita principios visuales generales? → skill `frontend-design`
- ¿Necesita metodología de design system? → skill `frontend-design-systems`
- ¿Necesita a11y? → skill `building-accessible-interfaces`
- ¿Necesita review visual? → skill `reviewing-interface-quality`

### 3. IMPLEMENT — Tokens antes que valores

1. Usar tokens `--bh-*` SIEMPRE. No hardcoded.
2. Si necesitás un valor nuevo → proponer token nuevo, no inventarlo inline.
3. Móvil-first CSS, progressive enhancement.
4. Los 6 estados de componente (default, hover, focus, active, disabled, error).
5. Respeta `prefers-reduced-motion`.

### 4. VERIFY — Evidencia real, no suposiciones

1. Playwright screenshot (desktop 1280px, tablet 768px, mobile 375px)
2. Verificar focus visible con Tab
3. Console messages: 0 errores JS
4. Si cambio tokens: ejecutar typecheck + build

### 5. REVIEW — Auditoría final

1. Validar que no hardcodeaste colores/tamaños
2. Validar contrastes (≥4.5:1 texto)
3. Validar responsive en 4 breakpoints
4. Validar motion respeta `prefers-reduced-motion`
5. Validar que no rompiste tests existentes

---

## 🚫 Reglas Anti-Destrucción

**NUNCA:**

- Cambiar arquitectura sin motivo justificado
- Reemplazar librerías existentes sin análisis
- Convertir todo a otra UI library (shadcn, Material, Tailwind)
- Introducir Tailwind (stack es CSS Modules + custom props)
- Eliminar componentes sin comprobar dependencias
- Modificar APIs por problemas visuales
- Modificar backend por tarea puramente visual
- Cambiar rutas o contratos API
- Eliminar tests
- Eliminar funcionalidad para "simplificar"
- Modificar autenticación, RLS, o Supabase por motivos visuales
- Hardcodear colores/tamaños/easings fuera de tokens

**Antes de modificación estructural:**

1. Inspeccionar dependencias (CodeGraph)
2. Comprobar usos (LSP references)
3. Evaluar impacto
4. Modificar
5. Ejecutar tests
6. Revisar regresiones visuales (Playwright)

---

## 📚 Jerarquía de Skills (layers de authority)

> **Regla:** Las skills genéricas jamás sobrescriben las reglas específicas de Bienenhaus.

| Nivel | Skill | Authority |
|---|---|---|
| **1 — Bienenhaus** | `bienenhaus-design-system` (este skill) | Tokens, colores, componentes, layout, branding, patrones propios. **OVERRIDE todo.** |
| 2 — Metodología | `frontend-design-systems` | Armado/evolución de design systems (atoms, tokens, composable) |
| 3 — Proceso | `designing-frontend-interfaces` | Metodología before/implement (research, sketch, prototype, test) |
| 4 — Visual | `frontend-design` | Principios visuales genéricos (ritmo, jerarquía, tipografía, color, espacio) |
| 5 — A11y | `building-accessible-interfaces` | WCAG AA+ (contraste, focus, ARIA, keyboard, reduced motion) |
| 6 — Audit | `reviewing-interface-quality` | Auditoría visual y de calidad de interfaces |

**Conflicto:** Cuando una skill genérica diga algo contrario a este skill, **este skill gana.**
El stack Bienenhaus es: Preact + CSS Modules + custom properties `--bh-*`. No Tailwind, no shadcn, no styled-components.

---

## 🔗 Referencias Rápidas

| Qué | Dónde |
|---|---|
| Tokens admin | `packages/bienenhaus-ui/src/tokens.css` |
| Tokens landing | `apps/landing/src/styles/landing.css` (alias legacy `--accent`, `--bg-*`) |
| Design system package | `packages/bienenhaus-ui/` (atoms + molecules + stories + tests) |
| Componentes admin | `apps/admin/src/components/` |
| Componentes landing | `apps/landing/src/components/` |
| Especificación admin visual | `apps/admin/DESIGN.md` |
| Especificación landing visual | `apps/landing/DESIGN.md` |
| Documentos de diseño | `docs/design/`, `docs/reviews/` |
| Migración design system | `docs/runbooks/design-system-atoms-migration.md` |
| ADR design system | `docs/adr/005-design-system-atoms.md` |
