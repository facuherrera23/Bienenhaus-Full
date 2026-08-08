import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase, supabaseUrl } from '../supabase';
import { from } from '../../test/setup';
import {
    answerMlQuestion,
    buildAuthorizeUrl,
    createMlAutoReplyTemplate,
    deleteMlAutoReplyTemplate,
    disconnectMl,
    fetchMlAutoReplyTemplates,
    fetchMlCategories,
    fetchMlListingTypes,
    fetchMlMeta,
    fetchMlMetrics,
    fetchMlOrders,
    fetchMlOverview,
    fetchMlQuestions,
    fetchMlQueue,
    fetchMlSettings,
    ML_REDIRECT_URI,
    setMlAppId,
    setMlDefaults,
    setMlEnabled,
    updateMlAutoReplyTemplate,
} from '../ml';
import {
    ML_OPERATION_LABEL,
    ML_SYNC_STATUS_LABEL,
    ML_SYNC_STATUS_TONE,
} from '../../types/ml';

// El mock de createClient (setup.tsx) no expone `rpc`; lo agregamos como vi.fn.
Object.assign(supabase as unknown as Record<string, unknown>, { rpc: vi.fn() });

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function mockFrom(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const chain = buildChain(overrides);
    (from as unknown as Mock).mockReturnValue(chain);
    return chain;
}

const fetchMock = vi.fn();

function mockSession(token: string | null): void {
    (supabase.auth.getSession as unknown as Mock).mockResolvedValue({
        data: { session: token ? { access_token: token } : null },
        error: null,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Constantes de dominio ML', () => {
    it('exponer labels de operaciones y estados de sync', () => {
        expect(ML_OPERATION_LABEL).toEqual({ publish: 'Publicar', update: 'Actualizar', delete: 'Eliminar' });
        expect(ML_SYNC_STATUS_LABEL).toEqual({
            pending: 'Pendiente',
            processing: 'Procesando',
            success: 'Éxito',
            failed: 'Falló',
            cancelled: 'Cancelada',
        });
        expect(ML_SYNC_STATUS_TONE).toEqual({
            pending: 'neutral',
            processing: 'warning',
            success: 'success',
            failed: 'danger',
            cancelled: 'neutral',
        });
    });

    it('exponer la redirect URI de OAuth', () => {
        expect(ML_REDIRECT_URI).toBe(`${supabaseUrl}/functions/v1/ml-oauth`);
    });
});

describe('fetchMlOverview', () => {
    it('devuelve el overview del rpc ml_get_connection', async () => {
        const data = { ml_enabled: true, connection: { id: 'conn-1', is_active: true } };
        (supabase.rpc as unknown as Mock).mockReturnValue({
            returns: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data, error: null }),
        });

        await expect(fetchMlOverview()).resolves.toEqual(data);
        expect(supabase.rpc).toHaveBeenCalledWith('ml_get_connection');
    });

    it('devuelve ML desactivado cuando el rpc no trae data', async () => {
        (supabase.rpc as unknown as Mock).mockReturnValue({
            returns: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });

        await expect(fetchMlOverview()).resolves.toEqual({ ml_enabled: false, connection: null });
    });

    it('lanza error cuando el rpc falla', async () => {
        (supabase.rpc as unknown as Mock).mockReturnValue({
            returns: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc boom' } }),
        });

        await expect(fetchMlOverview()).rejects.toThrow('rpc boom');
    });
});

describe('Setters de settings ML (upsertSetting)', () => {
    it('setMlEnabled inserta cuando la key no existe', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await setMlEnabled(true);

        expect(from).toHaveBeenCalledWith('site_settings');
        expect(chain.select).toHaveBeenCalledWith('id');
        expect(chain.eq).toHaveBeenCalledWith('key', 'ml_enabled');
        expect(chain.insert).toHaveBeenCalledWith({
            key: 'ml_enabled',
            value: { value: true },
            value_type: 'json',
            is_public: false,
        });
    });

    it('setMlEnabled actualiza cuando la key ya existe', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }) });

        await setMlEnabled(false);

        expect(chain.update).toHaveBeenCalledWith({ value: { value: false } });
        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
        expect(chain.insert).not.toHaveBeenCalled();
    });

    it('setMlAppId guarda el app id envuelto', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await setMlAppId('APP123');

        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'ml_app_id', value: { value: 'APP123' } }),
        );
    });

    it('setMlDefaults guarda los defaults de publicación', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
        const defaults = { category_id: 'c1', listing_type_id: 'gold_pro', condition: 'used' as const };

        await setMlDefaults(defaults);

        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'ml_defaults', value: defaults }),
        );
    });

    it('propaga el error del update', async () => {
        const updateEq = vi.fn().mockResolvedValue({ data: null, error: { message: 'update fail' } });
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
            update: vi.fn().mockReturnValue({ eq: updateEq }),
        });

        await expect(setMlEnabled(true)).rejects.toThrow('update fail');
        expect(updateEq).toHaveBeenCalledWith('id', 's1');
    });
});

