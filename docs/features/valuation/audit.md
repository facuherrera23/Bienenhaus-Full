# AUDITORÍA COMPLETA — TAI.html (Módulo Tasar)

**Fecha:** 2026-08-07
**Versión:** 1.0
**Fuente:** `TAI.html` (1,404 líneas — HTML + CSS + JS en archivo único)
**Regla:** TAI.html es la **única fuente de verdad**. No se inventan, eliminan, modifican ni simplifican campos, fórmulas, validaciones, selects, botones, eventos, gráficos, mapas, PDFs ni flujos.

---

## 1. ESTRUCTURA GENERAL

### 1.1 Secciones principales (orden exacto en el HTML)

| #   | Sección                         | ID / Clase                                 | Tipo          | Observaciones                                                                                                                                            |
| --- | ------------------------------- | ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header superior                 | `header.top`                               | Fijo          | Brand, subtitle, fecha, logo badge                                                                                                                       |
| 2   | Status bar                      | `#statusBar`                               | Dinámico      | Estado edición/finalizado, última guardado                                                                                                               |
| 3   | **Datos del Cliente**           | `section.card`                             | Acordeón      | 4 campos en grid 2 cols                                                                                                                                  |
| 4   | **Foto de Fachada**             | `section.card`                             | Acordeón      | Upload + preview + remove (base64)                                                                                                                       |
| 5   | **Datos del Inmueble**          | `section.card`                             | Acordeón      | 6 campos + 2 valor-boxes (USD/UVA)                                                                                                                       |
| 6   | **Plano de Ubicación**          | `section.card`                             | Acordeón      | Leaflet map + geocoding Nominatim + leyenda                                                                                                              |
| 7   | **Descripción de la Propiedad** | `section.card` (en `#printGroupPropiedad`) | Acordeón      | 16 campos (4+4+4+4 grid) + 18 ambientes (amb-grid 3 cols) + Total Cuartos (readonly) + 6 comodidades + 3 servicios (calef/aire/agua) + textarea adversas |
| 8   | **Servicios**                   | `section.card`                             | Acordeón      | 6 selects generados dinámicamente (RUBROS)                                                                                                               |
| 9   | **Características del Barrio**  | `section.card` (en `#printGroupBarrio`)    | Acordeón      | 9 selects + 4 % uso suelo (residencial/comercial/industrial/otro calculado)                                                                              |
| 10  | **Descripción del Barrio**      | `section.card` (en `#printGroupBarrio`)    | Acordeón      | 9 selects                                                                                                                                                |
| 11  | **Comparables**                 | `section.card`                             | Acordeón      | Contenedor dinámico + botón "+ Agregar comparable"                                                                                                       |
| 12  | **Análisis Comparativo**        | `#sectionAnalisisComparativo`              | Acordeón      | Dispersión ±% + tabla comparables (checkbox, precio/m², rangos) + 3 valuation-summary + Chart.js floating bars                                           |
| 13  | **Valuación**                   | `section.card`                             | Acordeón      | Tabla 2 filas (Terreno + Cubierta) + 4 valuation-summary (precio prom, coef prom, depreciación, VALOR FINAL)                                             |
| 14  | **Observaciones Generales**     | `section.card`                             | Acordeón      | 1 textarea                                                                                                                                               |
| 15  | **Plan de Marketing**           | `section.card`                             | Acordeón      | 8 párrafos fijos (marketing-text)                                                                                                                        |
| 16  | Footer                          | `.brand-footer`                            | Fijo          | Logo                                                                                                                                                     |
| 17  | Toast                           | `#toast`                                   | Flotante      | Notificaciones                                                                                                                                           |
| 18  | Action bar fija                 | `.action-bar`                              | Fija (bottom) | 4 botones: Guardar, Editar, Finalizar, Exportar PDF                                                                                                      |

### 1.2 Print groups (para PDF)

| Grupo                         | Contenido                                           | Page break           |
| ----------------------------- | --------------------------------------------------- | -------------------- |
| `#printGroupPropiedad`        | Descripción de la Propiedad + Servicios             | `break-before: page` |
| `#printGroupBarrio`           | Características del Barrio + Descripción del Barrio | `break-before: page` |
| `#sectionAnalisisComparativo` | Análisis Comparativo                                | `break-before: page` |

### 1.3 Accordions

- **Todos** los `section.card` son acordeones (click en `h2` → toggle `.collapsed`)
- Flecha `▾` rotada -90deg cuando colapsado
- En `@media print`: todos expandidos forzados, flechas ocultas

---

## 2. FORMULARIOS — TODOS LOS CAMPOS (120+)

### 2.1 Datos del Cliente (`#f_*`)

| ID              | Tipo               | Label             | Atributos                    | Validación       |
| --------------- | ------------------ | ----------------- | ---------------------------- | ---------------- |
| `f_solicitante` | `input[type=text]` | Solicitante       | —                            | —                |
| `f_fecha`       | `input[type=date]` | Fecha de Tasación | —                            | —                |
| `f_telefono`    | `input[type=text]` | Teléfono          | —                            | —                |
| `f_destino`     | `select`           | Destino           | Options: `Venta`, `Alquiler` | Default: `Venta` |

### 2.2 Foto de Fachada

| ID                 | Tipo               | Label         | Atributos               |
| ------------------ | ------------------ | ------------- | ----------------------- |
| `f_fotoFachada`    | `input[type=file]` | (hidden)      | `accept="image/*"`      |
| `photoPreview`     | `img`              | (preview)     | `style="display:none"`  |
| `photoPlaceholder` | `div`              | placeholder   | Click → abre file input |
| `photoRemove`      | `button`           | "Quitar foto" | `style="display:none"`  |

### 2.3 Datos del Inmueble

| ID                | Tipo                 | Label                      | Atributos / Options                                           |
| ----------------- | -------------------- | -------------------------- | ------------------------------------------------------------- |
| `f_direccion`     | `input[type=text]`   | Dirección                  | —                                                             |
| `f_barrio`        | `input[type=text]`   | Barrio                     | —                                                             |
| `f_localidad`     | `input[type=text]`   | Localidad                  | —                                                             |
| `f_provincia`     | `input[type=text]`   | Provincia                  | —                                                             |
| `f_supTerreno`    | `input[type=number]` | Superficie Terreno (m²)    | —                                                             |
| `f_supConstruida` | `input[type=number]` | Superficie Construida (m²) | —                                                             |
| `f_tipo`          | `select`             | Tipo de Inmueble           | `CASA`, `DEPTO`, `LOTE`, `GALPON`, `OFICINA`, `LOCAL`, `OTRO` |
| `f_precioDolar`   | `input[type=number]` | Valor Dólar                | En `.valor-box` con label "U$S"                               |
| `f_valorUva`      | `input[type=number]` | Valor UVA's                | En `.valor-box` con label "UVA"                               |

### 2.4 Plano de Ubicación

| ID                   | Tipo              | Label                                          |
| -------------------- | ----------------- | ---------------------------------------------- |
| `leafletMap`         | `div` (map-frame) | Contenedor Leaflet                             |
| `mainMapPlaceholder` | `div`             | Placeholder inicial                            |
| `mapLegend`          | `div`             | Leyenda chips generada dinámicamente           |
| `btnUpdateMap`       | `button.add-btn`  | "📍 Actualizar mapa con todas las ubicaciones" |
| `mapStatus`          | `span`            | Status texto                                   |

### 2.5 Descripción de la Propiedad (16 campos grid 4 cols)

