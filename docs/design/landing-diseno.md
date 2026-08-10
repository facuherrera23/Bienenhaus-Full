# 🎨 Sistema de Diseño — Landing BIENENHAUS

> **Documento de referencia visual y técnica de la landing pública** (`apps/landing`).
> Fuente de verdad de estilos: `apps/landing/src/styles/landing.css` (6250 líneas) + CSS Modules por componente.
> Última revisión: 2026-08-09.

---

## 1. Identidad Visual

| Atributo         | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Marca**        | BIENENHAUS Propiedades — inmobiliaria premium                |
| **Logo**         | Wordmark: "BIENENHAUS" (Playfair Display 700, 22px, tracking 1.5px) + sub "PROPIEDADES" (Inter 300, 11px, uppercase, tracking 2px) |
| **Propuesta**    | Lujo oscuro (dark luxury): fondo casi negro + acento turquesa |
| **Sensación**    | Seria, confiable, exclusiva — sin ruido, mucho aire          |
| **Idioma UI**    | Español (AR)                                                 |

**Concepto:** la landing usa un único acento (turquesa `#1FC8C3`) sobre superficies casi negras. El acento nunca compite con el contenido: se reserva para CTAs, highlights y estados. El lujo se transmite con tipografía serif (Playfair) en titulares y mucho espaciado vertical.

---

## 2. Paleta de Colores

Tokens definidos en `:root` de `landing.css`:

| Token              | Hex / Valor               | Uso                                        |
| ------------------ | ------------------------- | ------------------------------------------ |
| `--bg-primary`     | `#050607`                 | Fondo base (casi negro, frío)              |
| `--bg-secondary`   | `#0a0d10`                 | Fondo alterno de secciones                 |
| `--card-bg`        | `#1a1e23`                 | Tarjetas (propiedades, agentes, stats)     |
| `--border-color`   | `rgba(255,255,255,0.06)`  | Bordes sutiles                             |
| `--border-input`   | `rgba(255,255,255,0.08)`  | Bordes de inputs                           |
| `--accent`         | `#1fc8c3`                 | CTA primario, highlights, scrollbar        |
| `--accent-hover`   | `#2dddd5`                 | Hover del acento                           |
| `--glow`           | `#56e7de`                 | Glow / brillos decorativos                |
| `--glow-soft`      | `rgba(31,200,195,0.15)`   | Halos suaves detrás de tarjetas            |
| `--text`           | `#f4f4f4`                 | Texto principal                            |
| `--text-secondary` | `#bfc6cc`                 | Texto secundario (descripciones)           |
| `--text-tertiary`  | `#8a949c`                 | Texto terciario (labels, metadatos)        |

### Reglas de uso

- **Contraste AA**: texto principal `#f4f4f4` sobre `#050607` → ratio alto (≈17:1). El acento `#1fc8c3` sobre fondo oscuro → ≈8:1 (AA+ para texto normal).
- **El acento no se usa como color de texto largo**: solo CTAs, highlights de una palabra (`.highlight`), iconos de estado y decoración.
- **Superficies en capas**: `--bg-primary` (fondo) → `--bg-secondary` (sección alterna) → `--card-bg` (contenedor elevado).
- **Bordes**: siempre blancos al 6-8% — nunca grises sólidos, para mantener la profundidad.

### Carta de colores (resumen)

```
Fondos:   #050607  #0a0d10  #1a1e23
Acento:   #1fc8c3  → hover #2dddd5  → glow #56e7de
Texto:    #f4f4f4  #bfc6cc  #8a949c
Bordes:   rgba(255,255,255,0.06)  rgba(255,255,255,0.08)
```

---

## 3. Tipografía

| Token            | Familia                                            | Uso                  |
| ---------------- | -------------------------------------------------- | -------------------- |
| `--font-heading` | `'Playfair Display', Georgia, serif`               | Titulares (700)      |
| `--font-body`    | `'Inter', system-ui, sans-serif`                   | Cuerpo (400/500/600) |

### Jerarquía de tamaños (valores reales en el CSS)

| Rol                     | Fuente   | Tamaño (desktop) | Peso | Tracking |
| ----------------------- | -------- | ---------------- | ---- | -------- |
| Hero title (línea 1-2)  | Playfair | ~64px (`clamp`)  | 700  | normal   |
| Título de sección       | Playfair | 44px (`clamp`)   | 700  | normal   |
| Descripción de sección  | Inter    | 17-18px          | 400  | normal   |
| Label de sección (`*-label`) | Inter | 11-12px        | 600  | 3-4px uppercase |
| Nombre de propiedad     | Playfair | 22-24px          | 600  | normal   |
| Metadatos / prices      | Inter    | 14-16px          | 500-600 | normal |
| Texto base              | Inter    | 15-16px          | 400  | normal   |

### Detalles de implementación

