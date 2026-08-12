import { afterEach , beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
    downloadCsv,
    downloadCsvFile,
    generateFilename,
    parseCsv,
    parseCsvRaw,
    toCsv,
    toCsvFromObjects,
    toCsvString,
    todayStamp,
    validateCsvHasData,
    validateCsvHeaders,
} from '../csv';

describe('toCsv', () => {
    it('generates CSV with headers and semicolon delimiter by default', () => {
        const csv = toCsv(
            ['Nombre', 'Email'],
            [
                ['Juan', 'juan@test.com'],
                ['María', 'maria@test.com'],
            ],
        );
        expect(csv).toBe('Nombre;Email\r\nJuan;juan@test.com\r\nMaría;maria@test.com');
    });

    it('escapes values containing semicolons, quotes and newlines', () => {
        const csv = toCsv(['Nota'], [['Hola; mundo']]);
        expect(csv).toContain('"Hola; mundo"');
    });

    it('escapes double quotes by doubling them', () => {
        const csv = toCsv(['Frase'], [['Dijo "hola"']]);
        expect(csv).toContain('"Dijo ""hola"""');
    });

    it('omits headers when includeHeaders is false', () => {
        const csv = toCsv(['A', 'B'], [[1, 2]], { includeHeaders: false });
        expect(csv).toBe('1;2');
    });

    it('supports comma delimiter', () => {
        const csv = toCsv(['A', 'B'], [[1, 2]], { delimiter: ',' });
        expect(csv).toBe('A,B\r\n1,2');
    });

    it('converts null, undefined and empty to empty string', () => {
        const csv = toCsv(
            ['A', 'B'],
            [
                [null, undefined],
                ['x', ''],
            ],
        );
        expect(csv).toBe('A;B\r\n;\r\nx;');
    });

    it('uses CRLF line endings', () => {
        const csv = toCsv(['A'], [[1]]);
        expect(csv).toContain('\r\n');
    });
});

describe('toCsvFromObjects', () => {
    const data = [
        { id: 1, name: 'Juan', price: 150000 },
        { id: 2, name: 'María', price: 200000 },
    ];

    it('maps object keys to column labels', () => {
        const csv = toCsvFromObjects(data, [
            { key: 'name', label: 'Nombre' },
            { key: 'price', label: 'Precio' },
        ]);
        expect(csv).toBe('Nombre;Precio\r\nJuan;150000\r\nMaría;200000');
    });

    it('applies format functions', () => {
        const csv = toCsvFromObjects(data, [
            { key: 'price', label: 'Precio USD', format: (v) => `USD ${v}` },
        ]);
        expect(csv).toContain('USD 150000');
    });
});

describe('parseCsv', () => {
    it('parses semicolon-separated CSV into objects', () => {
        const result = parseCsv('Nombre;Email\nJuan;juan@test.com\nMaría;maria@test.com');
        expect(result.headers).toEqual(['Nombre', 'Email']);
        expect(result.rows).toHaveLength(2);
        expect(result.rows[0]).toEqual({ Nombre: 'Juan', Email: 'juan@test.com' });
    });

    it('handles quoted values with delimiters inside', () => {
        const result = parseCsv('Nota\n"Hola; mundo"\n"Frase ""entre comillas"""');
        expect(result.rows[0]).toEqual({ Nota: 'Hola; mundo' });
        expect(result.rows[1]).toEqual({ Nota: 'Frase "entre comillas"' });
    });

    it('auto-detects delimiter when comma chosen but semicolons present', () => {
        const result = parseCsv('A;B\n1;2', { delimiter: ',' });
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows[0]).toEqual({ A: '1', B: '2' });
    });

    it('skips empty lines by default', () => {
        const result = parseCsv('A;B\n1;2\n\n3;4\n');
        expect(result.rows).toHaveLength(2);
    });

    it('trims values by default', () => {
        const result = parseCsv('A;B\n 1 ; 2 ');
        expect(result.rows[0]).toEqual({ A: '1', B: '2' });
    });

    it('returns empty result for empty input', () => {
        const result = parseCsv('');
        expect(result.headers).toEqual([]);
        expect(result.rows).toEqual([]);
    });

    it('pads short rows to header length', () => {
        const result = parseCsv('A;B;C\n1;2');
        expect(result.rows[0]).toEqual({ A: '1', B: '2', C: '' });
    });

    it('mantiene las líneas vacías si skipEmptyLines es false', () => {
        const result = parseCsv('A;B\n1;2\n\n3;4', { skipEmptyLines: false });
        expect(result.rows).toHaveLength(3);
        expect(result.rows[1]).toEqual({ A: '', B: '' });
    });

    it('no recorta valores si trimValues es false', () => {
        const result = parseCsv('A;B\n 1 ; 2 ', { trimValues: false });
        expect(result.rows[0]).toEqual({ A: ' 1 ', B: ' 2 ' });
    });

    it('deja el delimitador elegido si no hay comas ni punto y coma', () => {
        const result = parseCsv('a b\n1 2', { delimiter: ',' });
        expect(result.headers).toEqual(['a b']);
        expect(result.rows[0]).toEqual({ 'a b': '1 2' });
    });
});