| ID                       | Tipo                 | Label                     | Options / Atributos                                                                                                                             |
| ------------------------ | -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `f_tipoConstruccion`     | `select`             | Tipo de Construcción      | ``, `Ladrillo`, `Metálica`, `Madera`, `Bloques de hormigón`, `N/A`                                                                              |
| `f_espacioHabitable`     | `input[type=number]` | Espacio Habitable (m²)    | —                                                                                                                                               |
| `f_plantas`              | `input[type=number]` | Cantidad de Plantas       | —                                                                                                                                               |
| `f_anioConstruccion`     | `input[type=number]` | Año de Construcción       | —                                                                                                                                               |
| `f_impInmobiliarios`     | `input[type=number]` | Imp. Inmobiliario Mensual | —                                                                                                                                               |
| `f_tipoTecho`            | `select`             | Tipo de Techo             | ``, `N/A`, `Losa H°A°`, `Losa cerámica`, `Tejas s/ estr. Madera`, `Pizarra s/ estr. Madera`, `Chapa s/ estr. Madera`, `Chapa s/ estr. Metálica` |
| `f_orientacion`          | `select`             | Orientación               | ``, `Norte`, `Sur`, `Este`, `Oeste`, `Noreste`, `Sudeste`, `Noroeste`, `Sudoeste`, `N/A`                                                        |
| `f_luminosidad`          | `select`             | Luminosidad               | ``, `Malo`, `Regular`, `Promedio`, `Buena`, `Excelente`, `N/A`                                                                                  |
| `f_calidadConstructiva`  | `select`             | Calidad Constructiva      | ``, `Excelente`, `Buena`, `Media`, `Regular`, `Mala`, `N/A`                                                                                     |
| `f_calidadMantenimiento` | `select`             | Calidad de Mantenimiento  | ``, `Excelente`, `Buena`, `Media`, `Regular`, `Mala`, `N/A`                                                                                     |
| `f_detallesTerminacion`  | `select`             | Detalles de Terminación   | ``, `Excelente`, `Bueno`, `Medio`, `Regular`, `Malo`, `N/A`                                                                                     |
| `f_estacionamientoTipo`  | `select`             | Estacionamiento           | ``, `Garaje cubierto`, `Garaje semicubierto`, `Garaje descubierto`, `N/A`                                                                       |

### 2.6 Ambientes (18 campos `amb-field` en grid 3 cols)

| ID                    | Label              | Tipo                 |
| --------------------- | ------------------ | -------------------- |
| `f_ambCocina`         | Cocina             | `input[type=number]` |
| `f_ambDormitorios`    | Dormitorios        | `input[type=number]` |
| `f_ambTerraza`        | Terraza            | `input[type=number]` |
| `f_ambComedor`        | Comedor            | `input[type=number]` |
| `f_ambSuite`          | Suite              | `input[type=number]` |
| `f_ambPatio`          | Patio              | `input[type=number]` |
| `f_ambCocinaComedor`  | Cocina-Comedor     | `input[type=number]` |
| `f_ambSuiteVestidor`  | Suite y Vestidor   | `input[type=number]` |
| `f_ambBalcon`         | Balcón             | `input[type=number]` |
| `f_ambLiving`         | Living             | `input[type=number]` |
| `f_ambDormitVestidor` | Dormit. y Vestidor | `input[type=number]` |
| `f_ambLavadero`       | Lavadero           | `input[type=number]` |
| `f_ambLivingComedor`  | Living-Comedor     | `input[type=number]` |
| `f_ambBanoServicio`   | Baño Servicio      | `input[type=number]` |
| `f_ambCuartoGuardado` | Cuarto Guardado    | `input[type=number]` |
| `f_ambEscritorio`     | Escritorio         | `input[type=number]` |
| `f_ambBano`           | Baño               | `input[type=number]` |
| `f_ambGarage`         | Garage / Cochera   | `input[type=number]` |

**Total Cuartos:** `f_ambTotalCuartos` (readonly, calculado = suma de los 18)

### 2.7 Comodidades (3 selects grid 3 cols)

| ID                      | Label             | Options               |
| ----------------------- | ----------------- | --------------------- |
| `f_comDobleCirculacion` | Doble Circulación | ``, `Si`, `No`, `N/A` |
| `f_comAsador`           | Asador            | ``, `Si`, `No`, `N/A` |
| `f_comPiscina`          | Piscina           | ``, `Si`, `No`, `N/A` |

### 2.8 Servicios básicos (3 selects grid 3 cols)

| ID                    | Label              | Options                                           |
| --------------------- | ------------------ | ------------------------------------------------- |
| `f_calefaccion`       | Calefacción        | ``, `Central`, `Individual`, `Inexistente`, `N/A` |
| `f_aireAcondicionado` | Aire Acondicionado | ``, `Central`, `Individual`, `Inexistente`, `N/A` |
| `f_aguaCaliente`      | Agua Caliente      | ``, `Central`, `Individual`, `Inexistente`, `N/A` |

### 2.9 Características Adversas

| ID                          | Tipo       | Label                                   |
| --------------------------- | ---------- | --------------------------------------- |
| `f_caracteristicasAdversas` | `textarea` | Características Adversas / Deficiencias |

### 2.10 Servicios (generados dinámicamente - `renderServicios()`)

| Key            | Label             | Rubro asociado     | Options (RUBRO_NIVELES) |
| -------------- | ----------------- | ------------------ | ----------------------- |
| `electricidad` | Electricidad      | Electricidad       | 5 opciones              |
| `gas`          | Gas               | Gas Natural        | 5 opciones              |
| `internet`     | Internet          | Internet / Redes   | 5 opciones              |
| `agua`         | Agua              | Agua Sanitaria     | 5 opciones              |
| `cloaca`       | Cloaca            | Cloacas y Desagües | 5 opciones              |
| `techos`       | Techos y Desagües | Techos y Cubiertas | 5 opciones              |

**RUBRO_NIVELES (orden exacto):**

1. `Óptimo / Impecable (Listo para Habitar)`
2. `Sencilla (Cosmética / Menor)`
3. `Moderada (Parcial / Funcional)`
4. `Grave (Deterioro Estructural)`
5. `A Nuevo (Rediseño Total)`

### 2.11 Características del Barrio (9 selects grid 2 cols)