describe('buildAuthorizeUrl', () => {
    it('construye la URL de autorización de MercadoLibre con parámetros codificados', () => {
        const url = buildAuthorizeUrl('app id');

        expect(url).toContain('https://auth.mercadolibre.com.ar/authorization');
        expect(url).toContain(`client_id=${encodeURIComponent('app id')}`);
        expect(url).toContain(`redirect_uri=${encodeURIComponent(`${supabaseUrl}/functions/v1/ml-oauth`)}`);

        const state = btoa(JSON.stringify({ admin: window.location.origin }));
        expect(url).toContain(`state=${encodeURIComponent(state)}`);
    });
});

describe('disconnectMl', () => {
    it('elimina todas las filas de ml_connection', async () => {
        const chain = mockFrom();

        await disconnectMl();

        expect(from).toHaveBeenCalledWith('ml_connection');
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.neq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000');
    });

    it('lanza error si el delete falla', async () => {
        mockFrom({ neq: vi.fn().mockResolvedValue({ data: null, error: { message: 'no delete' } }) });

        await expect(disconnectMl()).rejects.toThrow('no delete');
    });
});

describe('fetchMlQueue', () => {
    it('consulta las últimas 50 filas y mapea los campos de la propiedad', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 'q1',
                        property_id: 'p1',
                        operation: 'publish',
                        status: 'pending',
                        attempts: 1,
                        max_attempts: 3,
                        next_attempt_at: null,
                        ml_item_id: null,
                        last_error: null,
                        created_at: '2024-01-01T00:00:00Z',
                        property: { title: 'Depto Centro', code: 123 },
                    },
                ],
                error: null,
            }),
        });

        const rows = await fetchMlQueue();

        expect(from).toHaveBeenCalledWith('ml_sync_queue');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.limit).toHaveBeenCalledWith(50);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            id: 'q1',
            property_id: 'p1',
            operation: 'publish',
            status: 'pending',
            property_title: 'Depto Centro',
            property_code: 123,
        });
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'queue err' } }) });

        await expect(fetchMlQueue()).rejects.toThrow('queue err');
    });
});

describe('fetchMlMeta', () => {
    it('consulta el meta más reciente y convierte price a número', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 'm1',
                        property_id: 'p1',
                        ml_item_id: 'ML123',
                        status: 'active',
                        permalink: 'https://ml.com/item/ML123',
                        price: '123.45',
                        last_sync_at: '2024-01-01T00:00:00Z',
                        last_sync_status: 'success',
                        property: { title: 'Casa', code: 456 },
                    },
                ],
                error: null,
            }),
        });

        const rows = await fetchMlMeta();

        expect(from).toHaveBeenCalledWith('property_ml_meta');
        expect(chain.order).toHaveBeenCalledWith('last_sync_at', { ascending: false });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            property_id: 'p1',
            ml_item_id: 'ML123',
            status: 'active',
            price: 123.45,
            property_title: 'Casa',
            property_code: 456,
        });
    });

    it('mantiene price null si viene null', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [{ id: 'm2', property_id: 'p2', price: null }],
                error: null,
            }),
        });

        const rows = await fetchMlMeta();
        expect(rows[0].price).toBeNull();
    });
});

describe('Edge functions (fetch + token)', () => {
    it('fetchMlCategories usa el token de sesión y devuelve categorías', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: true, json: async () => [{ id: 'cat1', name: 'Casa' }] });

        await expect(fetchMlCategories()).resolves.toEqual([{ id: 'cat1', name: 'Casa' }]);

        const [url, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
        expect(url).toBe(`${supabaseUrl}/functions/v1/ml-categories`);
        expect(Object.values(options.headers)).toContain('Bearer tok');
    });

    it('fetchMlCategories lanza sin sesión activa', async () => {
        mockSession(null);

        await expect(fetchMlCategories()).rejects.toThrow('Sin sesión activa');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchMlCategories lanza cuando la respuesta no es ok', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: false });

        await expect(fetchMlCategories()).rejects.toThrow('No se pudieron cargar categorías');
    });

    it('fetchMlListingTypes usa su propio mensaje de error', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: false });

        await expect(fetchMlListingTypes()).rejects.toThrow('No se pudieron cargar tipos de publicación');
    });

    it('fetchMlMetrics usa su propio mensaje de error', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: false });

        await expect(fetchMlMetrics()).rejects.toThrow('No se pudieron cargar métricas');
    });

    it('answerMlQuestion hace POST del body con la respuesta', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

        await answerMlQuestion('q1', 'respuesta');

        const [url, options] = fetchMock.mock.calls[0] as [string, { method: string; body: string }];
        expect(url).toBe(`${supabaseUrl}/functions/v1/ml-answer-question`);
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ question_id: 'q1', answer: 'respuesta' });
    });

    it('answerMlQuestion lanza cuando falla la respuesta', async () => {
        mockSession('tok');
        fetchMock.mockResolvedValue({ ok: false });

        await expect(answerMlQuestion('q1', 'respuesta')).rejects.toThrow('Error respondiendo pregunta');
    });
});

