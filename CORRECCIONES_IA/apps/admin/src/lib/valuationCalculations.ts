// ============================================================================
// valuationCalculations.ts — 14 fórmulas puras (port 1:1 de TAI.html)
// Sin side effects, testables unitariamente
// Implementación completa (Fase 3) — ver audit.md §8
// ============================================================================

import type {
  Ambientes,
  Comparable,
  Servicios,
  TipoInmueble,
  ValuacionCalculadaFormValues,
  ValuacionFormValues
} from '../types/valuationTypes';

import {
  AMBIENTE_IDS,
  NIVELES,
  PESOS,
  RUBROS,
  SERVICIOS_MAP,
  SLOT_ORDER
} from '../schemas/valuationSchemas';

// ============================================================================
// Helpers internos (mismos criterios que TAI.html recalcAll)
// ============================================================================

function baseSuperficie(comparable: Comparable): number {
  const supCub = comparable.supCubierta || 0;
  const supTer = comparable.supTerreno || 0;
  return supCub > 0 ? supCub : supTer;
}

function esComparableValido(comparable: Comparable): boolean {
  return (
    comparable.included !== false &&
    (comparable.precio || 0) > 0 &&
    baseSuperficie(comparable) > 0
  );
}

// ============================================================================
// 1. coefCondicionesFor — Coeficiente de Condiciones por Comparable
// ============================================================================

/**
 * Calcula el coeficiente de condiciones para UN comparable.
 *
 * FÓRMULA TAI.html (líneas 876-888):
 * ```
 * tipo = f_tipo.value
 * vars = PESOS[tipo].vars          // 6 tuplas [nombre, peso]
 * product = 1
 * Para cada uno de los 6 selects .c_char (orden SLOT_ORDER):
 *   idx = dataset.varindex (0-5)
 *   peso = vars[idx][1]
 *   nivel = select.value
 *   ajuste = NIVELES[nivel] || 0    // -0.75, -0.3, 0, 0.3, 0.75
 *   product *= (1 + peso * ajuste)
 * coef = product
 * ```
 *
 * `chars[i]` es el valor del select en posición visual i; el select i
 * corresponde a la variable `SLOT_ORDER[i]` (igual que en TAI.html).
 *
 * @param comparable - Objeto comparable con `chars[6]` (valores NivelesComparacion)
 * @param tipoInmueble - Tipo de inmueble principal (drive PESOS)
 * @returns Coeficiente de condiciones (ej: 1.023, 0.987, etc.)
 *
 * @example
 * ```ts
 * const comp = { chars: ['Igual', 'Mejor', 'Igual', 'Peor', 'Igual', 'Mucho Mejor'] };
 * coefCondicionesFor(comp, 'CASA'); // → 0.87091 (CASA, SLOT_ORDER)
 * ```
 */
export function coefCondicionesFor(
  comparable: Comparable,
  tipoInmueble: TipoInmueble
): number {
  const vars = PESOS[tipoInmueble]?.vars;
  if (!vars) return 1;
  let product = 1;
  for (let i = 0; i < SLOT_ORDER.length; i++) {
    const idx = SLOT_ORDER[i];
    const peso = vars[idx][1];
    const nivel = comparable.chars[i];
    const ajuste = nivel ? NIVELES[nivel] : 0;
    product *= 1 + peso * ajuste;
  }
  return product;
}

// ============================================================================
// 2. coefDepreciacionPropia — Depreciación por Servicios (promedio 6 rubros)
// ============================================================================

/**
 * Calcula la depreciación propia promedio de los 6 servicios.
 *
 * FÓRMULA TAI.html (líneas 890-899):
 * ```
 * sum = 0, n = 0
 * Para cada uno de 6 servicios en SERVICIOS_MAP:
 *   nivel = select#serv_{key}.value
 *   pct = RUBROS[rubro][nivel] || 0
 *   sum += pct; n++
 * depreciacion = 1 - (sum / n)      // promedio de 1-pct
 * ```
 *
 * @param servicios - Objeto con 6 claves (electricidad, gas, internet, agua, cloaca, techos)
 *                    valores = RubroNivelEnum
 * @returns Factor de depreciación (ej: 0.985, 0.923, etc.)
 *
 * @example
 * ```ts
 * const serv = { electricidad: 'Óptimo...', gas: 'Sencilla...', ... };
 * coefDepreciacionPropia(serv); // → 0.987 (aprox)
 * ```
 */