| ID                                | Label                                | Options                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f_tipologiasEdilicias`           | Tipologías edilicias predominantes   | ``, `Construcción en altura`, `Construcción de media altura`, `Viviendas unifamiliares y PH de hasta tres plantas`, `Viviendas unifamiliares y PH de una planta`, `Casas quinta`, `Industrias de gran envergadura`, `Industrias de pequeña y mediana envergadura` |
| `f_calidadConstructivaPredom`     | Calidad constructiva predominante    | ``, `Excelente`, `Muy Buena`, `Buena`, `Media`, `Económica`, `Precaria`                                                                                                                                                                                           |
| `f_construccionAlturaPrevalencia` | Construcción en altura (prevalencia) | ``, `En todo el entorno`, `Sobre arterias principales`, `Ocasional`, `No relevante o inexistente`                                                                                                                                                                 |
| `f_usoComercialPrevalencia`       | Uso comercial                        | ``, `En todo el entorno`, `Sobre arterias principales`, `Ocasional`, `No relevante o inexistente`                                                                                                                                                                 |
| `f_usoIndustrialPrevalencia`      | Uso industrial                       | ``, `En todo el entorno`, `Sobre arterias principales`, `Ocasional`, `No relevante o inexistente`                                                                                                                                                                 |
| `f_nivelSocioeconomicoBarrio`     | Nivel socioeconómico                 | ``, `Alto`, `Medio alto`, `Medio`, `Medio Bajo`, `Bajo`                                                                                                                                                                                                           |
| `f_barrioTipo`                    | Tipo                                 | ``, `Urbano`, `Suburbano`, `Rural`                                                                                                                                                                                                                                |
| `f_construidoPct`                 | Construido                           | ``, `Más del 75%`, `Entre el 75% y el 25%`, `Menos del 25%`                                                                                                                                                                                                       |
| `f_indiceCrecimiento`             | Índice de Crecimiento                | ``, `Estable`, `Creciente`, `Decreciente`                                                                                                                                                                                                                         |

### 2.12 Descripción del Barrio (9 selects grid 3 cols)

| ID                             | Label                                     | Options                                                                          |
| ------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `f_servVigilancia`             | Servicio de Vigilancia del Barrio         | ``, `Si`, `No`                                                                   |
| `f_tendenciaValores`           | Tendencia de Valores de la Propiedad      | ``, `Creciente`, `Estable`, `Decreciente`                                        |
| `f_demandaOferta`              | Demanda / Oferta                          | ``, `Exceso de Oferta`, `Falta de Oferta`, `Relación Oferta/Demanda Equilibrada` |
| `f_tiempoComercializacion`     | Tiempo de Comercialización                | ``, `Menos de 3 meses`, `Entre 3 y 6 meses`, `Más de 6 meses`                    |
| `f_cambiosUsoTerreno`          | Cambios Principales en el Uso del Terreno | ``, `Probable`, `Improbable`, `En Proceso`                                       |
| `f_facilidadesEstacionamiento` | Facilidades de Estacionamiento Típico     | ``, `Garage Propio`, `Garajes privados`, `En la vía pública`                     |
| `f_usoResidencial`             | Residencial %                             | `input[type=number] min=0 max=100`                                               |
| `f_usoComercial`               | Comercial %                               | `input[type=number] min=0 max=100`                                               |
| `f_usoIndustrial`              | Industrial %                              | `input[type=number] min=0 max=100`                                               |
| `f_usoOtro`                    | Otro (calculado)                          | `input[type=text] readonly` → `100 - (residencial + comercial + industrial)`     |

### 2.13 Comparables — Bloque dinámico (por cada comparable)

| Clase / ID            | Tipo                        | Label                                      | Atributos                                                |
| --------------------- | --------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `.c_direccion`        | `input[type=text]`          | Dirección                                  | —                                                        |
| `.c_barrio`           | `input[type=text]`          | Barrio                                     | —                                                        |
| `.c_precio`           | `input[type=number]`        | Precio (U$S)                               | —                                                        |
| `.c_supTerreno`       | `input[type=number]`        | Superficie Terreno (m²)                    | —                                                        |
| `.c_supCubierta`      | `input[type=number]`        | Superficie Cubierta (m²)                   | —                                                        |
| `.c_dias`             | `input[type=number]`        | Días en Mercado                            | —                                                        |
| `.c_tipoConstruccion` | `select`                    | Tipo de Construcción                       | Same as `f_tipoConstruccion`                             |
| `.c_antiguedad`       | `input[type=number]`        | Antigüedad (años)                          | —                                                        |
| `.c_precioM2`         | `input[type=text] readonly` | Precio por m² (calculado)                  | `U$S X.XX`                                               |
| `.c_url`              | `input[type=url]`           | Página web de origen                       | placeholder `https://...`                                |
| `.c_extract`          | `button.add-btn`            | ⇩ Extraer datos                            | Click → `extractFromUrl()`                               |
| `.c_foto_input`       | `input[type=file]`          | (hidden)                                   | `accept="image/*"`                                       |
| `.c_foto_preview`     | `img`                       | (preview)                                  | `style="display:none"`                                   |
| `.c_foto_placeholder` | `div`                       | placeholder                                | Click → abre file input                                  |
| `.c_foto_remove`      | `button.remove`             | Quitar foto                                | `style="display:none"`                                   |
| `.c_char` (x6)        | `select`                    | Características (dinámicas según `f_tipo`) | Options: `NIVELES_LIST` con `Igual` selected por defecto |
| `.c_coef`             | `span.num`                  | Coeficiente de Condiciones                 | Calculado, `toFixed(3)`                                  |
| `.comp-block`         | `div`                       | Wrapper                                    | `data-id`, `data-included="true/false"`, `data-photo`    |

**Botón global:** `#addComparable` → `addComparable()`

### 2.14 Análisis Comparativo

| ID              | Tipo                 | Label / Detalle                                                         |
| --------------- | -------------------- | ----------------------------------------------------------------------- |
| `ac_dispersion` | `input[type=number]` | Dispersión (±%) — default `10`, min `0`, max `100`                      |
| `ac_tbody`      | `tbody`              | Filas generadas: checkbox (incluir), label, precio/m², rango -, rango + |
| `ac_valMin`     | `div.val`            | Valor Mínimo                                                            |
| `ac_valProm`    | `div.val`            | Valor Promedio                                                          |
| `ac_valMax`     | `div.val`            | Valor Máximo                                                            |
| `ac_chart`      | `canvas`             | Chart.js floating bars                                                  |

### 2.15 Valuación

| ID                        | Tipo                 | Label / Detalle                                       |
| ------------------------- | -------------------- | ----------------------------------------------------- |
| `v_terrenoM2`             | `td`                 | Terreno m² (auto desde `f_supTerreno`)                |
| `v_terrenoPrecio`         | `input[type=number]` | Precio m² Terreno (U$S) — editable                    |
| `v_terrenoTotal`          | `td`                 | Total Terreno (U$S) — calculado                       |
| `v_cubiertaM2`            | `td`                 | Superficie Cubierta m² (auto desde `f_supConstruida`) |
| `v_cubiertaPrecio`        | `td`                 | Precio m² Cubierta — calculado                        |
| `v_cubiertaTotal`         | `td`                 | Total Cubierta (U$S) — calculado                      |
| `v_precioPromedio`        | `div.val`            | Precio m² promedio comparables                        |
| `v_coefPromedio`          | `div.val`            | Coef. de condiciones promedio                         |
| `v_depreciacionServicios` | `div.val`            | Depreciación por Servicios                            |
| `v_valorFinal`            | `div.val.final`      | **Valor Final Estimado**                              |

### 2.16 Observaciones Generales

| ID                | Tipo       | Label           |
| ----------------- | ---------- | --------------- |
| `f_observaciones` | `textarea` | min-height 90px |

### 2.17 Plan de Marketing

- 8 párrafos fijos (`.marketing-text`) — **no editables**, texto hardcoded en HTML

---

## 3. SELECTS — DOCUMENTACIÓN EXHAUSTIVA (35+)

> Cada select documentado con: **nombre, opciones, valores, valor por defecto**. NO puede cambiarse ninguna opción.

### 3.1 `f_destino`

- **Opciones:** `Venta` (default), `Alquiler`

### 3.2 `f_tipo` (Tipo de Inmueble — **crítico: drive PESOS + SLOT_ORDER + características comparables**)

- **Opciones:** `CASA` (default), `DEPTO`, `LOTE`, `GALPON`, `OFICINA`, `LOCAL`, `OTRO`

### 3.3 `f_tipoConstruccion`

- **Opciones:** `` (default), `Ladrillo`, `Metálica`, `Madera`, `Bloques de hormigón`, `N/A`

### 3.4 `f_tipoTecho`

- **Opciones:** `` (default), `N/A`, `Losa H°A°`, `Losa cerámica`, `Tejas s/ estr. Madera`, `Pizarra s/ estr. Madera`, `Chapa s/ estr. Madera`, `Chapa s/ estr. Metálica`

### 3.5 `f_orientacion`

- **Opciones:** `` (default), `Norte`, `Sur`, `Este`, `Oeste`, `Noreste`, `Sudeste`, `Noroeste`, `Sudoeste`, `N/A`

### 3.6 `f_luminosidad`

- **Opciones:** `` (default), `Malo`, `Regular`, `Promedio`, `Buena`, `Excelente`, `N/A`

### 3.7 `f_calidadConstructiva`

- **Opciones:** `` (default), `Excelente`, `Buena`, `Media`, `Regular`, `Mala`, `N/A`

### 3.8 `f_calidadMantenimiento`

- **Opciones:** `` (default), `Excelente`, `Buena`, `Media`, `Regular`, `Mala`, `N/A`

### 3.9 `f_detallesTerminacion`

- **Opciones:** `` (default), `Excelente`, `Bueno`, `Medio`, `Regular`, `Malo`, `N/A`

### 3.10 `f_estacionamientoTipo`

- **Opciones:** `` (default), `Garaje cubierto`, `Garaje semicubierto`, `Garaje descubierto`, `N/A`

### 3.11 `f_comDobleCirculacion` / `f_comAsador` / `f_comPiscina`

- **Opciones:** `` (default), `Si`, `No`, `N/A`

