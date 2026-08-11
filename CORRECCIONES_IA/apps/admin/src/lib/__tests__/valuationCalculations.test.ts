// ============================================================================
// valuationCalculations.test.ts — Tests unitarios de las 14 fórmulas puras
// Valores esperados calculados A MANO según TAI.html / audit.md §8
// ============================================================================

import { describe, expect, it } from 'vitest';
import type {
    Ambientes,
    Comparable,
    Servicios,
    ValuacionFormValues,
} from '../../types/valuationTypes';
import {
    coefCondicionesFor,
    coefCondicionesForComparables,
    coefDepreciacionPropia,
    coefPromedioComparables,
    precioAjustado,
    precioM2Comparable,
    precioPromedioComparables,
    recalcAll,
    recalcAmbientes,
    recalcAnalisisComparativo,
    recalcUsoTerreno,
    valorCubierta,
    valorFinal,
    valorTerreno,
} from '../valuationCalculations';

// ============================================================================
// Fixtures
// ============================================================================

const OPTIMO = 'Optimo / Impecable (Listo para Habitar)' as const;
const SENCILLA = 'Sencilla (Cosmetica / Menor)' as const;
const IGUAL = 'Igual' as const;
const PEOR = 'Peor' as const;

const servicioOptimo: Servicios = {
    electricidad: OPTIMO,
    gas: OPTIMO,
    internet: OPTIMO,
    agua: OPTIMO,
    cloaca: OPTIMO,
    techos: OPTIMO,
};

function comparable(overrides: Partial<Comparable> = {}): Comparable {
    return {
        orden: 1,
        tipoConstruccion: '',
        chars: [IGUAL, IGUAL, IGUAL, IGUAL, IGUAL, IGUAL],
        included: true,
        ...overrides,
    };
}

function buildForm(overrides: Partial<ValuacionFormValues> = {}): ValuacionFormValues {
    return {
        f_destino: 'Venta',
        f_tipo: 'CASA',
        f_tipoConstruccion: '',
        f_tipoTecho: '',
        f_orientacion: '',
        f_luminosidad: '',
        f_calidadConstructiva: '',
        f_calidadMantenimiento: '',
        f_detallesTerminacion: '',
        f_estacionamientoTipo: '',
        f_comDobleCirculacion: '',
        f_comAsador: '',
        f_comPiscina: '',
        f_calefaccion: '',
        f_aireAcondicionado: '',
        f_aguaCaliente: '',
        ...servicioOptimo,
        f_tipologiasEdilicias: '',
        f_calidadConstructivaPredom: '',
        f_construccionAlturaPrevalencia: '',
        f_usoComercialPrevalencia: '',
        f_usoIndustrialPrevalencia: '',
        f_nivelSocioeconomicoBarrio: '',
        f_barrioTipo: '',
        f_construidoPct: '',
        f_indiceCrecimiento: '',
        f_servVigilancia: '',
        f_tendenciaValores: '',
        f_demandaOferta: '',
        f_tiempoComercializacion: '',
        f_cambiosUsoTerreno: '',
        f_facilidadesEstacionamiento: '',
        comparables: [],
        ac_dispersion: 10,
        locked: false,
        ...overrides,
    };
}

// ============================================================================
// 1. coefCondicionesFor
// ============================================================================

