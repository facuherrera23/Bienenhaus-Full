/**
 * Cifrado AES-256-GCM para tokens de Mercado Libre.
 * Node/TypeScript version using WebCrypto API (available in Node 18+).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToB64(bytes: Uint8Array): string {
    // Node.js Buffer to base64
    return Buffer.from(bytes).toString('base64');
}

function b64ToBytes(b64: string): Uint8Array {
    // base64 to Uint8Array
    return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function deriveKey(): Promise<CryptoKey> {
    const secret = process.env.CRYPTO_SECRET ?? '';
    if (!secret) throw new Error('CRYPTO_SECRET no configurado');
    const material = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveKey']
    );
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
        ['encrypt', 'decrypt']
    );
}

export interface EncryptedData {
    data: string;
    iv: string;
}

export async function encrypt(plain: string): Promise<EncryptedData> {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, encoder.encode(plain));
    return { data: bytesToB64(new Uint8Array(buf)), iv: bytesToB64(iv) };
}

export async function decrypt(data: string, iv: string): Promise<string> {
    const key = await deriveKey();
    const buf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBytes(iv) as BufferSource },
        key,
        b64ToBytes(data) as BufferSource
    );
    return decoder.decode(buf);
}