# MÓDULO TASAR (TASACIONES) — PLAN MAESTRO DE IMPLEMENTACIÓN
Version: 1.0
Proyecto: BIENENHAUS PROPIEDADES
Estado: Pendiente
Prioridad: CRÍTICA

---

# OBJETIVO

Diseñar e implementar un nuevo módulo administrativo denominado **Tasar**, destinado a la creación, edición, almacenamiento, seguimiento y generación de informes de tasaciones inmobiliarias.

Este módulo reemplazará completamente el uso aislado del archivo **TAI.html**, integrándolo dentro del ecosistema del panel administrativo de Bienenhaus.

El objetivo NO es rediseñar el sistema existente.

El objetivo es migrarlo íntegramente.

---

# REGLA FUNDAMENTAL

## TAI.html ES LA ÚNICA FUENTE DE VERDAD.

Esto significa que:

- NO se pueden inventar campos.
- NO se pueden eliminar campos.
- NO se pueden modificar nombres.
- NO se pueden simplificar formularios.
- NO se pueden eliminar botones.
- NO se pueden modificar cálculos.
- NO se pueden modificar fórmulas.
- NO se pueden modificar validaciones.
- NO se pueden modificar selects.
- NO se pueden modificar opciones de selects.
- NO se pueden modificar textos.
- NO se pueden modificar flujos.
- NO se pueden modificar acordeones.
- NO se pueden modificar gráficos.
- NO se pueden modificar mapas.
- NO se pueden modificar reportes.
- NO se pueden modificar PDFs.

Si existe una diferencia entre el nuevo módulo y TAI.html, siempre prevalece el comportamiento de TAI.html.

---

# OBJETIVO DE LA MIGRACIÓN

El usuario debe obtener exactamente la misma experiencia funcional que posee actualmente en TAI.html.

La única diferencia aceptada será:

- Integración con el panel administrativo.
- Adaptación visual al Design System de Bienenhaus.
- Persistencia de datos en Supabase.
- Arquitectura basada en componentes.

Nada más.

---

# PROHIBICIONES

Está terminantemente prohibido:

- simplificar lógica
- eliminar funcionalidades
- crear nuevas reglas
- cambiar nombres
- modificar fórmulas
- reemplazar cálculos por otros
- omitir campos
- omitir botones
- reemplazar selects
- modificar eventos
- cambiar comportamiento

---

# FASE 1 — AUDITORÍA COMPLETA

Antes de escribir una sola línea de código deberá realizarse una auditoría completa de TAI.html.

Esta auditoría deberá documentar absolutamente todo.

## Debe extraerse:

### Estructura

- todas las secciones
- subsecciones
- acordeones
- cards

---

### Formularios

Todos.

Sin excepción.

---

### Campos

Todos.

Sin excepción.

Incluyendo:

- input
- textarea
- select
- checkbox
- radio
- hidden
- disabled
- readonly

---

### Selects

Cada select deberá documentarse indicando:

- nombre
- opciones
- valores
- valor por defecto

No puede cambiarse ninguna opción.

---

### Botones

Documentar:

- nombre
- icono
- acción
- estado habilitado
- estado deshabilitado

---

### Funciones Javascript

Documentar:

- nombre
- parámetros
- comportamiento
- dependencias
- eventos disparados

---

### Eventos

Registrar todos los:

onclick

onchange

oninput

keyup

keydown

submit

focus

blur

load

resize

scroll

drag

drop

etc.

---

### Validaciones

Documentar:

- obligatorios
- mínimos
- máximos
- formatos
- restricciones
- reglas especiales

---

### Cálculos

Documentar TODOS.

Sin excepción.

Especialmente:

- coeficientes
- superficies
- ajustes
- promedios
- comparables
- valorizaciones
- indicadores
- resultados finales

Todas las fórmulas deberán mantenerse exactamente iguales.

---

### Gráficos

Registrar:

- tipo
- datasets
- colores
- comportamiento
- interacción
- actualización

---

### Mapa

Documentar completamente:

- proveedor
- marcadores
- zoom
- controles
- comportamiento

---

### Fotografías

Documentar:

- carga
- eliminación
- vista previa
- almacenamiento

---

### PDF

Documentar:

- estructura
- orden
- contenido
- formato
- estilos
- páginas

Debe mantenerse idéntico.

