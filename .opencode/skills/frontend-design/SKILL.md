# frontend-design — Visual Principles for Senior Frontend Designers

> **Generic visual design principles.** These inform HOW you see and decide — not WHAT values to use.
> When working on Bienenhaus, `bienenhaus-design-system` skill overrides any concrete token/value.
> Use this skill as your visual literacy foundation.

---

## 🎯 Filosofía

Un diseñador senior frontend no "decora": toma decisiones visuales con intención.
Cada pixel tiene un porqué. Esta skill te enseña a pensar como un diseñador de nivel Awwwards,
no como un ingeniero que lanza CSS hasta que "se ve bien".

### Mindset

- **Diseño es comunicación, no decoración.** Cada elemento visual transmite algo.
- **La jerarquía visual es el mensaje.** Si todo compite por atención, nada destaca.
- **El espacio negativo es contenido.** El vacío dirige la atención.
- **La consistencia es más importante que la creatividad.** Un sistema predecible vence a 100 ideas sueltas.
- **El motion es feedback, no entretenimiento.** Si la animación no comunica estado, sobra.

---

## 🏛️ Principios Visuales Fundamentales

### 1. Jerarquía Visual (lo más importante)

La jerarquía es la columna vertebral del diseño. Sin jerarquía, no hay comunicación.

**Cómo se logra jerarquía (en orden de impacto):**

1. **Tamaño** — lo grande atrae antes que lo pequeño
2. **Contraste** — lo diferente destaca del fondo
3. **Color** — el acento rompe la monotonía
4. **Peso tipográfico** — bold pesa más que regular
5. **Espacio** — aislamiento = importancia
6. **Posición** — arriba-izquierda = primero (culturas LTR)

**Pirámide de jerarquía (calibrar antes de diseñar):**

```
           Nivel 1 (máximo)
          /              \
     Nivel 2            Nivel 2
    /      \           /      \
 Nivel 3  Nivel 3   Nivel 3  Nivel 3
```

Antes de diseñar una vista, pregúntate:
1. ¿Qué es lo PRIMERO que debe ver el usuario? → Nivel 1
2. ¿Qué es lo SEGUNDO? → Nivel 2
3. ¿Qué es lo TERCERO? → Nivel 3

**Anti-patrón:** "Todo es importante" → nada es importante. Si todo compite, nada gana.

### 2. Ritmo y Repetición

El ritmo crea predictibilidad. La predictibilidad crea confianza.
La confianza crea la sensación de "producto cuidado".

- **Espaciado consistente** — usar una escala (4px base), no valores arbitrarios
- **Componentes repetibles** — mismo patrón para cosas iguales (cards, buttons, inputs)
- **Easing consistente** — una curva firma para todo el proyecto (no 10 easings diferentes)
- **Durations consistente** — fast/med/slow, no 137ms, 240ms, 380ms, 410ms a la vez

**El ritmo es invisible cuando funciona.** Solo se nota cuando se rompe.

### 3. Contraste (no solo color)

Contraste es diferencia. Diferencia crea distinción. Distinción crea legibilidad.

**Tipos de contraste:**

| Tipo | Ejemplo |
|---|---|
| Color | texto claro sobre fondo oscuro |
| Tamaño | H1 48px vs body 16px |
| Peso | bold 700 vs regular 400 |
| Espacio | 80px padding vs 16px padding |
| Forma | rectángulo vs círculo |
| Textura | sólido vs patrón |
| Estado | default vs hover (cambio sutil) |

**Regla de contraste WCAG:** texto ≥ 4.5:1, texto grande ≥ 3:1, UI ≥ 3:1.

### 4. Espacio Negativo (whitespace)

El espacio negativo NO es "vacío que hay que llenar". Es contenido que dirige atención.

**Funciones del espacio negativo:**

- Separa ideas (padding entre secciones = "esto es otra cosa")
- Agrupa conceptos (gap pequeño entre elementos = "están relacionados")
- Da respiración (padding interno = "esto es cómodo de leer")
- Crea jerarquía (aislar algo = "esto es importante")

**Error común:** Llenar todo. Un diseño denso no es un diseño completo — es ruido.

### 5. Alineación y Grid

La alineación es invisible cuando funciona. La desalineación es lo primero que se nota.

