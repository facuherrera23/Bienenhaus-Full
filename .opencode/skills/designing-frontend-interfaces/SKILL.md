# designing-frontend-interfaces — Methodology BEFORE You Write Code

> **Process skill.** Use this when designing NEW interfaces or significantly REDESIGNING existing ones.
> For touch-ups or token swaps, `bienenhaus-design-system` alone may suffice.
> For brand-new views, this skill ensures you design before you implement.

---

## 🎯 When This Skill Activates

- New page/view (not just adding a button to an existing one)
- Redesign of a major flow (dashboard, catalog, form, modal)
- New component that didn't exist before
- Reorganizing information architecture

---

## 🧭 The 5-Phase Process (before/implement/iterate)

### Phase 1: UNDERSTAND (before any pixel)

Pregúntate, NO asumas. Si no sabés la respuesta, no avances hasta saberla.

**Preguntas obligatorias:**

1. **¿Qué problema funcional resuelve esta interfaz?** (No estético)
2. **¿Quién la usa?** (rol: super_admin, admin, staff, viewer, public visitor)
3. **¿Cuál es la acción PRIMARIA?** (la que el usuario DEBE poder hacer)
4. **¿Cuáles son las acciones SECUNDARIAS?** (las que podría hacer)
5. **¿Qué información es CRÍTICA?** (sin esto no puede operar)
6. **¿Qué información es SOPORTE?** (útil pero no bloqueante)
7. **¿Qué información es RUIDO?** (se puede eliminar)
8. **¿Dónde está ahora?** (ruta, contexto en la app)
9. **¿Desde dónde llega el usuario?** (link, CTA, redirect)
10. **¿A dónde debe ir después?** (next action, success state)

**Salida de Phase 1:** Respuestas a las 10 preguntas en un párrafo. Si no podés responderlas, no avances.

### Phase 2: RESEARCH (mirar antes de inventar)

Antes de abrir keyboard para hacer CSS, haz research visual.

**Research obligatorio:**

1. **Dentro de Bienenhaus:** ¿Existe ya un patrón similar en otra página?
   - Si sí → replicate el patrón. No inventes.
   - Si no → ¿cuál es el patrón más cercano?
2. **Fuera de Bienenhaus:** ¿Cómo resuelven esto productos premium similares?
   - Inmobiliarias: Zillow, Realtor, Idealista, Properati
   - CRMs: Linear, Notion, Attio
   - Dashboards: Stripe Dashboard, Vercel Dashboard, Linear Analytics
3. **Design system consulta:** ¿Qué tokens y componentes existen?
   - No inventes tokens si ya existen. Revisa `bienenhaus-design-system`.

**Salida de Phase 2:** 2-3 referencias visuales identificadas + lista de tokens + lista de componentes a usar.

### Phase 3: SKETCH (low-fidelity before high-fidelity)

Antes de pixels finales, baja fidelidad.

**Workflow:**

1. **Wireframe mental** — ¿Cómo se ve en mobile? ¿Desktop?
2. **Sketch ASCII / papel** — rápido, sucio, 30 segundos
3. **Identifica la grilla** — ¿Cuántas columnas? ¿Sidebar + main? ¿Stack vertical?
4. **Identifica el punto focal** — ¿Qué debe ver el usuario PRIMERO?
5. **Identifica estados** — default, empty, loading, error (todos los que apliquen)

**Ejemplo sketch (lista de propiedades):**

```
Mobile (375px)              Desktop (1280px)
+----------------------+    +-------+--------------+
| Topbar (hamburger)   |    |       | Topbar       |
| Filter pill row      |    | Side  +--------------+
| +---+ +---+ +---+   |    | bar   | Filters      |
| | C | | C | | C |   |    |       +--------------+
| +---+ +---+ +---+   |    |       | Card  Card   |
| +---+ +---+         |    |       | Card  Card   |
| | C | | C |         |    |       | ...          |
| +---+ +---+         |    |       |              |
| [Cargar más button]  |    |       | [Cargar más] |
+----------------------+    +-------+--------------+
```