describe('parseCsvRaw', () => {
    it('parses into arrays of strings', () => {
        const result = parseCsvRaw('A;B\n1;2');
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows).toEqual([['1', '2']]);
    });

    it('devuelve resultado vacío para entrada vacía', () => {
        expect(parseCsvRaw('')).toEqual({ headers: [], rows: [], errors: [] });
    });

    it('lee columnas separadas con tab', () => {
        const result = parseCsvRaw('A\tB\n1\t2', { delimiter: 'tab' });
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows).toEqual([['1', '2']]);
    });

    it('auto-detecta delimitador punto y coma', () => {
        const result = parseCsvRaw('A;B\n1;2', { delimiter: ',' });
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows).toEqual([['1', '2']]);
    });

    it('deja el delimitador elegido si no hay comas ni punto y coma', () => {
        const result = parseCsvRaw('a b\n1 2', { delimiter: ',' });
        expect(result.headers).toEqual(['a b']);
        expect(result.rows).toEqual([['1 2']]);
    });

    it('mantiene las líneas vacías si skipEmptyLines es false', () => {
        const result = parseCsvRaw('A;B\n1;2\n\n3;4', { skipEmptyLines: false });
        expect(result.rows).toHaveLength(3);
        expect(result.rows[1]).toEqual(['', '']);
    });

    it('no recorta valores si trimValues es false', () => {
        const result = parseCsvRaw('A;B\n 1 ; 2 ', { trimValues: false });
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows[0]).toEqual([' 1 ', ' 2 ']);
    });

    it('respeta comillas y comillas escapadas', () => {
        const result = parseCsvRaw('Nota\n"Hola; mundo"\n"Frase ""entre"""');
        expect(result.rows[0]).toEqual(['Hola; mundo']);
        expect(result.rows[1]).toEqual(['Frase "entre"']);
    });
});

describe('CSV validation helpers', () => {
    it('detects missing required headers', () => {
        expect(validateCsvHeaders(['A', 'B'], ['A', 'B', 'C'])).toEqual({
            valid: false,
            missing: ['C'],
        });
        expect(validateCsvHeaders(['A', 'B'], ['A'])).toEqual({ valid: true, missing: [] });
    });

    it('detects empty data', () => {
        expect(validateCsvHasData([])).toEqual({
            valid: false,
            message: 'El archivo CSV está vacío',
        });
        expect(validateCsvHasData([{ a: 1 }])).toEqual({ valid: true });
    });
});

describe('generateFilename', () => {
    it('produces prefix_date_time.csv', () => {
        const name = generateFilename('propiedades');
        expect(name).toMatch(/^propiedades_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('supports custom extension', () => {
        const name = generateFilename('reporte', 'xlsx');
        expect(name.endsWith('.xlsx')).toBe(true);
    });
});

describe('downloadCsv', () => {
    let createObjectURLMock: Mock;
    let revokeObjectURLMock: Mock;
    let clickSpy: Mock;
    let capturedAnchor: HTMLAnchorElement | null;

    beforeEach(() => {
        capturedAnchor = null;
        createObjectURLMock = vi.fn(() => 'blob:mock');
        revokeObjectURLMock = vi.fn();
        Object.defineProperty(URL, 'createObjectURL', {
            value: createObjectURLMock,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: revokeObjectURLMock,
            configurable: true,
            writable: true,
        });
        clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(function (this: HTMLAnchorElement) {
                capturedAnchor = this;
            });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('crea un Blob con BOM UTF-8 y lo descarga con extensión .csv', async () => {
        downloadCsv('propiedades', 'A;B\r\n1;2');

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        const blob = createObjectURLMock.mock.calls[0][0] as Blob;
        expect(blob.type).toBe('text/csv;charset=utf-8;');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
        expect(new TextDecoder().decode(bytes.slice(3))).toBe('A;B\r\n1;2');

        expect(capturedAnchor).not.toBeNull();
        expect(capturedAnchor?.download).toBe('propiedades.csv');
        expect(capturedAnchor?.href).toContain('blob:mock');
        expect(capturedAnchor?.parentElement).toBeNull();
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock');
    });

    it('no duplica la extensión .csv', () => {
        downloadCsv('reporte.csv', 'x');
        expect(capturedAnchor?.download).toBe('reporte.csv');
    });
});

describe('todayStamp', () => {
    it('devuelve la fecha actual en formato YYYY-MM-DD', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date('2026-08-07T12:34:56Z'));
            expect(todayStamp()).toBe('2026-08-07');
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('delimiter tab', () => {
    it('toCsv separa columnas con tab', () => {
        const csv = toCsv(['A', 'B'], [['x', 'y']], { delimiter: 'tab' });
        expect(csv).toBe('A\tB\r\nx\ty');
    });

    it('parseCsv lee columnas separadas con tab', () => {
        const result = parseCsv('A\tB\n1\t2', { delimiter: 'tab' });
        expect(result.headers).toEqual(['A', 'B']);
        expect(result.rows[0]).toEqual({ A: '1', B: '2' });
    });
});

describe('valores multilínea', () => {
    it('toCsv envuelve entre comillas valores con saltos de línea', () => {
        const csv = toCsv(['Nota'], [['línea 1\nlínea 2']]);
        expect(csv).toContain('"línea 1\nlínea 2"');
    });
});

describe('alias de compatibilidad', () => {
    it('toCsvString es alias de toCsv', () => {
        expect(toCsvString).toBe(toCsv);
    });

    it('downloadCsvFile es alias de downloadCsv', () => {
        expect(downloadCsvFile).toBe(downloadCsv);
    });
});