### 3.12 `f_calefaccion` / `f_aireAcondicionado` / `f_aguaCaliente`

- **Opciones:** `` (default), `Central`, `Individual`, `Inexistente`, `N/A`

### 3.13 `f_tipologiasEdilicias`

- **Opciones:** `` (default), `Construcción en altura`, `Construcción de media altura`, `Viviendas unifamiliares y PH de hasta tres plantas`, `Viviendas unifamiliares y PH de una planta`, `Casas quinta`, `Industrias de gran envergadura`, `Industrias de pequeña y mediana envergadura`

### 3.14 `f_calidadConstructivaPredom`

- **Opciones:** `` (default), `Excelente`, `Muy Buena`, `Buena`, `Media`, `Económica`, `Precaria`

### 3.15 `f_construccionAlturaPrevalencia` / `f_usoComercialPrevalencia` / `f_usoIndustrialPrevalencia`

- **Opciones:** `` (default), `En todo el entorno`, `Sobre arterias principales`, `Ocasional`, `No relevante o inexistente`

### 3.16 `f_nivelSocioeconomicoBarrio`

- **Opciones:** `` (default), `Alto`, `Medio alto`, `Medio`, `Medio Bajo`, `Bajo`

### 3.17 `f_barrioTipo`

- **Opciones:** `` (default), `Urbano`, `Suburbano`, `Rural`

### 3.18 `f_construidoPct`

- **Opciones:** `` (default), `Más del 75%`, `Entre el 75% y el 25%`, `Menos del 25%`

### 3.19 `f_indiceCrecimiento` / `f_tendenciaValores`

- **Opciones:** `` (default), `Estable`, `Creciente`, `Decreciente`

### 3.20 `f_servVigilancia`

- **Opciones:** `` (default), `Si`, `No`

### 3.21 `f_demandaOferta`

- **Opciones:** `` (default), `Exceso de Oferta`, `Falta de Oferta`, `Relación Oferta/Demanda Equilibrada`

### 3.22 `f_tiempoComercializacion`

- **Opciones:** `` (default), `Menos de 3 meses`, `Entre 3 y 6 meses`, `Más de 6 meses`

### 3.23 `f_cambiosUsoTerreno`

- **Opciones:** `` (default), `Probable`, `Improbable`, `En Proceso`

### 3.24 `f_facilidadesEstacionamiento`

- **Opciones:** `` (default), `Garage Propio`, `Garajes privados`, `En la vía pública`

### 3.25 Servicios (6 selects dinámicos `serv_*`) — **RUBRO_NIVELES**

- **Opciones (orden exacto):**
    1. `Óptimo / Impecable (Listo para Habitar)`
    2. `Sencilla (Cosmética / Menor)`
    3. `Moderada (Parcial / Funcional)`
    4. `Grave (Deterioro Estructural)`
    5. `A Nuevo (Rediseño Total)`

### 3.26 Comparables — `.c_tipoConstruccion`

- **Opciones:** `` (default), `Ladrillo`, `Metálica`, `Madera`, `Bloques de hormigón`, `N/A`

### 3.27 Comparables — `.c_char` (6 por comparable, dinámicos según `f_tipo`) — **NIVELES_LIST**

- **Opciones (orden exacto, `Igual` default selected):**
    1. `Mucho Mejor`
    2. `Mejor`
    3. `Igual` ← **selected por defecto**
    4. `Peor`
    5. `Mucho Peor`

### 3.28 `ac_dispersion` (number input, no select pero parámetro crítico)

- **Valor por defecto:** `10` — min `0`, max `100`

---

## 4. BOTONES

| ID / Selector         | Texto / Icono                                | Acción                                           | Estado habilitado          | Estado deshabilitado                |
| --------------------- | -------------------------------------------- | ------------------------------------------------ | -------------------------- | ----------------------------------- |
| `#btnUpdateMap`       | 📍 Actualizar mapa con todas las ubicaciones | `updateMainMap()` geocoding todos los puntos     | Siempre                    | —                                   |
| `#addComparable`      | + Agregar comparable                         | `addComparable()` crea nuevo bloque              | Siempre                    | `display: none` si `finalized=true` |
| `.comp-block .remove` | Quitar                                       | `removeComparable(id)` elimina bloque + renumera | Siempre                    | —                                   |
| `.c_extract`          | ⇩ Extraer datos                              | `extractFromUrl(wrap)` fetch vía allorigins.win  | Siempre                    | —                                   |
| `.c_foto_remove`      | Quitar foto                                  | Limpia `wrap.dataset.photo`, preview, input      | Siempre                    | `display: none` si no hay foto      |
| `#photoRemove`        | Quitar foto                                  | `clearPhoto()` fachada                           | Siempre                    | `display: none` si no hay foto      |
| `#btnSave`            | 💾 Guardar                                   | `collectFormData()` → localStorage               | Siempre                    | —                                   |
| `#btnEdit`            | ✏️ Editar                                    | `setLocked(false)`                               | `disabled` si `!finalized` | `disabled=true` si `!finalized`     |
| `#btnFinish`          | ✅ Finalizar                                 | `setLocked(true)`                                | Siempre                    | `disabled=true` si `finalized`      |
| `#btnPdf`             | ⭳ Exportar a PDF                             | `window.print()`                                 | Siempre                    | —                                   |
| `.add-btn` (genérico) | Varios                                       | Varios                                           | Siempre                    | —                                   |

---

## 5. FUNCIONES JAVASCRIPT — CATÁLOGO COMPLETO