describe('coefCondicionesFor', () => {
    it('returns 1 when all characteristics are Igual', () => {
        expect(coefCondicionesFor(comparable(), 'CASA')).toBe(1);
    });

    it('applies weights in SLOT_ORDER order (CASA) — matches TAI.html example', () => {
        // SLOT_ORDER [3,2,5,0,4,1] → CASA pesos [0.15, 0.20, 0.05, 0.30, 0.10, 0.20]
        // 0.94 * 1.09 * 0.85 = 0.87091
        const comp = comparable({
            chars: ['Igual', 'Mejor', 'Igual', 'Peor', 'Igual', 'Mucho Mejor'],
        });
        expect(coefCondicionesFor(comp, 'CASA')).toBeCloseTo(0.87091, 5);
    });

    it('applies type-specific weights (DEPTO all Mucho Mejor)', () => {
        // DEPTO pesos [0.30, 0.20, 0.15, 0.15, 0.12, 0.08]
        // factor_i = 1 + peso_i * (-0.75)
        // 0.8875 * 0.8875 * 0.94 * 0.775 * 0.91 * 0.85 = 0.44384016...
        const comp = comparable({
            chars: [
                'Mucho Mejor',
                'Mucho Mejor',
                'Mucho Mejor',
                'Mucho Mejor',
                'Mucho Mejor',
                'Mucho Mejor',
            ],
        });
        expect(coefCondicionesFor(comp, 'DEPTO')).toBeCloseTo(0.44384, 5);
    });
});

// ============================================================================
// 2. coefDepreciacionPropia
// ============================================================================

describe('coefDepreciacionPropia', () => {
    it('returns 1 when all services are Optimo', () => {
        expect(coefDepreciacionPropia(servicioOptimo)).toBe(1);
    });

    it('all Sencilla → 1 - 0.051/6 = 0.9915', () => {
        // sum = 0.010 + 0.0075 + 0.0035 + 0.0075 + 0.0075 + 0.015 = 0.051
        const serv: Servicios = {
            electricidad: SENCILLA,
            gas: SENCILLA,
            internet: SENCILLA,
            agua: SENCILLA,
            cloaca: SENCILLA,
            techos: SENCILLA,
        };
        expect(coefDepreciacionPropia(serv)).toBeCloseTo(0.9915, 5);
    });

    it('applies per-rubro percentages (Grave)', () => {
        // sum = 0.065+0.09+0.03+0.07+0.08+0.115 = 0.45 → 1 - 0.45/6 = 0.925
        const serv: Servicios = {
            electricidad: 'Grave (Deterioro Estructural)',
            gas: 'Grave (Deterioro Estructural)',
            internet: 'Grave (Deterioro Estructural)',
            agua: 'Grave (Deterioro Estructural)',
            cloaca: 'Grave (Deterioro Estructural)',
            techos: 'Grave (Deterioro Estructural)',
        };
        expect(coefDepreciacionPropia(serv)).toBeCloseTo(0.925, 6);
    });
});

// ============================================================================
// 3. recalcAmbientes
// ============================================================================

describe('recalcAmbientes', () => {
    it('sums the ambiente fields', () => {
        expect(
            recalcAmbientes({ f_ambCocina: 1, f_ambDormitorios: 3, f_ambBano: 2 }),
        ).toBe(6);
    });

    it('returns 0 when no ambientes are set', () => {
        expect(recalcAmbientes({})).toBe(0);
    });

    it('counts all 18 fields', () => {
        const all: Ambientes = {
            f_ambCocina: 1,
            f_ambDormitorios: 1,
            f_ambTerraza: 1,
            f_ambComedor: 1,
            f_ambSuite: 1,
            f_ambPatio: 1,
            f_ambCocinaComedor: 1,
            f_ambSuiteVestidor: 1,
            f_ambBalcon: 1,
            f_ambLiving: 1,
            f_ambDormitVestidor: 1,
            f_ambLavadero: 1,
            f_ambLivingComedor: 1,
            f_ambBanoServicio: 1,
            f_ambCuartoGuardado: 1,
            f_ambEscritorio: 1,
            f_ambBano: 1,
            f_ambGarage: 1,
        };
        expect(recalcAmbientes(all)).toBe(18);
    });
});

// ============================================================================
// 4. recalcUsoTerreno
// ============================================================================

