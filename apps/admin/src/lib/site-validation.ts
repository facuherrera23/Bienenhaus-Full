import { z } from 'zod';

const SettingValueSchemas = {
    string: z.string(),
    number: z.number(),
    boolean: z.boolean(),
    json: z.record(z.unknown()),
    url: z.string().url(),
    email: z.string().email(),
    phone: z.string().regex(/^[\d\s\-+()]{10,}$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    richtext: z.string(),
} as const;

export type SettingValueType = keyof typeof SettingValueSchemas;

export function validateSetting(
    value: unknown,
    valueType: string,
): { valid: boolean; error?: string } {
    const schema = SettingValueSchemas[valueType as SettingValueType];
    if (!schema) return { valid: false, error: `Tipo de valor desconocido: ${valueType}` };
    const result = schema.safeParse(value);
    return result.success ? { valid: true } : { valid: false, error: result.error.message };
}