---

# FASE 2 — DISEÑO DE ARQUITECTURA

El HTML NO deberá copiarse como un único archivo.

Deberá convertirse en componentes reutilizables.

Ejemplo:

TasacionesPage

│

├── TasacionesList

├── TasacionForm

├── DatosPropiedadSection

├── DatosBarrioSection

├── ComparablesSection

├── AnalisisComparativoSection

├── ValoracionSection

├── FotografiasSection

├── PlanoSection

├── ObservacionesSection

├── PdfSection

├── ActionBar

└── Shared Components

Cada componente deberá contener únicamente la lógica correspondiente.

---

# FASE 3 — BASE DE DATOS

Crear un nuevo módulo persistente.

Tablas sugeridas:

property_valuations

valuation_comparables

valuation_images

valuation_documents

valuation_history

Todas deberán utilizar:

UUID

created_at

updated_at

deleted_at

created_by

updated_by

soft delete

RLS

auditoría

---

# FASE 4 — PÁGINA PRINCIPAL

Crear un nuevo apartado llamado:

Tasar

dentro del panel administrativo.

Debe existir un listado con:

Dirección

Cliente

Estado

Tasador

Fecha

Valor estimado

Última modificación

Acciones

---

# FASE 5 — DETALLE DE TASACIÓN

Al hacer click sobre una tasación deberá abrirse exactamente el mismo flujo existente en TAI.html.

Todas las secciones deberán conservar:

orden

funcionamiento

cálculos

interacciones

validaciones

---

# FASE 6 — LÓGICA

Toda la lógica deberá reutilizarse.

No deberá reescribirse salvo para adaptarla a TypeScript.

La IA deberá reutilizar:

funciones

cálculos

fórmulas

listeners

validaciones

gráficos

mapas

PDF

sin alterar el resultado.

---

# FASE 7 — INTEGRACIÓN

El módulo deberá integrarse con:

Sidebar

Router

Dashboard

Propiedades

Buscador

Permisos

Auditoría

Activity Log

Supabase

TanStack Query

React Hook Form

Zod

Signals

---

# FASE 8 — REFACTORIZACIÓN

Toda la lógica deberá distribuirse en:

components/

hooks/

lib/

services/

utils/

types/

validators/

queries/

schemas/

Nunca deberá existir un archivo gigante equivalente al HTML.

---

# FASE 9 — EXPERIENCIA DE USUARIO

La experiencia deberá mantenerse idéntica.

El usuario no deberá notar diferencias funcionales respecto de TAI.html.

Únicamente cambiará la apariencia para adaptarse al diseño del panel administrativo.

---

# CRITERIOS DE ACEPTACIÓN

La implementación se considerará finalizada únicamente cuando se cumplan TODOS los siguientes puntos.

□ Todos los campos existen.

□ Todos los botones existen.

□ Todos los selects existen.

□ Todos los selects contienen exactamente las mismas opciones.

□ Todas las fórmulas producen exactamente el mismo resultado.

□ Todos los cálculos son idénticos.

□ Todos los eventos funcionan igual.

□ Todos los gráficos funcionan igual.

□ Todos los mapas funcionan igual.

□ Todas las imágenes funcionan igual.

□ Todos los PDFs contienen exactamente la misma información.

□ Todos los acordeones funcionan igual.

□ Todas las validaciones son idénticas.

□ Todos los textos coinciden.

□ No existe ninguna funcionalidad eliminada.

□ No existe ninguna funcionalidad agregada sin aprobación.

□ Todo el módulo respeta la arquitectura del proyecto Bienenhaus.

□ El código compila sin errores TypeScript.

□ No existen warnings.

□ No existe código duplicado.

□ Toda la persistencia funciona correctamente mediante Supabase.

□ El módulo puede mantenerse independientemente del HTML original.

---

# DEFINICIÓN DE ÉXITO

El nuevo módulo deberá comportarse de forma indistinguible de TAI.html.

Si un usuario experimentado utiliza el nuevo módulo, deberá poder realizar exactamente las mismas operaciones, con los mismos resultados y el mismo flujo de trabajo, sin detectar diferencias funcionales.

El archivo TAI.html deberá utilizarse exclusivamente como especificación funcional durante el desarrollo y podrá dejar de utilizarse una vez que el nuevo módulo haya sido validado al 100 %.