describe('recalcUsoTerreno', () => {
    it('computes the remainder (Otro)', () => {
        expect(recalcUsoTerreno({ residencial: 60, comercial: 20, industrial: 10 })).toBe(10);
    });

    it('clamps at 0 when the sum exceeds 100', () => {
        expect(recalcUsoTerreno({ residencial: 80, comercial: 30, industrial: 10 })).toBe(0);
    });

    it('returns 100 when all usages are 0', () => {
        expect(recalcUsoTerreno({ residencial: 0, comercial: 0, industrial: 0 })).toBe(100);
    });
});

// ============================================================================
// 5. precioM2Comparable
// ============================================================================

describe('precioM2Comparable', () => {
    it('divides price by supCubierta', () => {
        expect(
            precioM2Comparable(
                comparable({ precio: 150000, supCubierta: 120, supTerreno: 200 }),
            ),
        ).toBe(1250);
    });

    it('falls back to supTerreno when supCubierta is 0', () => {
        expect(
            precioM2Comparable(comparable({ precio: 150000, supCubierta: 0, supTerreno: 200 })),
        ).toBe(750);
    });

    it('returns 0 without price or surface', () => {
        expect(precioM2Comparable(comparable({ precio: 0, supCubierta: 120 }))).toBe(0);
        expect(
            precioM2Comparable(comparable({ precio: 150000, supCubierta: 0, supTerreno: 0 })),
        ).toBe(0);
    });
});

// ============================================================================
// 7. coefCondicionesForComparables
// ============================================================================

describe('coefCondicionesForComparables', () => {
    it('maps a coefficient per comparable', () => {
        const comparables = [
            comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
            comparable({
                orden: 2,
                precio: 100000,
                supCubierta: 100,
                chars: [PEOR, PEOR, PEOR, PEOR, PEOR, PEOR],
            }),
        ];
        const coefs = coefCondicionesForComparables(comparables, 'CASA');
        expect(coefs).toHaveLength(2);
        expect(coefs[0]).toBe(1);
        // CASA all-Peor → 1.045*1.06*1.015*1.09*1.03*1.06 = 1.33800515...
        expect(coefs[1]).toBeCloseTo(1.33801, 5);
    });
});

// ============================================================================
// 8. precioPromedioComparables
// ============================================================================

describe('precioPromedioComparables', () => {
    it('averages precio/m2 of included comparables', () => {
        const comparables = [
            comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
            comparable({ orden: 2, precio: 100000, supCubierta: 100 }),
        ];
        // (1250 + 1000) / 2 = 1125
        expect(precioPromedioComparables(comparables)).toBe(1125);
    });

    it('ignores excluded comparables', () => {
        const comparables = [
            comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
            comparable({ orden: 2, precio: 100000, supCubierta: 100, included: false }),
        ];
        expect(precioPromedioComparables(comparables)).toBe(1250);
    });

    it('ignores comparables without price', () => {
        expect(precioPromedioComparables([comparable({ precio: 0, supCubierta: 120 })])).toBe(0);
    });

    it('returns 0 when there are no valid comparables', () => {
        expect(precioPromedioComparables([])).toBe(0);
    });
});

// ============================================================================
// 9. coefPromedioComparables
// ============================================================================

describe('coefPromedioComparables', () => {
    it('returns 1 when all comparables are Igual', () => {
        const comparables = [
            comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
            comparable({ orden: 2, precio: 100000, supCubierta: 100 }),
        ];
        expect(coefPromedioComparables(comparables, 'CASA')).toBe(1);
    });

    it('averages coefficients of included comparables', () => {
        const comparables = [
            comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
            comparable({
                orden: 2,
                precio: 100000,
                supCubierta: 100,
                chars: [PEOR, PEOR, PEOR, PEOR, PEOR, PEOR],
            }),
        ];
        // (1 + 1.33800515...) / 2 = 1.16900257...
        expect(coefPromedioComparables(comparables, 'CASA')).toBeCloseTo(1.169, 3);
    });

    it('returns 1 when there are no valid comparables', () => {
        expect(coefPromedioComparables([], 'CASA')).toBe(1);
    });
});

// ============================================================================
// 10-13. precioAjustado / valorTerreno / valorCubierta / valorFinal
// ============================================================================

