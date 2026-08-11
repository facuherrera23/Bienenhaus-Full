import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    getActiveTemplate,
    getMlAccessToken,
    sendQuestionAnswer,
    sendOrderMessage,
} from '../_shared/auto_reply';

// Chain-mock de supabase: cada método devuelve la cadena y `await` resuelve el
// próximo valor encolado con { data, error }. auto_reply recibe `supabase` como
// parámetro (no lo importa), así que no hace falta vi.mock del módulo.
type QueryResult = { data: unknown; error: unknown };

const { chainMock, enqueue, resetChain } = vi.hoisted(() => {
    const queue: QueryResult[] = [];
    const methods = [
        'select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'not',
        'is', 'order', 'limit', 'maybeSingle', 'single', 'returns', 'or',
        'ilike', 'match', 'rpc', 'from', 'range',
    ];
    const chain: Record<string, unknown> = {};
    for (const m of methods) {
        chain[m] = vi.fn(() => chain);
    }
    (chain as { then?: unknown }).then = (
        onFulfilled: (v: QueryResult) => unknown,
        _onRejected?: (e: unknown) => unknown,
    ) => {
        const next = queue.shift() ?? { data: null, error: null };
        return Promise.resolve(next).then(onFulfilled);
    };
    const enqueue = (data: unknown, error: unknown = null) => queue.push({ data, error });
    const resetChain = () => {
        queue.length = 0;
    };
    return { chainMock: chain, enqueue, resetChain };
});

const supabase = chainMock as unknown as SupabaseClient;
const fn = (name: string) => chainMock[name] as ReturnType<typeof vi.fn>;

describe('auto_reply', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetChain();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getActiveTemplate', () => {
        it('returns the active template for a trigger', async () => {
            enqueue([{ id: 1, message: 'Gracias por tu consulta' }], null);

            const result = await getActiveTemplate(supabase, 'new_question');
            expect(result).toEqual({ id: 1, message: 'Gracias por tu consulta' });
            expect(fn('from')).toHaveBeenCalledWith('ml_auto_reply_templates');
            expect(fn('eq')).toHaveBeenCalledWith('trigger', 'new_question');
            expect(fn('eq')).toHaveBeenCalledWith('is_active', true);
            expect(fn('order')).toHaveBeenCalledWith('updated_at', { ascending: false });
            expect(fn('limit')).toHaveBeenCalledWith(1);
        });

        it('returns null when there are no rows', async () => {
            enqueue([], null);

            const result = await getActiveTemplate(supabase, 'new_question');
            expect(result).toBeNull();
        });
    });

    describe('getMlAccessToken', () => {
        it('returns null when there is no active connection', async () => {
            enqueue([], null);

            const result = await getMlAccessToken(supabase);
            expect(result).toBeNull();
            expect(fn('from')).toHaveBeenCalledWith('ml_connection');
            expect(fn('eq')).toHaveBeenCalledWith('is_active', true);
            expect(fn('limit')).toHaveBeenCalledWith(1);
        });

        it('queries the active connection (stub getAccessToken returns null)', async () => {
            const conn = {
                id: 'conn-1',
                access_token_encrypted: 'enc',
                access_token_iv: 'iv',
                refresh_token_encrypted: 'ref',
                refresh_token_iv: 'iv2',
                token_expires_at: new Date(Date.now() + 3600000).toISOString(),
            };
            enqueue([conn], null);

            const result = await getMlAccessToken(supabase);
            // El stub local getAccessToken devuelve null por diseño (solo la
            // versión edge lo descifra de verdad).
            expect(result).toBeNull();
            expect(fn('select')).toHaveBeenCalledWith(
                'id, access_token_encrypted, access_token_iv, refresh_token_encrypted, refresh_token_iv, token_expires_at',
            );
        });
    });

    describe('sendQuestionAnswer', () => {
        it('posts the answer and updates the question', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(''),
            });
            vi.stubGlobal('fetch', fetchMock);
            enqueue(null, null); // update ml_questions

            await sendQuestionAnswer(supabase, '123', 'Respuesta de prueba', 'ml-token', 'idem-1');

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/answers?api_version=4'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        authorization: 'Bearer ml-token',
                        'content-type': 'application/json',
                        accept: 'application/json',
                        'x-format-new': 'true',
                        'x-idempotency-key': 'idem-1',
                    }),
                    body: JSON.stringify({ question_id: 123, text: 'Respuesta de prueba' }),
                }),
            );
            expect(fn('update')).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'answered',
                    answer_text: 'Respuesta de prueba',
                    date_updated: expect.any(String),
                }),
            );
            expect(fn('eq')).toHaveBeenCalledWith('question_id', '123');
        });

        it('omits the idempotency key when not provided', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(''),
            });
            vi.stubGlobal('fetch', fetchMock);
            enqueue(null, null);

            await sendQuestionAnswer(supabase, 'q-1', 'Hola', 'ml-token');

            const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
            expect((init.headers as Record<string, string>)['x-idempotency-key']).toBeUndefined();
        });

        it('throws on ML API error and does not update', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                text: () => Promise.resolve('Bad Request'),
            });
            vi.stubGlobal('fetch', fetchMock);

            await expect(
                sendQuestionAnswer(supabase, 'q-1', 'Test', 'ml-token'),
            ).rejects.toThrow('ML answer falló (400)');
            expect(fn('update')).not.toHaveBeenCalled();
        });
    });

    describe('sendOrderMessage', () => {
        it('posts the message with params and updates the order', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(''),
            });
            vi.stubGlobal('fetch', fetchMock);
            enqueue(null, null); // update ml_orders

            await sendOrderMessage(supabase, 'order-456', 'Hola comprador', 'ml-token', 'idem-2');

            const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/orders/order-456/messages?');
            expect(url).toContain('mark_as_read=true');
            expect((init as RequestInit).method).toBe('POST');
            expect((init as RequestInit).headers).toEqual(
                expect.objectContaining({
                    authorization: 'Bearer ml-token',
                    'content-type': 'application/json',
                    accept: 'application/json',
                    'x-idempotency-key': 'idem-2',
                }),
            );
            expect(fn('update')).toHaveBeenCalledWith({ auto_reply_sent: expect.any(String) });
            expect(fn('eq')).toHaveBeenCalledWith('order_id', 'order-456');
        });

        it('throws on ML API error', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal'),
            });
            vi.stubGlobal('fetch', fetchMock);

            await expect(
                sendOrderMessage(supabase, 'order-456', 'Hola', 'ml-token'),
            ).rejects.toThrow('ML order message falló (500)');
            expect(fn('update')).not.toHaveBeenCalled();
        });
    });
});