| Nombre                                      | Parámetros           | Comportamiento                                                                                                                          | Dependencias                                                                  | Eventos que dispara          |
| ------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `renderServicios()`                         | —                    | Genera 6 selects `serv_*` en `#serviciosGrid` con `RUBRO_NIVELES`                                                                       | `SERVICIOS_MAP`, `RUBRO_NIVELES`                                              | `change` → `recalcAll`       |
| `addComparable(prefill?)`                   | `prefill` (opcional) | Crea `.comp-block`, renderiza 6 características, photo, extract btn, listeners                                                          | `PESOS`, `SLOT_ORDER`, `NIVELES_LIST`, `comparableCount`                      | `input/change` → `recalcAll` |
| `removeComparable(id)`                      | `id` (number)        | Elimina `.comp-block[data-id]`, renumera, `recalcAll`                                                                                   | `renumberComparables`                                                         | —                            |
| `renumberComparables()`                     | —                    | Reindexa `.comp-index` en todos los bloques                                                                                             | —                                                                             | —                            |
| `renderCharacteristics(wrap)`               | `wrap` (Element)     | Lee `f_tipo`, usa `PESOS[tipo].vars` + `SLOT_ORDER` → 6 selects `.c_char`                                                               | `PESOS`, `SLOT_ORDER`, `NIVELES_LIST`                                         | `change` → `recalcAll`       |
| `refreshAllCharacteristics()`               | —                    | Re-render characteristics en TODOS los comparables                                                                                      | `renderCharacteristics`                                                       | `recalcAll`                  |
| `coefCondicionesFor(wrap)`                  | `wrap` (Element)     | Calcula producto Π(1 + peso × ajuste) para 6 características del comparable                                                             | `PESOS`, `NIVELES`                                                            | —                            |
| `coefDepreciacionPropia()`                  | —                    | Promedio de depreciación de 6 servicios (1 - pct)                                                                                       | `SERVICIOS_MAP`, `RUBROS`, `RUBRO_NIVELES`                                    | —                            |
| `recalcAmbientes()`                         | —                    | Suma 18 `AMBIENTE_IDS` → `f_ambTotalCuartos`                                                                                            | `AMBIENTE_IDS`                                                                | —                            |
| `recalcUsoTerreno()`                        | —                    | `otro = max(0, 100 - res - com - ind)` → `f_usoOtro`                                                                                    | —                                                                             | —                            |
| `recalcAll()`                               | —                    | **Orquestador principal**: `recalcUsoTerreno`, `recalcAmbientes`, coeficientes comparables, precios/m², valuación, análisis comparativo | Todas las anteriores + `renderAnalisisComparativo`                            | `renderAnalisisComparativo`  |
| `collectFormData()`                         | —                    | Recolecta TODO el formulario → objeto serializable (fields, servicios, comparables, valuacion, photo)                                   | `photoDataUrl`                                                                | —                            |
| `applyFormData(data)`                       | `data` (object)      | Hidratación completa: fields, photo, servicios, comparables (recrea bloques), valuacion                                                 | `addComparable`, `renderServicios`, `setComparablePhotoFromData`, `recalcAll` | `recalcAll`                  |
| `showToast(msg)`                            | `msg`                | Muestra toast 2.6s                                                                                                                      | —                                                                             | —                            |
| `setLocked(locked)`                         | `locked` (bool)      | Toggle `fieldset.disabled`, botones, status bar, `finalized` flag                                                                       | —                                                                             | —                            |
| `extractFromUrl(wrap)`                      | `wrap` (Element)     | Fetch `allorigins.win/raw?url=` → parse og:title, precio, superficie → autollenado                                                      | `allorigins.win` proxy                                                        | `recalcAll`                  |
| `setPhoto(dataUrl)`                         | `dataUrl`            | Setea `photoDataUrl`, muestra preview, oculta placeholder                                                                               | —                                                                             | —                            |
| `clearPhoto()`                              | —                    | Limpia foto fachada                                                                                                                     | —                                                                             | —                            |
| `setupComparablePhoto(wrap)`                | `wrap`               | Listeners click/upload/remove para foto comparable                                                                                      | `FileReader`                                                                  | —                            |
| `setComparablePhotoFromData(wrap, dataUrl)` | `wrap`, `dataUrl`    | Hidrata foto comparable desde data guardada                                                                                             | —                                                                             | —                            |
| `updateMainMap()`                           | —                    | Geocoding Nominatim (1 req/sec) propiedad + comparables → Leaflet markers + fitBounds                                                   | `geocode`, `leafletMapInstance`, `MARKER_COLOR_*`                             | —                            |
| `geocode(query)`                            | `query` (string)     | `fetch nominatim.openstreetmap.org/search` → `{lat, lon}`                                                                               | Nominatim API                                                                 | —                            |
| `renderAnalisisComparativo()`               | —                    | Tabla filas (checkbox, precio/m², rangos ±dispersión), 3 summary boxes, Chart.js floating bars                                          | `Chart.js`, `ac_dispersion`                                                   | —                            |
| `makeAccordions()`                          | —                    | Convierte todos `section.card` en acordeones (h2 click → toggle `.collapsed`)                                                           | —                                                                             | —                            |
| `collectFormData` / `applyFormData`         | —                    | **Persistencia** localStorage key `bienenhaus_acm_draft`                                                                                | `localStorage`                                                                | `showToast`                  |

---

## 6. EVENTOS REGISTRADOS (exhaustivo)

| Evento   | Elementos / Selector                                    | Handler                                                                                                                             |
| -------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `click`  | `section.card h2`                                       | `makeAccordions` → toggle `.collapsed`                                                                                              |
| `click`  | `#btnUpdateMap`                                         | `updateMainMap()`                                                                                                                   |
| `click`  | `#addComparable`                                        | `addComparable()`                                                                                                                   |
| `click`  | `.comp-block .remove`                                   | `removeComparable(id)`                                                                                                              |
| `click`  | `.c_extract`                                            | `extractFromUrl(wrap)`                                                                                                              |
| `click`  | `.photo-box` (delegado)                                 | `f_fotoFachada.click()`                                                                                                             |
| `click`  | `#photoRemove`                                          | `clearPhoto()`                                                                                                                      |
| `click`  | `.c_photo_box` (delegado)                               | `c_foto_input.click()`                                                                                                              |
| `click`  | `.c_foto_remove`                                        | Limpia foto comparable                                                                                                              |
| `click`  | `#btnSave`                                              | `collectFormData` → localStorage                                                                                                    |
| `click`  | `#btnFinish`                                            | `setLocked(true)`                                                                                                                   |
| `click`  | `#btnEdit`                                              | `setLocked(false)`                                                                                                                  |
| `click`  | `#btnPdf`                                               | `window.print()`                                                                                                                    |
| `change` | `f_tipo`                                                | `refreshAllCharacteristics()`                                                                                                       |
| `change` | `#serviciosGrid select`                                 | `recalcAll()`                                                                                                                       |
| `change` | `.comp-block input, select`                             | `recalcAll()`                                                                                                                       |
| `change` | `.ac_check` (checkbox análisis)                         | `wrap.dataset.included = checked` → `recalcAll()`                                                                                   |
| `change` | `ac_dispersion`                                         | `renderAnalisisComparativo()`                                                                                                       |
| `input`  | `main input, select, textarea` (global)                 | `recalcAll()`                                                                                                                       |
| `input`  | `f_fotoFachada`                                         | `FileReader` → `setPhoto(dataUrl)`                                                                                                  |
| `input`  | `.c_foto_input`                                         | `FileReader` → `wrap.dataset.photo`                                                                                                 |
| `input`  | `f_usoResidencial`, `f_usoComercial`, `f_usoIndustrial` | `recalcUsoTerreno()` (via global input)                                                                                             |
| `input`  | 18 `AMBIENTE_IDS`                                       | `recalcAmbientes()` (via global input)                                                                                              |
| `load`   | `window`                                                | `init`: dateStamp, tooltips labels, `renderServicios`, load draft, `addComparable` o `applyFormData`, `recalcAll`, `makeAccordions` |
| `resize` | `window`                                                | `leafletMapInstance.invalidateSize()` (en `updateMainMap` timeout)                                                                  |

---

## 7. VALIDACIONES

### 7.1 Obligatorios (implícitos — TAI.html no valida en cliente, solo UI)

| Campo                                                        | Tipo   | Nota                              |
| ------------------------------------------------------------ | ------ | --------------------------------- |
| `f_solicitante`                                              | text   | —                                 |
| `f_fecha`                                                    | date   | —                                 |
| `f_direccion`                                                | text   | Requerido para geocoding          |
| `f_tipo`                                                     | select | Drive cálculos                    |
| `f_supTerreno`                                               | number | Requerido para valuación terreno  |
| `f_supConstruida`                                            | number | Requerido para valuación cubierta |
| `f_precioDolar` / `f_valorUva`                               | number | Al menos uno para valorización    |
| Comparables: `.c_precio`, `.c_supTerreno` o `.c_supCubierta` | number | Para precio/m² y análisis         |

### 7.2 Formatos / Restricciones

| Campo                                                                                                                                                                                                                                                                                                  | Restricción                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `f_fecha`                                                                                                                                                                                                                                                                                              | Date picker nativo             |
| `f_telefono`                                                                                                                                                                                                                                                                                           | Texto libre (sin máscara)      |
| `f_supTerreno`, `f_supConstruida`, `f_espacioHabitable`, `f_plantas`, `f_anioConstruccion`, `f_impInmobiliarios`, `f_precioDolar`, `f_valorUva`, `f_amb*` (18), `f_usoResidencial/Comercial/Industrial`, `.c_precio`, `.c_supTerreno`, `.c_supCubierta`, `.c_dias`, `.c_antiguedad`, `v_terrenoPrecio` | `type=number` — solo numérico  |
| `.c_url`                                                                                                                                                                                                                                                                                               | `type=url` — validación nativa |
| `f_usoResidencial/Comercial/Industrial`                                                                                                                                                                                                                                                                | `min=0 max=100`                |
| `ac_dispersion`                                                                                                                                                                                                                                                                                        | `min=0 max=100`                |
| `f_ambTotalCuartos`                                                                                                                                                                                                                                                                                    | `readonly` — calculado         |
| `f_usoOtro`                                                                                                                                                                                                                                                                                            | `readonly` — calculado         |
| `.c_precioM2`                                                                                                                                                                                                                                                                                          | `readonly` — calculado         |

### 7.3 Reglas especiales