describe('precioAjustado', () => {
    it('multiplies promedio by coef promedio', () => {
        expect(precioAjustado(1125, 1)).toBe(1125);
        expect(precioAjustado(1000, 0.95)).toBe(950);
    });
});

describe('valorTerreno', () => {
    it('computes m2 * precio/m2', () => {
        expect(valorTerreno(300, 100)).toBe(30000);
    });

    it('returns 0 when a value is missing', () => {
        expect(valorTerreno(0, 100)).toBe(0);
        expect(valorTerreno(300, 0)).toBe(0);
    });
});

describe('valorCubierta', () => {
    it('computes m2 * precioAjustado * depreciacion', () => {
        expect(valorCubierta(200, 1125, 1)).toBe(225000);
        expect(valorCubierta(200, 1125, 0.9)).toBe(202500);
    });

    it('returns 0 when a value is missing', () => {
        expect(valorCubierta(0, 1125, 1)).toBe(0);
        expect(valorCubierta(200, 0, 1)).toBe(0);
        expect(valorCubierta(200, 1125, 0)).toBe(0);
    });
});

describe('valorFinal', () => {
    it('sums terreno + cubierta', () => {
        expect(valorFinal(30000, 225000)).toBe(255000);
    });
});

// ============================================================================
// 6. recalcAll
// ============================================================================

describe('recalcAll', () => {
    it('returns placeholder strings for an empty form', () => {
        const result = recalcAll(buildForm());
        expect(result).toEqual({
            v_precioPromedio: 'U$S 0.00',
            v_coefPromedio: '1.000',
            v_depreciacionServicios: '1.000',
            v_valorFinal: 'U$S 0',
            v_terrenoM2: '—',
            v_terrenoTotal: '—',
            v_cubiertaM2: '—',
            v_cubiertaPrecio: '—',
            v_cubiertaTotal: '—',
        });
    });

    it('computes the full valuation with formatted strings', () => {
        const form = buildForm({
            f_supTerreno: 300,
            f_supConstruida: 200,
            v_terrenoPrecio: 100,
            comparables: [
                comparable({ orden: 1, precio: 150000, supCubierta: 120, supTerreno: 200 }),
                comparable({ orden: 2, precio: 100000, supCubierta: 100, supTerreno: 150 }),
            ],
        });
        const result = recalcAll(form);
        // precioPromedio = (1250 + 1000)/2 = 1125 ; coefPromedio = 1
        // terreno = 300*100 = 30000 ; cubierta = 200*(1125*1) = 225000
        // valorFinal = 255000
        expect(result).toEqual({
            v_precioPromedio: 'U$S 1125.00',
            v_coefPromedio: '1.000',
            v_depreciacionServicios: '1.000',
            v_valorFinal: 'U$S 255.000',
            v_terrenoM2: '300',
            v_terrenoTotal: 'U$S 30.000',
            v_cubiertaM2: '200',
            v_cubiertaPrecio: 'U$S 1125.00',
            v_cubiertaTotal: 'U$S 225.000',
        });
    });

    it('applies the depreciation factor to cubierta', () => {
        const serv: Servicios = {
            electricidad: SENCILLA,
            gas: SENCILLA,
            internet: SENCILLA,
            agua: SENCILLA,
            cloaca: SENCILLA,
            techos: SENCILLA,
        };
        const form = buildForm({
            f_supTerreno: 300,
            f_supConstruida: 250,
            v_terrenoPrecio: 100,
            ...serv,
            comparables: [
                comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
                comparable({ orden: 2, precio: 100000, supCubierta: 100 }),
            ],
        });
        const result = recalcAll(form);
        // depreciacion = 0.9915 ; precioCubiertaM2 = 1125 * 0.9915 = 1115.4375
        // cubierta = 250 * 1115.4375 = 278859.375 ; final = 30000 + 278859.375 = 308859.375
        expect(result.v_depreciacionServicios).toBe(coefDepreciacionPropia(serv).toFixed(3));
        expect(result.v_cubiertaPrecio).toBe('U$S 1115.44');
        expect(result.v_cubiertaTotal).toBe('U$S 278.859');
        expect(result.v_valorFinal).toBe('U$S 308.859');
    });
});

