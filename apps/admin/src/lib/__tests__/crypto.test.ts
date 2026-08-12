import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../_shared/crypto';

describe('crypto', () => {
    const testSecret = 'test-secret-key-for-encryption-32chars!!';

    // Set env for tests (Node/vitest uses process.env, not Deno.env)
    beforeAll(() => {
        process.env.CRYPTO_SECRET = testSecret;
    });

    afterAll(() => {
        delete process.env.CRYPTO_SECRET;
    });

    describe('encrypt/decrypt roundtrip', () => {
        it('encrypts and decrypts string correctly', async () => {
            const plaintext = 'test-access-token-12345';
            const encrypted = await encrypt(plaintext);
            const decrypted = await decrypt(encrypted.data, encrypted.iv);
            expect(decrypted).toBe(plaintext);
        });

        it('produces different IV each call', async () => {
            const plaintext = 'same-token';
            const enc1 = await encrypt(plaintext);
            const enc2 = await encrypt(plaintext);
            expect(enc1.iv).not.toBe(enc2.iv);
            expect(enc1.data).not.toBe(enc2.data);
        });

        it('handles empty string', async () => {
            const encrypted = await encrypt('');
            const decrypted = await decrypt(encrypted.data, encrypted.iv);
            expect(decrypted).toBe('');
        });

        it('handles long string', async () => {
            const longToken = 'a'.repeat(1000);
            const encrypted = await encrypt(longToken);
            const decrypted = await decrypt(encrypted.data, encrypted.iv);
            expect(decrypted).toBe(longToken);
        });

        it('handles special characters', async () => {
            const special = 'token-with-special-chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
            const encrypted = await encrypt(special);
            const decrypted = await decrypt(encrypted.data, encrypted.iv);
            expect(decrypted).toBe(special);
        });

        it('handles unicode', async () => {
            const unicode = 'token-🔐-测试-тест-العربية';
            const encrypted = await encrypt(unicode);
            const decrypted = await decrypt(encrypted.data, encrypted.iv);
            expect(decrypted).toBe(unicode);
        });
    });

    describe('error handling', () => {
        it('throws on decrypt with wrong IV', async () => {
            const encrypted = await encrypt('test');
            await expect(decrypt(encrypted.data, 'wrong-iv-base64')).rejects.toThrow();
        });

        it('throws on decrypt with corrupted data', async () => {
            const encrypted = await encrypt('test');
            await expect(decrypt('corrupted-data', encrypted.iv)).rejects.toThrow();
        });

        it('throws when CRYPTO_SECRET not set', async () => {
            delete process.env.CRYPTO_SECRET;
            await expect(encrypt('test')).rejects.toThrow('CRYPTO_SECRET no configurado');
            process.env.CRYPTO_SECRET = testSecret;
        });
    });

    describe('deterministic key derivation', () => {
        it('same secret produces same key', async () => {
            const secret = 'test-secret';
            process.env.CRYPTO_SECRET = secret;

            const enc1 = await encrypt('test');
            const dec1 = await decrypt(enc1.data, enc1.iv);

            // Re-import with same secret
            const enc2 = await encrypt('test');
            const dec2 = await decrypt(enc2.data, enc2.iv);

            expect(dec1).toBe('test');
            expect(dec2).toBe('test');
        });
    });
});