**Salida de Phase 3:** Sketch claro (mental o escrito) responsive en mobile + desktop. Estados identificados.

### Phase 4: COMPOSE (design con tokens, no con pixels)

Ahora sí, a escribir el componente. Pero con tokens, no valores hardcoded.

**Rules:**

1. **Tokens primero.** Si existe un token para el valor que necesitas, úsalo.
2. **Mobile-first.** Escribe CSS para mobile, luego `@media (min-width: 768px)` para arriba.
3. **Los 6 estados.** default, hover, focus, active, disabled, [error/loading].
4. **`prefers-reduced-motion`.** Si tienes una transition, tienes un reduced-motion fallback.
5. **Semántica HTML primero.** `<button>` para acciones, `<nav>` para navegación, etc.
6. **ARIA solo cuando necesario.** Si el HTML semántico basta, no añadas ARIA.

**Patrones de composición Bienenhaus:**

- **Lista de items**: grid responsive, cards con hover, lazy load, "Cargar más"
- **Form**: label arriba, input + helper text, error abajo, button al final
- **Modal**: backdrop blur, card centrada, header + body + actions, Escape cierra
- **Tabla**: sticky header, hover row, selected row, scroll horizontal mobile
- **Dashboard**: KPI cards arriba (grid), chart y tabla abajo

**Salida de Phase 4:** Componente implementado, usando tokens, mobile-first, 6 estados, reduced-motion.

### Phase 5: VERIFY (evidencia, no imaginación)

El ojo de un diseñador senior se verifica con evidencia, no con suposición.

**Verification gates:**

1. **Screenshot desktop (1280px)** — ¿se ve como imaginaste?
2. **Screenshot tablet (768px)** — ¿se ajusta bien?
3. **Screenshot mobile (375px)** — ¿se ve cómodo en el teléfono?
4. **Keyboard nav** — Tab a través del componente, ¿el focus visible es claro?
5. **Console errors** — ¿hay JS errors? (rojo en console)
6. **Lighthouse (si es landing)** — Performance ≥ 98, Accessibility ≥ 95
7. **Contraste** — ¿textos ≥ 4.5:1? (verificar tokens)
8. **Reduced motion** — activa en DevTools, ¿se detiene toda animación?

**Si algo falla:** Vuelve a Phase 4. No declares "done" con algo roto.

**Salida de Phase 5:** Screenshots guardados + verificación completada + 0 errores.

---

## 📋 Information Architecture (IA) Principles

### Progressive Disclosure

No muestres todo al mismo tiempo. El usuario aprende progresivamente.

- **Nivel 0:** Card / Botón / Label (lo que ve primero)
- **Nivel 1:** Hover / Click → información adicional (popover, dropdown, expand)
- **Nivel 2:** Modal / Drawer → contexto completo (detalle, edición)
- **Nivel 3:** Página dedicada → profundidad completa

**Regla:** Si todo está en Nivel 0, el usuario se abruma. Si todo está en Nivel 3, el usuario se cansa.

### Decision Trees for Layout

Pregúntate:

1. **¿Esta info cambia segun el usuario?** → personalizar layout, no solo contenido
2. **¿Esta info es urgente?** → mostrala en el viewport principal (above the fold)
3. **¿Esta info es contextual?** → mostrala solo cuando es relevante (badge, status)
4. **¿Esta info es opcional?** → collapse por defecto, expand on demand
5. **¿Esta info es crítica siempre?** → sticky, no scroll-away

---

## 🎭 States Checklist (every interface)

Cada interfaz debe pensar estos estados explícitamente:

| Estado | Cuándo | Diseño |
|---|---|---|
| `default` | Datos cargados, sin interacción | Render completo |
| `loading` | Fetching data | Skeleton (no spinner genérico) |
| `empty` | Sin datos (primera vez o filtros sin resultados) | Ilustración + título + CTA |
| `error` | Falla de carga o validación | Mensaje claro + acción de retry |
| `partial-data` | Algunos datos cargados, otros pendientes | Render lo que hay, skeletons para lo que falta |
| `overflow` | Más datos de los que caben | Paginación, "Cargar más", scroll virtual |
| `mobile` | viewport < 768px | Layout adaptado (no "achicar el desktop") |
| `desktop` | viewport ≥ 1024px | Layout completo, maximiza el espacio |
| `keyboard` | Usuario navega con teclado | Focus visible en todo互动 element |
| `screen reader` | Usuario usa screen reader | Semántica + ARIA + alt text |
| `reduced motion` | Usuario prefiere menos movimiento | Animaciones a 0s o 0.01ms |

---

## 🚫 Anti-Patrons en el Process

| Anti-patrón | Por qué malo | Qué hacer |
|---|---|---|
| Saltar UNDERSTAND y ir directo a CSS | No sabes qué estás diseñando | Responder las 10 preguntas primero |
| Imitar diseño de IA (gradients, glassmorphism) | No es premium, es genérico | Referencias de productos premium reales |
| Empezar por desktop, mobile "después" | Mobile-first es la norma | Mobile CSS, then `@media (min-width: ...)` |
| Olvidar empty state | El real usuario verá empty primero | Diseñar empty ANTES que loaded |
| Olvidar loading skeleton | El fetch no es instantáneo | Skeleton desde el día 1 |
| Olvidar error state | Los APIs fallan | Error state diseñado, no "algo pasó" |
| Olvidar keyboard nav | Usuarios de teclado existen | Tab a través del flow |
| Olvidar reduced motion | Usuarios sensibles a motion existen | Scribir `@media (prefers-reduced-motion)` desde el inicio |
| Hardcoded values en CSS | Tokens son la fuente | Revisar qué token mapea |
| "Lo termino después" | Lo "después" no existe | Si lo listaste, lo haces |

---

## 📐 Component Design Recipe (step-by-step)

Cuando tengas que diseñar un componente nuevo:

1. **¿Qué hace?** (una frase, no tres)
2. **¿Dónde se usa?** (lista de pages)
3. **¿Qué props necesita?** (API mínima)
4. **¿Qué estados tiene?** (default, hover, focus, active, disabled, + extras)
5. **¿Cómo se ve en mobile?** (375px)
6. **¿Cómo se ve en desktop?** (1280px+)
7. **¿Qué tokens usa?** (lista de `--bh-*`)
8. **¿Qué dependencias tiene?** (atoms, molecules, hooks)
9. **¿Cómo se testea?** (Playwright snapshot, test de comportamiento)
10. **¿Cómo se documenta?** (Stories file)

---

## 🎓 Mentalidad Senior

> Un diseñador senior no es el que añade más, sino el que sabe qué quitar.

**Antes de crear un componente nuevo:**

- ¿Puedo usar uno existente? (mira el design system primero)
- ¿Puedo extender uno existente? (añadir prop, no crear clase nueva)
- ¿Puedo combinar existentes? (molecule de atoms)
- Si nada de lo anterior → crear nuevo

**Antes de añadir un prop:**

- ¿Es realmente universal? (todos los usos lo necesitan)
- Si solo un caso → no es prop, es un componente separado o una variante

**Antes de añadir un token:**

- ¿No existe ya uno similar? (`--bh-space-*` más cercano)
- ¿Es semántico? (`--bh-bg-empty-state` no `--bh-bg-gray-special`)

---

## 🔗 When Other Skills Take Over

| Phase | Skill needed |
|---|---|
| UNDERSTAND | This skill |
| RESEARCH (within Bienenhaus tokens) | `bienenhaus-design-system` |
| RESEARCH (general visual principles) | `frontend-design` |
| COMPOSE (designing new component properties) | `frontend-design-systems` (component API) |
| COMPOSE (a11y rules) | `building-accessible-interfaces` |
| VERIFY (visual audit) | `reviewing-interface-quality` |
| IMPLEMENT (tokens, colors, layout) | `bienenhaus-design-system` (specifics) |