export function coefDepreciacionPropia(servicios: Servicios): number {
  let sum = 0;
  let n = 0;
  for (const servicio of SERVICIOS_MAP) {
    const nivel = servicios[servicio.key];
    const rubro = RUBROS[servicio.rubro];
    const pct = nivel && rubro[nivel] !== undefined ? rubro[nivel] : 0;
    sum += pct;
    n++;
  }
  return n > 0 ? 1 - sum / n : 1;
}

// ============================================================================
// 3. recalcAmbientes — Total Cuartos (suma 18 campos)
// ============================================================================

/**
 * Suma los 18 campos de ambientes → Total Cuartos.
 *
 * FÓRMULA TAI.html (líneas 901-911):
 * ```
 * total = Σ(parseFloat(document.getElementById(id).value) || 0) para 18 AMBIENTE_IDS
 * f_ambTotalCuartos.value = total
 * ```
 *
 * @param ambientes - Objeto con 18 claves numéricas (f_ambCocina, f_ambDormitorios, ...)
 * @returns Total de cuartos (entero)
 *
 * @example
 * ```ts
 * const amb = { f_ambCocina: 1, f_ambDormitorios: 3, ... };
 * recalcAmbientes(amb); // → 8
 * ```
 */
export function recalcAmbientes(ambientes: Ambientes): number {
  let total = 0;
  for (const id of AMBIENTE_IDS) {
    total += ambientes[id] ?? 0;
  }
  return total;
}

// ============================================================================
// 4. recalcUsoTerreno — % Uso de Suelo "Otro" (calculado)
// ============================================================================

/**
 * Calcula el % "Otro" = max(0, 100 - residencial - comercial - industrial).
 *
 * FÓRMULA TAI.html (líneas 913-919):
 * ```
 * r = parseFloat(f_usoResidencial.value) || 0
 * c = parseFloat(f_usoComercial.value) || 0
 * i = parseFloat(f_usoIndustrial.value) || 0
 * otro = max(0, 100 - r - c - i)
 * f_usoOtro.value = otro.toFixed(1) + '%'
 * ```
 *
 * @param uso - Objeto con residencial, comercial, industrial (números 0-100)
 * @returns Porcentaje "Otro" (número, ej: 15.5)
 *
 * @example
 * ```ts
 * recalcUsoTerreno({ residencial: 60, comercial: 20, industrial: 10 }); // → 10
 * ```
 */
export function recalcUsoTerreno(uso: {
  residencial: number;
  comercial: number;
  industrial: number;
}): number {
  const r = uso.residencial || 0;
  const c = uso.comercial || 0;
  const i = uso.industrial || 0;
  return Math.max(0, 100 - r - c - i);
}

// ============================================================================
// 5. precioM2Comparable — Precio/m² por Comparable
// ============================================================================

/**
 * Calcula precio/m² de un comparable (base = supCubierta > 0 ? supCubierta : supTerreno).
 *
 * FÓRMULA TAI.html (líneas 927-935 en recalcAll):
 * ```
 * precio = parseFloat(.c_precio.value) || 0
 * supCub = parseFloat(.c_supCubierta.value) || 0
 * supTer = parseFloat(.c_supTerreno.value) || 0
 * base = supCub > 0 ? supCub : supTer
 * precioM2 = (precio > 0 && base > 0) ? precio / base : 0
 * .c_precioM2.value = precioM2 ? 'U$S ' + precioM2.toFixed(2) : ''
 * ```
 *
 * @param comparable - Objeto comparable con precio, supCubierta, supTerreno
 * @returns Precio por m² (número, 0 si no calculable)
 *
 * @example
 * ```ts
 * const comp = { precio: 150000, supCubierta: 120, supTerreno: 200 };
 * precioM2Comparable(comp); // → 1250
 * ```
 */
export function precioM2Comparable(comparable: Comparable): number {
  const precio = comparable.precio || 0;
  const supCub = comparable.supCubierta || 0;
  const supTer = comparable.supTerreno || 0;
  const base = supCub > 0 ? supCub : supTer;
  return precio > 0 && base > 0 ? precio / base : 0;
}

// ============================================================================
// 6. recalcAll — Orquestador principal (recalcula TODO)
// ============================================================================

/**
 * Recalcula TODOS los valores derivados del formulario.
 *
 * FÓRMULA TAI.html (función `recalcAll` líneas 921-972):
 * 1. recalcUsoTerreno()
 * 2. recalcAmbientes()
 * 3. Para cada comparable:
 *    - coefCondicionesFor() → .c_coef
 *    - precioM2Comparable() → .c_precioM2
 * 4. Promedios (solo comparables incluidos con precio>0 y base>0):
 *    - precioPromedio = ΣprecioM2 / n
 *    - coefPromedio = Σcoefs / n
 * 3. precioAjustado = precioPromedio * coefPromedio
 * 4. Terreno:
 *    - terrTotal = terrM2 * v_terrenoPrecio
 * 5. Depreciación = coefDepreciacionPropia()
 * 6. Cubierta:
 *    - precioCubiertaM2 = precioAjustado * depreciacion
 *    - cubTotal = cubM2 * precioCubiertaM2
 * 7. Valor Final = terrTotal + cubTotal
 * 8. renderAnalisisComparativo()
 *
 * @param form - Formulario completo con todos los campos
 * @returns Objeto con todos los valores calculados para UI
 */
