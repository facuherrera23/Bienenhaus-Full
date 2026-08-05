import { describe, it, expect } from 'vitest';
import {
  toCsv,
  toCsvFromObjects,
  parseCsv,
  parseCsvRaw,
  validateCsvHeaders,
  validateCsvHasData,
  generateFilename,
} from '../csv';

describe('toCsv', () => {
  it('generates CSV with headers and semicolon delimiter by default', () => {
    const csv = toCsv(
      ['Nombre', 'Email'],
      [
        ['Juan', 'juan@test.com'],
        ['María', 'maria@test.com'],
      ]
    );
    expect(csv).toBe('Nombre;Email\r\nJuan;juan@test.com\r\nMaría;maria@test.com');
  });

  it('escapes values containing semicolons, quotes and newlines', () => {
    const csv = toCsv(
      ['Nota'],
      [['Hola; mundo']],
    );
    expect(csv).toContain('"Hola; mundo"');
  });

  it('escapes double quotes by doubling them', () => {
    const csv = toCsv(
      ['Frase'],
      [['Dijo "hola"']],
    );
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
    const csv = toCsv(['A', 'B'], [[null, undefined], ['x', '']]);
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
});

describe('parseCsvRaw', () => {
  it('parses into arrays of strings', () => {
    const result = parseCsvRaw('A;B\n1;2');
    expect(result.headers).toEqual(['A', 'B']);
    expect(result.rows).toEqual([['1', '2']]);
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
    expect(validateCsvHasData([])).toEqual({ valid: false, message: 'El archivo CSV está vacío' });
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