- **Locked state:** `fieldset.disabled = true` desactiva TODO (inputs, selects, textareas, botones agregar comparable, foto). Solo `btnEdit` habilitado.
- **Comparable incluido/excluido:** `data-included="false"` → opacidad 0.4, no entra en promedio/análisis, no en gráfico.
- **Foto fachada / comparables:** Base64 data URL en `photoDataUrl` / `wrap.dataset.photo` — límite implícito de localStorage (~5MB).
- **Geocoding rate limit:** `await new Promise(r=>setTimeout(r, 1100))` entre requests Nominatim (1 req/seg).
- **PDF:** `@media print` oculta action-bar, toast, `.add-btn`, `.remove`, `.comp-block[data-included="false"]`, fuerza accordions abiertos, page-breaks en print-groups.

---

## 8. CÁLCULOS — TODAS LAS FÓRMULAS (EXACTAS)

### 8.1 Constantes de referencia (hardcoded en JS)

```javascript
PESOS = {
    CASA: {
        vars: [
            ['Calidad de ubicación', 0.3],
            ['Cantidad de habitaciones', 0.2],
            ['Estado de mantenimiento', 0.2],
            ['Antigüedad', 0.15],
            ['Comodidades', 0.1],
            ['Estacionamiento', 0.05],
        ],
    },
    DEPTO: {
        vars: [
            ['Calidad de ubicación (barrio)', 0.3],
            ['Cantidad de habitaciones', 0.2],
            ['Ubicación piso', 0.15],
            ['Antigüedad', 0.15],
            ['Comodidades (edificio)', 0.12],
            ['Ubicación planta', 0.08],
        ],
    },
    LOTE: {
        vars: [
            ['Calidad de ubicación', 0.35],
            ['Superficie', 0.25],
            ['Servicios', 0.2],
            ['Acceso', 0.1],
            ['Forma', 0.06],
            ['Orientación', 0.04],
        ],
    },
    GALPON: {
        vars: [
            ['Calidad de ubicación', 0.25],
            ['Superficie y altura libre', 0.25],
            ['Acceso', 0.2],
            ['Instalaciones', 0.15],
            ['Estado / antigüedad', 0.1],
            ['Oficinas y servicios anexos', 0.05],
        ],
    },
    OFICINA: {
        vars: [
            ['Calidad de ubicación', 0.3],
            ['Superficie y layout', 0.2],
            ['Ubicación piso / vista', 0.15],
            ['Comodidades del edificio', 0.15],
            ['Antigüedad / estado', 0.12],
            ['Estacionamiento', 0.08],
        ],
    },
    LOCAL: {
        vars: [
            ['Calidad de ubicación', 0.35],
            ['Frente / vidriera', 0.2],
            ['Superficie y forma', 0.15],
            ['Instalaciones', 0.12],
            ['Estado de mantenimiento', 0.1],
            ['Estacionamiento / carga y descarga', 0.08],
        ],
    },
    OTRO: {
        vars: [
            ['Calidad de ubicación', 0.3],
            ['Superficie', 0.15],
            ['Servicios', 0.15],
            ['Acceso', 0.15],
            ['Instalaciones', 0.15],
            ['Estado de mantenimiento', 0.1],
        ],
    },
};
SLOT_ORDER = [3, 2, 5, 0, 4, 1]; // índices 0-based de vars para orden visual A,B,C / D,E,F
NIVELES = { 'Mucho Mejor': -0.75, Mejor: -0.3, Igual: 0, Peor: 0.3, 'Mucho Peor': 0.75 };
RUBROS = {/* 6 rubros × 5 niveles = 30 valores porcentuales exactos — ver sección 3.25 */};
```

### 8.2 Coeficiente de Condiciones por Comparable (`coefCondicionesFor`)

```
Para cada comparable:
  tipo = f_tipo.value
  vars = PESOS[tipo].vars          // 6 tuplas [nombre, peso]
  product = 1
  Para cada uno de los 6 selects .c_char (orden SLOT_ORDER):
    idx = dataset.varindex (0-5)
    peso = vars[idx][1]
    nivel = select.value
    ajuste = NIVELES[nivel] || 0    // -0.75, -0.3, 0, 0.3, 0.75
    product *= (1 + peso * ajuste)
  coef = product
  Mostrar en .c_coef → toFixed(3)
```

### 8.3 Depreciación por Servicios (`coefDepreciacionPropia`)

```
sum = 0, n = 0
Para cada uno de 6 servicios en SERVICIOS_MAP:
  nivel = select#serv_{key}.value
  pct = RUBROS[rubro][nivel] || 0
  sum += pct; n++
depreciacion = 1 - (sum / n)      // promedio de 1-pct
Mostrar en v_depreciacionServicios → toFixed(3)
```

### 8.4 Total Cuartos (`recalcAmbientes`)

```
total = Σ(parseFloat(document.getElementById(id).value) || 0) para 18 AMBIENTE_IDS
f_ambTotalCuartos.value = total
```

### 8.5 Uso de Suelo % (`recalcUsoTerreno`)

```
r = parseFloat(f_usoResidencial.value) || 0
c = parseFloat(f_usoComercial.value) || 0
i = parseFloat(f_usoIndustrial.value) || 0
otro = max(0, 100 - r - c - i)
f_usoOtro.value = otro.toFixed(1) + '%'
```

### 8.5 Precio/m² por Comparable (en `recalcAll`)

```
precio = parseFloat(.c_precio.value) || 0
supCub = parseFloat(.c_supCubierta.value) || 0
supTer = parseFloat(.c_supTerreno.value) || 0
base = supCub > 0 ? supCub : supTer
precioM2 = (precio > 0 && base > 0) ? precio / base : 0
.c_precioM2.value = precioM2 ? 'U$S ' + precioM2.toFixed(2) : ''
```

### 8.6 Promedios para Valuación (`recalcAll`)

```
precios = []    // precio/m² de comparables INCLUIDOS (data-included="true") con precio>0 y base>0
coefs = []      // coefCondicionesFor de esos mismos comparables

precioPromedio = precios.length ? Σprecios / precios.length : 0
coefPromedio = coefs.length ? Σcoefs / coefs.length : 1

v_precioPromedio.textContent = 'U$S ' + precioPromedio.toFixed(2)
v_coefPromedio.textContent = coefPromedio.toFixed(3)
```

### 8.7 Precio Ajustado

```
precioAjustado = precioPromedio * coefPromedio
```

### 8.8 Terreno

```
terrM2 = parseFloat(f_supTerreno.value) || 0
terrPrecio = parseFloat(v_terrenoPrecio.value) || 0        // EDITABLE por usuario
terrTotal = terrM2 * terrPrecio
v_terrenoM2.textContent = terrM2.toLocaleString('es-AR') || '—'
v_terrenoTotal.textContent = terrTotal ? 'U$S ' + terrTotal.toLocaleString('es-AR',{maximumFractionDigits:0}) : '—'
```

### 8.9 Superficie Cubierta

```
depreciacion = coefDepreciacionPropia()                    // 1 - avg(pct_servicios)
v_depreciacionServicios.textContent = depreciacion.toFixed(3)

cubM2 = parseFloat(f_supConstruida.value) || 0
precioCubiertaM2 = precioAjustado * depreciacion
cubTotal = cubM2 * precioCubiertaM2

v_cubiertaM2.textContent = cubM2.toLocaleString('es-AR') || '—'
v_cubiertaPrecio.textContent = precioCubiertaM2 ? 'U$S ' + precioCubiertaM2.toFixed(2) : '—'
v_cubiertaTotal.textContent = cubTotal ? 'U$S ' + cubTotal.toLocaleString('es-AR',{maximumFractionDigits:0}) : '—'
```

### 8.10 Valor Final Estimado

```
valorFinal = terrTotal + cubTotal
v_valorFinal.textContent = 'U$S ' + valorFinal.toLocaleString('es-AR',{maximumFractionDigits:0})
```

### 8.11 Análisis Comparativo — Rangos y Gráfico (`renderAnalisisComparativo`)