// ============================================================================
// 14. recalcAnalisisComparativo
// ============================================================================

describe('recalcAnalisisComparativo', () => {
    it('computes rows, summary and chart for included comparables', () => {
        const form = buildForm({
            comparables: [
                comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
                comparable({ orden: 2, precio: 100000, supCubierta: 100 }),
            ],
        });
        const result = recalcAnalisisComparativo(form);
        // dispersion 10 → low = m2*0.9, high = m2*1.1
        expect(result.rows).toEqual([
            {
                label: 'Comparable 1',
                precioM2: 1250,
                low: expect.closeTo(1125, 6),
                high: expect.closeTo(1375, 6),
                included: true,
            },
            {
                label: 'Comparable 2',
                precioM2: 1000,
                low: expect.closeTo(900, 6),
                high: expect.closeTo(1100, 6),
                included: true,
            },
        ]);
        expect(result.summary).toEqual({
            valMin: expect.closeTo(900, 6),
            valProm: 1125,
            valMax: expect.closeTo(1375, 6),
        });
        expect(result.chart.labels).toEqual(['Comparable 1', 'Comparable 2', 'Promedio']);
        expect(result.chart.dataRanges).toEqual([
            [1125, expect.closeTo(1375, 6)],
            [900, expect.closeTo(1100, 6)],
            [expect.closeTo(900, 6), expect.closeTo(1375, 6)],
        ]);
        expect(result.chart.colors).toEqual(['#14b8a6', '#14b8a6', '#f59e0b']);
    });

    it('keeps excluded rows but excludes them from summary and colors them #555', () => {
        const form = buildForm({
            comparables: [
                comparable({ orden: 1, precio: 150000, supCubierta: 120 }),
                comparable({ orden: 2, precio: 100000, supCubierta: 100, included: false }),
            ],
        });
        const result = recalcAnalisisComparativo(form);
        expect(result.rows[1]).toEqual({
            label: 'Comparable 2',
            precioM2: 1000,
            low: expect.closeTo(900, 6),
            high: expect.closeTo(1100, 6),
            included: false,
        });
        expect(result.summary).toEqual({
            valMin: expect.closeTo(1125, 6),
            valProm: 1250,
            valMax: expect.closeTo(1375, 6),
        });
        expect(result.chart.dataRanges).toEqual([
            [1125, expect.closeTo(1375, 6)],
            [900, expect.closeTo(1100, 6)],
            [expect.closeTo(1125, 6), expect.closeTo(1375, 6)],
        ]);
        expect(result.chart.colors).toEqual(['#14b8a6', '#555', '#f59e0b']);
    });

    it('uses [0,0] ranges and omits Promedio when no comparable has price', () => {
        const form = buildForm({
            comparables: [comparable({ precio: 0, supCubierta: 120 })],
        });
        const result = recalcAnalisisComparativo(form);
        expect(result.rows).toEqual([
            { label: 'Comparable 1', precioM2: 0, low: 0, high: 0, included: true },
        ]);
        expect(result.summary).toEqual({ valMin: 0, valProm: 0, valMax: 0 });
        expect(result.chart.labels).toEqual(['Comparable 1']);
        expect(result.chart.dataRanges).toEqual([[0, 0]]);
        expect(result.chart.colors).toEqual(['#14b8a6']);
    });

    it('returns empty chart when there are no comparables', () => {
        const result = recalcAnalisisComparativo(buildForm());
        expect(result.rows).toEqual([]);
        expect(result.summary).toEqual({ valMin: 0, valProm: 0, valMax: 0 });
        expect(result.chart).toEqual({ labels: [], dataRanges: [], colors: [] });
    });
});