- **Grid system** — alinear a una grilla (columnas CSS, flex gap, grid grid-template)
- **Alineación consistente** — izquierda, centro, o derecha. No mezclar sin motivo.
- **Baseline** — texto alineado a baseline (line-height consistente)
- **Optical alignment** — a veces medir pixels no es alinear visualmente (iconos en buttons)

### 6. Tipografía

La tipografía es el 95% del diseño web. Si la tipografía funciona, el diseño funciona.

**Principios:**

- **Una familia display + una familia body.** No 5 fuentes diferentes.
- **Limit variantes** — no usar 18 pesos. 3-4 pesos max (regular, medium, semibold, bold).
- **Line-height body: 1.5** — texto legible. Headlines: 1.1-1.2.
- **No justificar** — justificado crea ríos blancos. Left-align por defecto.
- **Textura tipográfica** — mira el bloque de texto como textura. ¿Es denso? ¿Ligero? ¿Gris uniforme?
- **Max-width leyenda** — medida ideal para body: 45-75 caracteres por línea.

### 7. Color

> **Para Bienenhaus:** ver `bienenhaus-design-system` para los tokens exactos. Esto son principios generales.

- **Regla 60-30-10** — 60% primary, 30% secondary, 10% accent
- **Un acento es un acento** — si todo es accent, nada es accent
- **Color_emocional vs funcional** — funcional (status), emocional (brand)
- **Dark UI limites** — no usar blanco puro (#fff) para todo texto #f4f4f4 cansa menos
- **Status colors no son decorativos** — success verde solo para success, no para decorar

### 8. Profundidad y Elevación

La profundidad crea jerarquía espacial. No todo debe estar en el mismo plano.

**How to create depth:**

- **Shadows** — pero sutiles. Una sombra enorme rompe dark UI.
- **Borders** — `rgba(255,255,255,0.06)` — apenas visible, pero suficiente
- **Background ligeramente distintos** — `#050607` → `#0a0d10` → `#1a1e23`
- **Backdrop blur** — para topbars/modals que se superponen

**Anti-patrón:** Profesores de IA tienden a añadir sombras enormes tipo `0 20px 60px rgba(0,0,0,0.8)`.
Eso NO es premium. Es cartoon. Shadows sutiles, confiables, predecibles.

---

## 📐 Composición (ponerlo todo junto)

### Regla de tercios

No centrar todo. Divide visualmente en tercios y coloca puntos focales en intersecciones.

### Punto focal

Toda vista tiene un punto focal — lo que el usuario DEBE ver primero.
Si no identificas un punto focal, la vista no está terminada.

- ¿Un CTA primario? → ese es el punto focal
- ¿Una métrica crítica? → esa, con tipografía display
- ¿Un empty state? → el icono + título

### Balance

No simétrico obligado. Ayas-symétrico visual:
- Un elemento grande a la izquierda + tres pequeños a la derecha = balanceado
- Un elemento pesado arriba + espacio negativo abajo = balanceado

### Proximidad (Ley de Gestalt)

Elementos cercanos se perciben como relacionados. Elementos lejanos como separados.
Usa el `gap` intencionalmente:
- `gap: 4px` → "muy unidos" (icon + label)
- `gap: 16px` → "relacionados" (card body)
- `gap: 32px` → "separados" (section break)
- `gap: 80px` → "totalmente distinto" (page break)

---

## 🎨 Principios de Diseño de Nivel Awwwards

### 1. Restraint (auto-control)

Lo que DISTINGUE el trabajo Awwwards no es lo que tiene — es lo que le falta.
Diseñadores senior quitan. Diseñadores junior añaden.

Antes de añadir un elemento, pregúntate: "Si lo quito, ¿el diseño pierde algo?"
Si la respuesta es "no" → no lo añadas.

### 2. Atención a micro-detalles

Lo que separa "bueno" de "premium" son los detalles:
- `:focus-visible` — ¿es inmediato, predecible, accesible?
- `hover` — ¿el cambio es sutil pero exacto?
- `transition` — ¿la curva es la firma del producto o `ease` default?
- Loading — ¿hay skeleton o un spinner genérico?
- Empty state — ¿hay un empty state diseñado o "No data"?
- Error state — ¿el mensaje ayuda o culpa al usuario?

### 3. Coherencia de sistema (no creatividad aislada)

Si inventaste un patrón nuevo en un componente, ese patrón debe funcionar en TODOS los componentes similares.
Si no funciona en todos → no lo inventes. Usa el patrón existente.

### 4. Performance visual

- Imágenes optimizadas (WebP, lazy load, sizes responsive)
- Fonts con `font-display: swap` y preload critical fonts
- CSS critical inline (above the fold)
- Animations que no causan layout thrashing (transform + opacity, NO width/height)
- `will-change` solo cuando es necesario

### 5. Sensación de producto cuidado

Esto es la suma de todo:
- No hay 1px fuera de lugar
- No hay textos cortados
- No hay imágenes sin alt
- No hay buttons sin hover state
- No hay tablas sin empty state
- No hay forms sin error state
- No hay loading sin skeleton
- No hay animaciones que parecen rotas

---

## 🧪 Cómo Pensar un Diseño (workflow mental)

Antes de tocar teclado:

1. **¿Qué problema resuelve esta vista?** (no estético — funcional)
2. **¿Quién la usa?** (usuario principal, contexto)
3. **¿Cuál es la acción primaria?** (lo que el usuario DEBE hacer)
4. **¿Cuál es la acción secundaria?** (lo que podría hacer)
5. **¿Qué información es crítica?** (jerarquía nivel 1)
6. **¿Qué información es de soporte?** (jerarquía nivel 2-3)
7. **¿Cómo se ve en mobile?** (mobile-first pensar, no al final)
8. **¿Qué estados necesita?** (default, hover, focus, active, disabled, loading, error, empty, success)
9. **¿Qué tokens voy a usar?** (no inventar — usar los existentes)
10. **¿Cómo verifico que está bien?** (screenshot, no "yo creo que se ve bien")

---

## ❌ Anti-Patrones de IA (lo que DISTINGUE a un humano senior de un LLM)

| Anti-patrón IA | Lo que un senior hace |
|---|---|
| Gradients morados/rosados sin motivo | Sólidos o gradients sutiles con propósito |
| Glassmorphism excesivo | 1 backdrop blur en topbar/modal, no en todo |
| Sombras enormes `0 0 50px` | Sombras discretas jerarquicas |
| Borders visibles en todo `1px solid white` | Borders `rgba(255,255,255,0.06)` apenas perceptibles |
| "Premium" = gold, serif, sparkle | Premium = restraint, optical alignment, consistencia |
| 10 easings diferentes | 1 firma ease + 2 utilitarios |
| Texto centrado siempre | Centrado cuando tiene sentido (hero, empty state) |
| Animaciones en todo | Animaciones como feedback, no decoración |
| Cards con scale: 1.05 en hover | Hover sutil: border-strong + shadow-md |
| 5 fuentes mezcladas | 2 familias (display + body), 3-4 pesos |
| Color por emoción | Color por función + 1 firma brand |
| "Let me add some animations" | Menos movimiento = más elegante |

---

## ✅ Checklist de Calidad Visual ( rápido)

Antes de decir "está listo":

- [ ] Jerarquía clara (nivel 1, 2, 3 identificables)
- [ ] Un punto focal por vista
- [ ] Espaciado consistente (escala 4px, no arbitrario)
- [ ] Alineación consistente (no desalineados random)
- [ ] Tipografía: 2 familias, 3-4 pesos, line-height legible
- [ ] Color: 60-30-10 rule, 1 accent
- [ ] Contraste WCAG AA (texto ≥4.5:1)
- [ ] Estados: default, hover, focus, active, disabled
- [ ] Responsive: 375px, 768px, 1024px, 1280px
- [ ] Motion: sutil, rápido, funcional, respeta reduced-motion
- [ ] Focus visible: `outline` claro, no `outline: none`
- [ ] Empty state diseñado
- [ ] Loading state (skeleton, no spinner solo)
- [ ] Error state con mensaje útil
- [ ] Sin anti-patrones IA listados arriba
- [ ] Verificado con screenshot, no con imaginación

---

## 🔗 Cuándo otras skills toman el relevo

| Necesidad | Skill |
|---|---|
| Tokens/valores específicos Bienenhaus | `bienenhaus-design-system` |
| Construir/evolucionar un design system | `frontend-design-systems` |
| Metodología before/implement | `designing-frontend-interfaces` |
| Accesibilidad WCAG AA+ | `building-accessible-interfaces` |
| Auditoría visual y revisión | `reviewing-interface-quality` |