export function recalcAll(form: ValuacionFormValues): ValuacionCalculadaFormValues {
  const precioPromedio = precioPromedioComparables(form.comparables);
  const coefPromedio = coefPromedioComparables(form.comparables, form.f_tipo);
  const precioAjustado = precioPromedio * coefPromedio;

  const terrM2 = form.f_supTerreno || 0;
  const terrPrecio = form.v_terrenoPrecio || 0;
  const terrTotal = terrM2 * terrPrecio;

  const depreciacion = coefDepreciacionPropia({
    electricidad: form.electricidad,
    gas: form.gas,
    internet: form.internet,
    agua: form.agua,
    cloaca: form.cloaca,
    techos: form.techos
  });

  const cubM2 = form.f_supConstruida || 0;
  const precioCubiertaM2 = precioAjustado * depreciacion;
  const cubTotal = cubM2 * precioCubiertaM2;
  const valorFinal = terrTotal + cubTotal;

  return {
    v_precioPromedio: `U$S ${precioPromedio.toFixed(2)}`,
    v_coefPromedio: coefPromedio.toFixed(3),
    v_depreciacionServicios: depreciacion.toFixed(3),
    v_valorFinal: `U$S ${valorFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
    v_terrenoM2: terrM2 ? terrM2.toLocaleString('es-AR') : '—',
    v_terrenoTotal: terrTotal
      ? `U$S ${terrTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
      : '—',
    v_cubiertaM2: cubM2 ? cubM2.toLocaleString('es-AR') : '—',
    v_cubiertaPrecio: precioCubiertaM2 ? `U$S ${precioCubiertaM2.toFixed(2)}` : '—',
    v_cubiertaTotal: cubTotal
      ? `U$S ${cubTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
      : '—'
  };
}

// ============================================================================
// 7. coefCondicionesForComparables — Coeficientes de TODOS los comparables
// ============================================================================

/**
 * Calcula coeficientes para TODOS los comparables (array).
 *
 * @param comparables - Array de comparables
 * @param tipoInmueble - Tipo de inmueble principal
 * @returns Array de coeficientes (mismo orden que comparables)
 */
export function coefCondicionesForComparables(
  comparables: Comparable[],
  tipoInmueble: TipoInmueble
): number[] {
  return comparables.map((comparable) => coefCondicionesFor(comparable, tipoInmueble));
}

// ============================================================================
// 8. precioPromedioComparables — Promedio precio/m² (solo incluidos)
// ============================================================================

/**
 * Calcula precio/m² promedio de comparables INCLUIDOS con precio>0 y base>0.
 *
 * @param comparables - Array de comparables
 * @returns Precio promedio (0 si no hay válidos)
 */
export function precioPromedioComparables(comparables: Comparable[]): number {
  const precios = comparables.filter(esComparableValido).map(precioM2Comparable);
  return precios.length ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;
}

// ============================================================================
// 9. coefPromedioComparables — Promedio coeficientes (solo incluidos)
// ============================================================================

/**
 * Calcula coeficiente promedio de comparables INCLUIDOS con precio>0 y base>0.
 *
 * @param comparables - Array de comparables
 * @param tipoInmueble - Tipo de inmueble principal
 * @returns Coeficiente promedio (1 si no hay válidos)
 */
export function coefPromedioComparables(
  comparables: Comparable[],
  tipoInmueble: TipoInmueble
): number {
  const coefs = comparables
    .filter(esComparableValido)
    .map((comparable) => coefCondicionesFor(comparable, tipoInmueble));
  return coefs.length ? coefs.reduce((a, b) => a + b, 0) / coefs.length : 1;
}

// ============================================================================
// 10. precioAjustado — Precio/m² ajustado por coeficiente promedio
// ============================================================================

/**
 * Precio/m² ajustado = precioPromedio * coefPromedio.
 *
 * @param precioPromedio - Promedio precio/m² comparables
 * @param coefPromedio - Promedio coeficientes
 * @returns Precio ajustado
 */
export function precioAjustado(precioPromedio: number, coefPromedio: number): number {
  return precioPromedio * coefPromedio;
}

// ============================================================================
// 11. valorTerreno — Total terreno (m² * precio/m² editable)
// ============================================================================

/**
 * Calcula total terreno = supTerreno * v_terrenoPrecio.
 *
 * @param supTerreno - Superficie terreno (m²)
 * @param precioTerreno - Precio/m² terreno (editable por usuario)
 * @returns Total terreno en U$S (0 si faltan datos)
 */
export function valorTerreno(supTerreno: number, precioTerreno: number): number {
  return supTerreno > 0 && precioTerreno > 0 ? supTerreno * precioTerreno : 0;
}

// ============================================================================
// 12. valorCubierta — Total cubierta (m² * precioAjustado * depreciacion)
// ============================================================================

/**
 * Calcula total cubierta = supCubierta * precioAjustado * depreciacion.
 *
 * @param supCubierta - Superficie cubierta (m²)
 * @param precioAjustado - Precio/m² ajustado (precioPromedio * coefPromedio)
 * @param depreciacion - Factor depreciación servicios (coefDepreciacionPropia)
 * @returns Total cubierta en U$S (0 si faltan datos)
 */
export function valorCubierta(
  supCubierta: number,
  precioAjustado: number,
  depreciacion: number
): number {
  return supCubierta > 0 && precioAjustado > 0 && depreciacion > 0
    ? supCubierta * precioAjustado * depreciacion
    : 0;
}

// ============================================================================
// 13. valorFinal — Valor Final Estimado (terreno + cubierta)
// ============================================================================

/**
 * Valor Final = valorTerreno + valorCubierta.
 *
 * @param valorTerreno - Total terreno U$S
 * @param valorCubierta - Total cubierta U$S
 * @returns Valor Final Estimado
 */
export function valorFinal(valorTerreno: number, valorCubierta: number): number {
  return valorTerreno + valorCubierta;
}

// ============================================================================
// 14. recalcAnalisisComparativo — Análisis Comparativo + Chart.js data
// ============================================================================

/**
 * Genera datos para tabla Análisis Comparativo + Chart.js floating bars.
 *
 * FÓRMULA TAI.html (líneas 1103-1190 `renderAnalisisComparativo`):
 * - dispersion = ac_dispersion (default 10)
 * - Para cada comparable: low = precioM2 * (1 - d/100), high = precioM2 * (1 + d/100)
 * - Solo incluidos → valMin = min * (1-d/100), valMax = max * (1+d/100), valProm = avg
 * - Chart.js: floating bars [low, high] por comparable + promedio
 * - Colores: incluido #14b8a6, excluido #555, promedio #f59e0b
 *
 * @param form - Formulario completo
 * @returns Objeto con tabla rows, summary boxes, chart config
 */
export function recalcAnalisisComparativo(form: ValuacionFormValues): {
  rows: Array<{
    label: string;
    precioM2: number;
    low: number;
    high: number;
    included: boolean;
  }>;
  summary: { valMin: number; valProm: number; valMax: number };
  chart: {
    labels: string[];
    dataRanges: [number, number][];
    colors: string[];
  };
} {
  const dispersion = form.ac_dispersion ?? 10;

  const rows = form.comparables.map((comparable, i) => {
    const precioM2 = precioM2Comparable(comparable);
    return {
      label: `Comparable ${i + 1}`,
      precioM2,
      low: precioM2 * (1 - dispersion / 100),
      high: precioM2 * (1 + dispersion / 100),
      included: comparable.included !== false
    };
  });

  const incluidos = rows.filter((row) => row.included && row.precioM2 > 0);
  let valMin = 0;
  let valProm = 0;
  let valMax = 0;
  if (incluidos.length > 0) {
    const vals = incluidos.map((row) => row.precioM2);
    valProm = vals.reduce((a, b) => a + b, 0) / vals.length;
    valMin = Math.min(...vals) * (1 - dispersion / 100);
    valMax = Math.max(...vals) * (1 + dispersion / 100);
  }

  const labels = rows.map((row) => row.label).concat(incluidos.length ? ['Promedio'] : []);
  const dataRanges: [number, number][] = rows.map(
    (row): [number, number] => [row.precioM2 ? row.low : 0, row.precioM2 ? row.high : 0]
  );
  if (incluidos.length > 0) dataRanges.push([valMin, valMax]);
  const colors: string[] = rows.map((row) => (row.included ? '#14b8a6' : '#555'));
  if (incluidos.length > 0) colors.push('#f59e0b');

  return {
    rows,
    summary: { valMin, valProm, valMax },
    chart: { labels, dataRanges, colors }
  };
}
