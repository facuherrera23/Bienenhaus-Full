// ============================================================
// Types
// ============================================================

export interface CsvOptions {
    delimiter?: ',' | ';' | 'tab';
    includeHeaders?: boolean;
    encoding?: 'utf-8' | 'utf-8-bom';
}

export interface CsvParseResult<T = Record<string, string>> {
    headers: string[];
    rows: T[];
    errors: { row: number; column?: string; message: string }[];
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Convierte un array de datos a formato CSV
 */
export function toCsv(
    header: string[],
    rows: (string | number | null | undefined)[][],
    options: CsvOptions = {},
): string {
    const rawDelimiter = options.delimiter ?? ';';
    const delimiter = rawDelimiter === 'tab' ? '\t' : rawDelimiter;
    const includeHeaders = options.includeHeaders ?? true;

    const esc = (v: string | number | null | undefined): string => {
        if (v === null || v === undefined || v === '') return '';
        const s = String(v);
        // Escapar comillas y caracteres especiales
        if (/[";\n\r,]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const lines: string[] = [];

    if (includeHeaders) {
        lines.push(header.map(esc).join(delimiter));
    }

    for (const row of rows) {
        lines.push(row.map(esc).join(delimiter));
    }

    return lines.join('\r\n');
}

/**
 * Convierte un array de objetos a CSV
 */
export function toCsvFromObjects<T extends Record<string, unknown>>(
    data: T[],
    columns: { key: keyof T; label: string; format?: (value: unknown) => string }[],
    options: CsvOptions = {},
): string {
    const header = columns.map((col) => col.label);
    const rows = data.map((item) =>
        columns.map((col) => {
            const value = item[col.key];
            if (col.format) {
                return col.format(value);
            }
            return value === null || value === undefined ? '' : String(value);
        }),
    );

    return toCsv(header, rows, options);
}

/**
 * Descarga un archivo CSV
 */
export function downloadCsv(filename: string, content: string): void {
    // Añadir BOM para UTF-8 (mejor compatibilidad con Excel)
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para nombres de archivo
 */
export function todayStamp(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Genera un nombre de archivo con timestamp
 */
export function generateFilename(prefix: string, extension = 'csv'): string {
    const date = todayStamp();
    const time = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
    return `${prefix}_${date}_${time}.${extension}`;
}

// ============================================================
// Parser Functions
// ============================================================

/**
 * Parsea un string CSV a un array de objetos
 */
export function parseCsv<T = Record<string, string>>(
    csvText: string,
    options: {
        delimiter?: ',' | ';' | 'tab';
        skipEmptyLines?: boolean;
        trimValues?: boolean;
    } = {},
): CsvParseResult<T> {
    const delimiter = options.delimiter ?? ';';
    const skipEmptyLines = options.skipEmptyLines ?? true;
    const trimValues = options.trimValues ?? true;

    const lines = csvText.split(/\r?\n/).filter((line) => {
        if (skipEmptyLines) {
            return line.trim() !== '';
        }
        return true;
    });

    if (lines.length === 0) {
        return { headers: [], rows: [], errors: [] };
    }

    const errors: { row: number; column?: string; message: string }[] = [];

    // Detectar delimitador si no se especificó
    let actualDelimiter: string = delimiter;
    if (delimiter === 'tab') {
        actualDelimiter = '\t';
    } else if (delimiter === ',' && !lines[0].includes(',')) {
        // Intentar detectar automáticamente
        const semicolonCount = (lines[0].match(/;/g) || []).length;
        const commaCount = (lines[0].match(/,/g) || []).length;
        if (semicolonCount > commaCount) {
            actualDelimiter = ';';
        } else if (commaCount > 0) {
            actualDelimiter = ',';
        }
    }

    // Parsear valores respetando comillas
    const parseRow = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Comilla doble escapada
                    current += '"';
                    i += 2;
                } else {
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === actualDelimiter && !inQuotes) {
                values.push(trimValues ? current.trim() : current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        values.push(trimValues ? current.trim() : current);
        return values;
    };

    // Obtener headers
    const headerRow = parseRow(lines[0]);
    const headers = headerRow.map((h) => (trimValues ? h.trim() : h));

    // Parsear datos
    const rows: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);

        // Si la fila tiene menos columnas que headers, rellenar con undefined
        while (values.length < headers.length) {
            values.push('');
        }

        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ?? '';
        }

        rows.push(row as T);
    }

    return { headers, rows, errors };
}

/**
 * Parsea un string CSV a un array de arrays
 */
export function parseCsvRaw(
    csvText: string,
    options: {
        delimiter?: ',' | ';' | 'tab';
        skipEmptyLines?: boolean;
        trimValues?: boolean;
    } = {},
): { headers: string[]; rows: string[][]; errors: { row: number; message: string }[] } {
    const delimiter = options.delimiter ?? ';';
    const skipEmptyLines = options.skipEmptyLines ?? true;
    const trimValues = options.trimValues ?? true;

    const lines = csvText.split(/\r?\n/).filter((line) => {
        if (skipEmptyLines) {
            return line.trim() !== '';
        }
        return true;
    });

    if (lines.length === 0) {
        return { headers: [], rows: [], errors: [] };
    }

    const errors: { row: number; message: string }[] = [];

    // Detectar delimitador si no se especificó
    let actualDelimiter: string = delimiter;
    if (delimiter === 'tab') {
        actualDelimiter = '\t';
    } else if (delimiter === ',' && !lines[0].includes(',')) {
        const semicolonCount = (lines[0].match(/;/g) || []).length;
        const commaCount = (lines[0].match(/,/g) || []).length;
        if (semicolonCount > commaCount) {
            actualDelimiter = ';';
        } else if (commaCount > 0) {
            actualDelimiter = ',';
        }
    }

    // Parsear valores respetando comillas
    const parseRow = (line: string): string[] => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === actualDelimiter && !inQuotes) {
                values.push(trimValues ? current.trim() : current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        values.push(trimValues ? current.trim() : current);
        return values;
    };

    const headers = parseRow(lines[0]).map((h) => (trimValues ? h.trim() : h));
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        while (values.length < headers.length) {
            values.push('');
        }
        rows.push(values);
    }

    return { headers, rows, errors };
}

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Valida que los datos tengan todas las columnas requeridas
 */
export function validateCsvHeaders(
    headers: string[],
    requiredColumns: string[],
): { valid: boolean; missing: string[] } {
    const missing = requiredColumns.filter((col) => !headers.includes(col));
    return { valid: missing.length === 0, missing };
}

/**
 * Valida que los datos tengan al menos una fila
 */
export function validateCsvHasData(rows: unknown[]): { valid: boolean; message?: string } {
    if (rows.length === 0) {
        return { valid: false, message: 'El archivo CSV está vacío' };
    }
    return { valid: true };
}

// ============================================================
// Export Direct Functions (alias para compatibilidad)
// ============================================================

// Estos alias mantienen compatibilidad con código existente
export { toCsv as toCsvString };
export { downloadCsv as downloadCsvFile };