- `body` usa `font-family: var(--font-body)`, `font-weight: 400`, `line-height: 1.6`.
- Los **labels de sección** son la firma visual: 11-12px, uppercase, tracking 3-4px, en `--text-tertiary` (ej. `--catalog-label`, `--team-label`, `--services-label`, `--process-label`, `--contact-label`, `--stats-label`).
- Los **highlights** dentro de títulos (`.highlight`) se pintan con `--accent` + opcionalmente la misma familia serif (ej. "propiedades" en catálogo, "tasaciones" en servicios).
- `-webkit-font-smoothing: antialiased` en `html` para render nítido en Windows/Chromium.

---

## 4. Layout, Spacing y Radios

### Container

```css
--container-max: 1440px;
--container-pad: 70px;
```

- Secciones centradas con `.container` (`max-width: 1440px`, padding lateral 70px, margen auto).
- `--navbar-height: 90px` — la navbar fija ocupa 90px y el hero compensa ese espacio.

### Escala de ritmo vertical (secciones)

| Sección                | Padding (desktop)          |
| ---------------------- | -------------------------- |
| Catalog                | `100px 0 120px`            |
| Services               | `100px 0 120px`            |
| Team                   | `100px 0 120px`            |
| Stats                  | `160px 0 140px`            |
| Process                | `140px 0 160px`            |
| Contact                | `160px 0 180px`            |

Patrón: las secciones grandes respiran con 100-180px verticales; las que tienen fondo alterno (`--bg-secondary`) se marcan con `::before`/`::after` decorativos (gradientes radiales suaves del `--glow-soft`).

### Radios

| Token          | Valor  | Uso                        |
| -------------- | ------ | -------------------------- |
| `--radius-card`  | 26px | Tarjetas (property, team)  |
| `--radius-input` | 22px | Inputs del catálogo/form   |
| `--radius-btn`   | 60px | Botones pill               |

### Grids

- **Catálogo**: `grid` responsivo (1 → 2 → 3 columnas), con `gap` de 24-32px.
- **Servicios**: grid de 4 columnas en desktop (iconos Lucide en círculo de acento).
- **Equipo**: grid de 3-4 tarjetas con foto, overlay al hover, pills de especialidad.
- **Stats**: fila de 4 métricas con `useCountUp` (contadores animados).

---

## 5. Componentes Clave

### 5.1 Navbar

- **Estado default**: `background: transparent`, 90px de alto, fija (`position: fixed`, z-index 999).
- **Estado scrolled** (`.is-scrolled`): `rgba(5,7,8,0.82)` + `backdrop-filter: blur(22px)` + `border-bottom: 1px solid var(--border-color)` + sombra `0 4px 30px rgba(0,0,0,0.3)`.
- **Logo**: wordmark BIENENHAUS (Playfair 700, 22px, tracking 1.5px) + sub PROPIEDADES (11px, uppercase, tracking 2px, 300).
- **CTA**: `.btn-publish` — botón pill acento con glow; en mobile se condensa en menú hamburguesa (`.mobile-menu`).

### 5.2 Botones (sistema)

| Clase            | Contexto             | Forma              | Comportamiento hover                              |
| ---------------- | -------------------- | ------------------ | ------------------------------------------------- |
| `.btn-primary`   | Hero CTA             | Pill `--radius-btn` | Fondo `--accent-hover`, icono desliza + glow      |
| `.btn-outline`   | Catálogo / headers   | Pill, borde 1px     | Borde/acento, relleno sutil                       |
| `.btn-video`     | Hero video           | Texto + play circle | Círculo se llena de acento, pulse                 |
| `.btn-search`    | Filtros catálogo     | Pill, gradiente     | Glow y translación                                |
| `.btn-load-more` | Paginación catálogo  | Pill outline        | Borde acento, icono gira al hover                 |
| `.btn-card`      | PropertyCard         | Texto con underline | Subrayado animado, icono flecha                    |
| `.btn-team` / `.btn-stats` / `.btn-process` | CTA sección | Pill variantes | Acento / outline según contexto |
| `.btn-submit`    | Form contacto        | Pill, gradiente     | Glow + elevación                                  |

**Patrón común**: todos los botones pill usan `border-radius: var(--radius-btn)`, transición `--dur-fast` (200ms) con `--ease-premium`, e iconos Lucide que se desplazan o rotan en hover.

### 5.3 PropertyCard

- Fondo `--card-bg`, radio `--radius-card` (26px), borde sutil `--border-color`.
- Imagen con zoom sutil al hover; overlay con etiqueta de operación (VENTA/ALQUILER).
- Precio en Inter 600 + nombre en Playfair 600; metadata (ubicación, dormitorios, superficie) en `--text-tertiary`.
- Hover: elevación + glow suave (`--glow-soft`), `transform: translateY(-4px)`.

### 5.4 PropertyModal

- Capa de detalle a pantalla completa con galería, video YouTube, descripción ampliada y formulario de contacto.
- Animación de entrada con `--ease-premium`, fondo oscurecido + blur.
- Cierra con ESC, click en backdrop o botón ✕ (accesible).