describe('fetchMlQuestions / fetchMlOrders', () => {
    it('fetchMlQuestions devuelve preguntas ordenadas', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [{ id: 'question-1', question: '¿Aceptan mascotas?' }],
                error: null,
            }),
        });

        const rows = await fetchMlQuestions();

        expect(from).toHaveBeenCalledWith('ml_questions');
        expect(chain.order).toHaveBeenCalledWith('received_at', { ascending: false });
        expect(chain.limit).toHaveBeenCalledWith(50);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('question-1');
    });

    it('fetchMlOrders devuelve órdenes ordenadas', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [{ id: 'order-1', status: 'confirmed' }],
                error: null,
            }),
        });

        const rows = await fetchMlOrders();

        expect(from).toHaveBeenCalledWith('ml_orders');
        expect(chain.order).toHaveBeenCalledWith('received_at', { ascending: false });
        expect(rows[0].id).toBe('order-1');
    });
});

describe('Plantillas de auto-respuesta', () => {
    it('fetchMlAutoReplyTemplates lista plantillas ordenadas por fecha', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [{ id: 1, name: 'Bienvenida', trigger: 'new_question', message: 'Hola', is_active: true }],
                error: null,
            }),
        });

        const rows = await fetchMlAutoReplyTemplates();

        expect(from).toHaveBeenCalledWith('ml_auto_reply_templates');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(rows[0].name).toBe('Bienvenida');
    });

    it('createMlAutoReplyTemplate inserta y devuelve la fila', async () => {
        const template = { name: 'Nueva', trigger: 'new_question' as const, message: 'Hola!', is_active: true };
        const chain = mockFrom({
            single: vi.fn().mockReturnThis(),
            returns: vi.fn().mockResolvedValue({ data: { id: 2, ...template }, error: null }),
        });

        const created = await createMlAutoReplyTemplate(template);

        expect(chain.insert).toHaveBeenCalledWith(template);
        expect(created).toMatchObject({ id: 2, name: 'Nueva' });
    });

    it('updateMlAutoReplyTemplate actualiza por id', async () => {
        const chain = mockFrom({
            single: vi.fn().mockReturnThis(),
            returns: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Editada' }, error: null }),
        });

        await updateMlAutoReplyTemplate(1, { name: 'Editada' });

        expect(chain.update).toHaveBeenCalledWith({ name: 'Editada' });
        expect(chain.eq).toHaveBeenCalledWith('id', 1);
    });

    it('deleteMlAutoReplyTemplate elimina por id', async () => {
        const chain = mockFrom();

        await deleteMlAutoReplyTemplate(1);

        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 1);
    });
});

describe('fetchMlSettings', () => {
    it('combina app_id y defaults desde site_settings', async () => {
        mockFrom({
            in: vi.fn().mockResolvedValue({
                data: [
                    { key: 'ml_app_id', value: { value: 'APP1' } },
                    { key: 'ml_defaults', value: { category_id: 'c1', listing_type_id: 'gold_pro', condition: 'used' } },
                ],
                error: null,
            }),
        });

        const settings = await fetchMlSettings();

        expect(from).toHaveBeenCalledWith('site_settings');
        expect(settings).toEqual({
            app_id: 'APP1',
            defaults: { category_id: 'c1', listing_type_id: 'gold_pro', condition: 'used' },
        });
    });

    it('devuelve valores por defecto cuando no hay filas', async () => {
        mockFrom({ in: vi.fn().mockResolvedValue({ data: [], error: null }) });

        await expect(fetchMlSettings()).resolves.toEqual({
            app_id: '',
            defaults: { category_id: '', listing_type_id: 'gold_pro', condition: 'used' },
        });
    });
});