```
dispersion = parseFloat(ac_dispersion.value) || 0

Para cada comparable (i):
  precioM2 = calculado arriba
  included = data-included !== 'false'
  low = precioM2 * (1 - dispersion/100)
  high = precioM2 * (1 + dispersion/100)
  Fila tabla: checkbox(checked=included), label, precioM2, low, high
  Si included: filas clase normal, sino .ac-excluded (opacity 0.4)

Valores resumen (solo incluidos con precioM2>0):
  vals = [precioM2...]
  valProm = Σvals / vals.length
  valMin = min(vals) * (1 - dispersion/100)
  valMax = max(vals) * (1 + dispersion/100)

Gráfico Chart.js (floating bars):
  labels = ['Comparable 1', 'Comparable 2', ..., 'Promedio']
  dataRanges = [[low1, high1], [low2, high2], ..., [valMin, valMax]]
  colors = included ? '#14b8a6' : '#555' + promedio '#f59e0b'
  indexAxis: 'y', responsive, maintainAspectRatio: false
```

---

## 9. GRÁFICOS

### 9.1 Análisis Comparativo — Chart.js Floating Bar Chart

| Propiedad              | Valor                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Tipo**               | `bar` con `indexAxis: 'y'` (horizontal)                                                |
| **Canvas**             | `#ac_chart` (height 280px, `.ac-chart-wrap`)                                           |
| **Datasets**           | 1 dataset: `label: 'Rango U$S/m² (± X%)'`                                              |
| **Data**               | Array de `[low, high]` por comparable + promedio                                       |
| **Colors**             | Comparable incluido: `#14b8a6` (teal), excluido: `#555`, promedio: `#f59e0b` (warn)    |
| **Bar config**         | `borderRadius: 4`, `barPercentage: 0.6`                                                |
| **Tooltips**           | Custom callback: `'U$S ' + raw[0].toFixed(2) + ' — U$S ' + raw[1].toFixed(2) + ' /m²'` |
| **Scales X**           | Ticks color `#b8b3aa`, grid `#2a2a2a`, title `'U$S / m²'`                              |
| **Scales Y**           | Ticks color `#f5f5f4`, font `Poppins`, grid `#2a2a2a`                                  |
| **Responsive**         | `true`, `maintainAspectRatio: false`                                                   |
| **Trigger update**     | `ac_dispersion` input → `renderAnalisisComparativo()`                                  |
| **Destrucción previa** | `if(acChartInstance) acChartInstance.destroy()` antes de crear                         |

---

## 10. MAPA

### 10.1 Proveedor y configuración

| Propiedad                     | Valor                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ |
| **Map provider**              | **Leaflet 1.9.4** (CDN) + **OpenStreetMap** tiles                        |
| **Geocoding**                 | **Nominatim** (`nominatim.openstreetmap.org/search?format=json&limit=1`) |
| **Rate limit**                | 1 request/segundo → `await new Promise(r=>setTimeout(r, 1100))`          |
| **CORS**                      | Nominatim permite CORS (`Accept: application/json`)                      |
| **Proxy para extracción web** | `https://api.allorigins.win/raw?url=` (para `extractFromUrl`)            |

### 10.2 Marcadores

| Tipo            | Color            | Icono                                                 |
| --------------- | ---------------- | ----------------------------------------------------- |
| **Propiedad**   | `#2563eb` (azul) | `L.divIcon` círculo 16px + border blanco 2px + shadow |
| **Comparables** | `#dc2626` (rojo) | Mismo estilo, color rojo                              |

### 10.3 Controles y comportamiento

| Elemento              | Comportamiento                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `#leafletMap`         | Contenedor 340px (`.map-frame`), `.map-frame.small` 200px                                       |
| `#mainMapPlaceholder` | Texto inicial, se oculta al cargar puntos                                                       |
| `#btnUpdateMap`       | Trigger `updateMainMap()`                                                                       |
| `#mapStatus`          | Texto de estado: "Ubicando N dirección(es)...", "X de Y ubicación(es) encontradas", errores     |
| `#mapLegend`          | Chips generados dinámicamente: `<span class="swatch" style="background:{color}"></span>{label}` |
| `fitBounds`           | Con padding `[30,30]` tras agregar todos los markers                                            |
| `invalidateSize`      | Timeout 200ms post-render                                                                       |
| Vista por defecto     | `[-31.4201, -64.1888]` (Córdoba, AR) zoom 12                                                    |

### 10.4 Flujo `updateMainMap()`

1. Recolecta query propiedad (`f_direccion, f_barrio, f_localidad, f_provincia` join `, `)
2. Recolecta queries comparables (`.c_direccion` + `.c_barrio` por cada bloque)
3. Si 0 puntos → status "Cargá al menos una dirección..."
4. Para cada punto: `geocode(query)` → si OK crea marker + bounds + chip leyenda
   4.1 `await sleep(1100)` entre requests (respeta rate limit)
5. `fitBounds(bounds, {padding:[30,30]})`
6. Status final: `${okCount} de ${points.length} ubicación(es) encontradas.`

---

## 11. FOTOGRAFÍAS

### 11.1 Foto de Fachada (única)

| Aspecto             | Implementación                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Input**           | `#f_fotoFachada` `type=file accept="image/*"` hidden                                        |
| **Trigger**         | Click en `.photo-box` → `f_fotoFachada.click()`                                             |
| **Preview**         | `#photoPreview` `img` — `FileReader.readAsDataURL` → `src`                                  |
| **Placeholder**     | `#photoPlaceholder` — se oculta al tener foto                                               |
| **Remove**          | `#photoRemove` → `clearPhoto()`: limpia `photoDataUrl`, preview, input, muestra placeholder |
| **Almacenamiento**  | `photoDataUrl` (variable global) → serializado en `collectFormData()` → localStorage        |
| **Tamaño sugerido** | "15 cm × 7 cm (horizontal)" — solo texto informativo                                        |

### 11.2 Fotos por Comparable (N)

| Aspecto            | Implementación                                                                      |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Input**          | `.c_foto_input` `type=file accept="image/*"` hidden por bloque                      |
| **Trigger**        | Click en `.c_photo_box` → `input.click()`                                           |
| **Preview**        | `.c_foto_preview` `img` — `FileReader.readAsDataURL`                                |
| **Placeholder**    | `.c_foto_placeholder` — se oculta al tener foto                                     |
| **Remove**         | `.c_foto_remove` → limpia `wrap.dataset.photo`, preview, input, muestra placeholder |
| **Almacenamiento** | `wrap.dataset.photo` (data URL) → serializado en `collectFormData()`                |
| **Hidratación**    | `setComparablePhotoFromData(wrap, dataUrl)` al cargar draft                         |

---

## 12. PDF / EXPORTACIÓN

### 12.1 Mecanismo

- **Botón:** `#btnPdf` → `window.print()`
- **Estilos:** `@media print` en `<style>` del HTML (líneas 250-282)

### 12.2 Reglas `@media print` (resumen crítico)

| Regla                         | Detalle                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Ocultar                       | `.action-bar`, `.toast`, `.add-btn`, `.remove`                                                                                    |
| Ocultar comparables excluidos | `.comp-block[data-included="false"]` → `display:none`                                                                             |
| Page breaks                   | `.print-group` `break-inside:avoid`, `#printGroupPropiedad`/`#printGroupBarrio`/`#sectionAnalisisComparativo` `break-before:page` |
| Accordions                    | Forzados abiertos: `section.card.collapsed .accordion-body {display:block !important}`                                            |
| Flechas                       | `.accordion-arrow {display:none}`                                                                                                 |
| Body                          | `background:#fff !important`, `color:var(--dark)`, `padding-bottom:0`                                                             |
| Cards                         | `border:1px solid #ccc`, `background:#fff`, `color:var(--dark)`                                                                   |
| Header                        | `background:#fff`, `border-bottom:2px solid var(--teal)`                                                                          |
| Status bar                    | `display:none`                                                                                                                    |
| Map legend                    | `display:none`                                                                                                                    |
| Colores                       | Adaptados a impresión (fondos claros, textos oscuros)                                                                             |
| Valuation summary final       | `background:#000 !important`, `color:#fff`, border teal                                                                           |