### 5.5 TeamCard

- Foto con overlay degradado al hover; nombre (Playfair), rol, experiencia y bio.
- **Pills de especialidad** (`.team-pill`) — chips de acento translúcido.
- **Social buttons**: círculos que aparecen en hover con stagger (nth-child 1-3).

### 5.6 Inputs (catálogo y formularios)

- Radio `--radius-input` (22px), borde `--border-input`, fondo transparente/`--bg-secondary`.
- Focus: borde acento + `:focus-visible` outline 2px `--accent` offset 3px.
- Placeholder en `--text-tertiary`.

---

## 6. Motion

### Tokens

```css
--ease-premium: cubic-bezier(0.22, 0.61, 0.36, 1);   /* "ease out expo" - suave y premium */
--dur-fast: 200ms;
--dur-med: 350ms;
--dur-slow: 600ms;
```

### Mecánicas

- **`useReveal`** (IntersectionObserver): las secciones/tarjetas entran con fade + translateY cuando cruzan el viewport (clase `.visible`). Es la firma de scroll del sitio.
- **`useCountUp`**: contadores de stats animados al hacerse visibles.
- **`useSpotlight`**: efecto de resplandor que sigue al cursor en superficies (tarjetas).
- **Hover**: micro-interacciones de 200ms con `--ease-premium` (botones, cards, social).
- **Navbar**: transición de 350ms entre transparente y glass.
- **Scroll suave**: `scroll-behavior: smooth` en `html` + anclas de sección.
- **Reduced motion**: bloque `@media (prefers-reduced-motion: reduce)` que anula todas las animaciones/transiciones (`0.01ms !important`).

---

## 7. Secciones (orden de la landing)

1. **Hero** — fondo imagen + overlays (horizontal/vertical), título en dos líneas con reveal, descripción, CTAs, **stats-panel** flotante con métricas.
2. **Catalog** — header con label + título + filtros (tipo, operación, ubicación, precio, dormitorios), grid de PropertyCards, "Cargar más", estado vacío.
3. **Services** — 4 servicios con iconos (compra, venta, tasaciones, alquiler), CTA outline.
4. **Team** — grid de asesores con foto, especialidades y redes sociales.
5. **Stats** (`.stats-premium`) — 4 métricas animadas + CTA con icono.
6. **Process** — pasos del proceso (números romanos o steps) + CTA.
7. **Contact** — layout 2 columnas: info (dirección, teléfono, email, horarios, redes, mapa placeholder con pin animado) + formulario con validación y respuesta.
8. **TransitionStrip** — banda de separación con texto/glow animado (marquee).
9. **Footer** — hero CTA (newsletter), grid de 5 columnas (logo+desc+redes, navegación, servicios, contacto, mini-mapa), newsletter con checkbox RGPD y feedback, bottom bar con copyright.

Cada sección tiene su `*-label` uppercase + título Playfair con `.highlight` acento + descripción Inter — la **plantilla visual repetida** que da coherencia.

---

## 8. Responsive

- **Breakpoints**: mobile-first con `min-width` en 640/768/1024/1280 aprox. (media queries en landing.css).
- **Grids** se colapsan: catálogo 3→2→1 col, services 4→2→1, team 4→2→1.
- **Navbar**: en mobile se oculta la navegación y aparece menú hamburguesa con panel `.mobile-menu`.
- **Container**: `--container-pad` se reduce en pantallas chicas (70px → 20-24px).
- **Títulos**: `clamp()` para escalar fluidamente el hero y los títulos de sección.
- **Stats**: fila de 4 → grid 2×2.

---

## 9. Accesibilidad

- `:focus-visible` con `outline: 2px solid var(--accent)` + `outline-offset: 3px` en todos los interactivos.
- **Skip link** (`.skip-link`) para saltar al contenido.
- `prefers-reduced-motion` respetado globalmente.
- Contraste AA+: texto claro sobre fondos oscuros, acento AA+ para texto.
- ARIA labels en inputs, botones de icono, modal (role=dialog), navbar toggle.
- HTML semántico: `header`, `main`, `section`, `article`, `footer`, `nav`.
- `scroll-behavior: smooth` solo aplica si no hay reduced-motion.

---

## 📸 Referencia de capturas

Las capturas de referencia de cada sección viven en `docs/design/capturas/`:

| Sección       | Archivo                        |
| ------------- | ------------------------------ |
| Hero          | `capturas/01-hero.png`         |
| Catálogo      | `capturas/02-catalog.png`      |
| Servicios     | `capturas/03-services.png`     |
| Equipo        | `capturas/04-team.png`         |
| Stats         | `capturas/05-stats.png`        |
| Proceso       | `capturas/06-process.png`      |
| Contacto      | `capturas/07-contact.png`      |
| Transición    | `capturas/08-transition.png`   |
| Footer        | `capturas/09-footer.png`       |

> Regenerar con: `node scripts/capturas-landing.mjs` (requiere servidor de la landing corriendo).
