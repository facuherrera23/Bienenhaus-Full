/**
 * Cifrado AES-256-GCM para tokens de Mercado Libre.
 * Versión admin (Node/Vite) — usa Web Crypto API + import.meta.env.
 * La versión Deno edge está en supabase/functions/_shared/crypto.ts.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
    // In Vite (admin): import.meta.env.VITE_CRYPTO_SECRET
    // In Node test: process.env.CRYPTO_SECRET
    const secret =
        (import.meta as any).env?.VITE_CRYPTO_SECRET ??
        (typeof process !== 'undefined' ? process.env?.CRYPTO_SECRET : '') ??
        '';
    if (!secret && typeof process !== 'undefined' && process.env?.CRYPTO_SECRET === undefined && (import.meta as any).env?.VITE_CRYPTO_SECRET === undefined) {
        // For tests: allow Deno.env fallback if available (Deno runtime), else empty
        return '';
    }
    return secret;
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function bytesToB64(bytes: Uint8Array): string {
    let bin = '';
    bytes.forEach((b) => {
        bin += String.fromCharCode(b);
    });
    return btoa(bin);
}

async function deriveKey(): Promise<CryptoKey> {
    const secret = getSecret();
    if (!secret) throw new Error('CRYPTO_SECRET no configurado');
    const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, [
        'deriveKey',
    ]);
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('bienenhaus-ml'),
            iterations: 100_000,
            hash: 'SHA-256',
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}

export interface EncryptedData {
    data: string;
    iv: string;
}

export async function encrypt(plain: string): Promise<EncryptedData> {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain));
    return { data: bytesToB64(new Uint8Array(buf)), iv: bytesToB64(iv) };
}

export async function decrypt(data: string, iv: string): Promise<string> {
    const key = await deriveKey();
    const buf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBytes(iv) },
        key,
        b64ToBytes(data),
    );
    return decoder.decode(buf);
}