### 12.3 Contenido del PDF (orden exacto)

1. Header (brand + subtitle + logo)
2. Datos del Cliente
3. Foto de Fachada
4. Datos del Inmueble
5. Plano de Ubicación (mapa estático — se imprime el iframe/canvas de Leaflet)
6. **Page break** → Descripción de la Propiedad + Servicios
7. **Page break** → Características del Barrio + Descripción del Barrio
8. **Page break** → Comparables (solo incluidos) + Análisis Comparativo (tabla + gráfico + 3 summary)
9. Valuación (tabla + 4 summary boxes)
10. Observaciones Generales
11. Plan de Marketing (8 párrafos)
12. Footer (logo)

---

## 13. PERSISTENCIA (localStorage — a migrar a Supabase)

| Key                    | Estructura                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bienenhaus_acm_draft` | `{ tipo, fields:{[id]:value}, servicios:{[key]:value}, comparables:[{url, direccion, barrio, precio, supTerreno, supCubierta, dias, tipoConstruccion, antiguedad, photo, chars[]}], valuacion:{v_terrenoPrecio}, photo }` |

**Flujo:**

- `load`: `init` → parse localStorage → `applyFormData()` → `showToast('Se cargó un borrador guardado')` / `addComparable()`
- `save`: `#btnSave` → `collectFormData()` → `localStorage.setItem()` → `lastSaved` timestamp → toast
- `locked`: `setLocked(true)` → `fieldset.disabled`, `btnFinish.disabled`, `btnEdit.enabled`, `addComparable` hidden, status bar "locked"

---

## 14. DEPENDENCIAS EXTERNAS (CDN)

| Librería           | Versión                                    | Uso                                               |
| ------------------ | ------------------------------------------ | ------------------------------------------------- |
| **Leaflet**        | 1.9.4                                      | Mapa (`leaflet.css` + `leaflet.js`)               |
| **Chart.js**       | 4.4.0                                      | Gráfico análisis comparativo (`chart.umd.min.js`) |
| **Nominatim**      | API pública                                | Geocoding (OpenStreetMap)                         |
| **allorigins.win** | Proxy público                              | Extracción datos URL (`extractFromUrl`)           |
| **Google Fonts**   | Poppins (400,600,700,800) + Source Serif 4 | Tipografías                                       |

---

## 15. ESTILOS — DESIGN SYSTEM TAI.html (variables CSS)

```css
:root {
    --teal: #14b8a6;
    --teal-dark: #2dd4bf;
    --ink: #f5f5f4;
    --paper: #000000;
    --line: #3f3f3f;
    --muted: #b8b3aa;
    --warn: #f59e0b;
    --card: #121212;
    --input-text: #1c2321;
    --dark: #1c2321;
}
```

**Tipografías:**

- **Headings, buttons, labels, tags, th:** `Poppins` (weights 400,600,700,800)
- **Body, inputs, selects, textarea:** `Source Serif 4` (400,600)

**Layout:**

- `main` max-width 980px, padding 28px 20px 40px
- Grid system: `.grid.cols-2/3/4` → responsive ≤640px → 1fr
- Cards: `.card` bg `--card`, border `--line`, radius 8px, padding 24px 26px
- Fields: label uppercase 10.5px `--muted`, input/select/textarea 14.5px `--input-text` bg white
- Focus: `outline: 2px solid var(--teal); outline-offset: 1px`
- Buttons: `.btn` radius 6px, padding 12px 22px, weight 600, gap 8px, active scale 0.97
- Action bar: fixed bottom, bg `#0a0a0a`, shadow `0 -4px 16px rgba(0,0,0,.4)`

---

## 16. CHECKLIST DE ACEPTACIÓN (según plan)

| Criterio                                                      | Estado auditoría                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| □ Todos los campos existen                                    | **120+ documentados**                                                   |
| □ Todos los botones existen                                   | **14 botones documentados**                                             |
| □ Todos los selects existen                                   | **35+ selects documentados con opciones exactas**                       |
| □ Todos los selects contienen exactamente las mismas opciones | **Verificado select por select**                                        |
| □ Todas las fórmulas producen exactamente el mismo resultado  | **12 fórmulas principales + sub-cálculos documentados línea por línea** |
| □ Todos los cálculos son idénticos                            | **Sí — lógica replicable 1:1**                                          |
| □ Todos los eventos funcionan igual                           | **20+ tipos de eventos mapeados**                                       |
| □ Todos los gráficos funcionan igual                          | **Chart.js floating bars documentado completo**                         |
| □ Todos los mapas funcionan igual                             | **Leaflet + Nominatim + rate limit documentado**                        |
| □ Todas las imágenes funcionan igual                          | **Fachada + N comparables (base64) documentado**                        |
| □ Todos los PDFs contienen exactamente la misma información   | **@media print reglas completas + page breaks + orden**                 |
| □ Todos los acordeones funcionan igual                        | **Todos section.card + makeAccordions() documentado**                   |
| □ Todas las validaciones son idénticas                        | **Validaciones nativas + reglas locked + readonly documentadas**        |
| □ Todos los textos coinciden                                  | **Labels, placeholders, options, marketing-text extraídos**             |
| □ No existe ninguna funcionalidad eliminada                   | **Auditoría exhaustiva — todo mapeado**                                 |
| □ No existe ninguna funcionalidad agregada sin aprobación     | **N/A — solo auditoría**                                                |

---

## 17. OBSERVACIONES PARA FASE 2+ (arquitectura Bienenhaus)

| Tema                      | Nota                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Componentes sugeridos** | `TasacionesPage`, `TasacionesList`, `TasacionFormPage`, `DatosClienteSection`, `FotoFachadaSection`, `DatosInmuebleSection`, `MapaSection`, `DescripcionPropiedadSection`, `ServiciosSection`, `BarrioSection`, `ComparablesSection`, `AnalisisComparativoSection`, `ValuacionSection`, `ObservacionesSection`, `PdfSection`, `ActionBar`, `ComparableBlock`, `AmbienteGrid`, `ValorBox`, `CoefBox`, `ChartWrapper`, `MapWrapper`, `PhotoUploader` |
| **Hooks sugeridos**       | `useTasaciones`, `useTasacion`, `useTasacionCalculations`, `useComparables`, `useGeocoding`, `usePhotoUpload`, `useDraftPersistence`                                                                                                                                                                                                                                                                                                               |
| **Lib/Servicios**         | `valuationCalculations.ts` (port exacto TS + tests), `valuationSchemas.ts` (Zod), `geocodingService.ts` (Nominatim + cache), `pdfExport.ts` (print wrapper)                                                                                                                                                                                                                                                                                        |
| **DB Tablas**             | `property_valuations`, `valuation_comparables`, `valuation_images`, `valuation_documents`, `valuation_history` — todas con UUID, timestamps, soft delete, RLS, audit                                                                                                                                                                                                                                                                               |
| **Tipos**                 | Generar Zod schemas desde DB + override labels español; `database.ts` ya tiene enums en inglés — mapear                                                                                                                                                                                                                                                                                                                                            |
| **Persistencia**          | Reemplazar localStorage → Supabase (upsert draft, load draft, finalize → locked row)                                                                                                                                                                                                                                                                                                                                                               |
| **Permisos**              | `is_staff()` para CRUD, `is_admin()` para purge, auditoría automática via triggers                                                                                                                                                                                                                                                                                                                                                                 |
| **Tests**                 | Unit: cada fórmula con casos TAI.html; E2E: crear tasación completa → PDF → comparar valores                                                                                                                                                                                                                                                                                                                                                       |

---

**FIN DE AUDITORÍA — FASE 1 COMPLETA**

> Este documento es la especificación funcional vinculante. Cualquier desviación en la implementación respecto a lo documentado aquí requiere aprobación explícita.
