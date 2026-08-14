import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { from } from '../../test/setup';
import {
    bulkCreateSubscribers,
    bulkDeleteSubscribers,
    bulkUpdateSubscribers,
    countSubscribers,
    createSubscriber,
    deleteSubscriber,
    exportSubscribersToCSV,
    fetchDeletedSubscribers,
    fetchSubscriber,
    fetchSubscribers,
    permanentDeleteSubscriber,
    restoreSubscriber,
    softDeleteSubscriber,
    subscribeFromLanding,
    unsubscribeSubscriber,
    updateSubscriber,
} from '../newsletter';
import { NEWSLETTER_SOURCE_LABEL, NEWSLETTER_STATUS_LABEL } from '../../types/newsletter';

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
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

function apiRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 's1',
        email: 'ana@example.com',
        source: 'landing_footer',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        deleted_at: null,
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Constantes de newsletter', () => {
    it('exponen labels de fuentes y estados', () => {
        expect(NEWSLETTER_SOURCE_LABEL).toEqual({
            landing_footer: 'Landing',
            manual: 'Manual',
            otro: 'Otro',
        });
        expect(NEWSLETTER_STATUS_LABEL).toEqual({
            active: 'Activo',
            unsubscribed: 'Desuscrito',
            bounced: 'Rebotado',
            complained: 'Marcado como spam',
        });
    });
});

describe('fetchSubscribers', () => {
    it('consulta suscriptores activos paginados', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [apiRow()], error: null }),
        });

        const rows = await fetchSubscribers();

        expect(from).toHaveBeenCalledWith('newsletter_subscribers');
        expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('email, source, status'));
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        // Default page 1, pageSize 50
        expect(chain.range).toHaveBeenCalledWith(0, 49);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ id: 's1', email: 'ana@example.com' });
    });

    it('aplica filtros de estado, fuente y búsqueda con escape', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [], error: null }),
        });

        await fetchSubscribers({
            status: 'active',
            source: 'manual',
            search: 'a%b_c',
            page: 3,
            pageSize: 20,
        });

        expect(chain.eq).toHaveBeenCalledWith('status', 'active');
        expect(chain.eq).toHaveBeenCalledWith('source', 'manual');
        expect(chain.ilike).toHaveBeenCalledWith('email', '%a\\%b\\_c%');
        // offset = (3-1)*20 = 40
        expect(chain.range).toHaveBeenCalledWith(40, 59);
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'list err' } }),
        });

        await expect(fetchSubscribers()).rejects.toThrow('list err');
    });
});

describe('fetchSubscriber', () => {
    it('devuelve el suscriptor por id', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: apiRow(), error: null }),
        });

        const row = await fetchSubscriber('s1');

        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
        expect(row).toMatchObject({ id: 's1', email: 'ana@example.com' });
    });

    it('lanza "Suscriptor no encontrado" si no hay data', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await expect(fetchSubscriber('s1')).rejects.toThrow('Suscriptor no encontrado');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });

        await expect(fetchSubscriber('s1')).rejects.toThrow('boom');
    });
});

describe('fetchDeletedSubscribers', () => {
    it('consulta suscriptores eliminados ordenados por deleted_at', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [apiRow()], error: null }),
        });

        const rows = await fetchDeletedSubscribers({ page: 2, pageSize: 25 });

        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
        expect(chain.order).toHaveBeenCalledWith('deleted_at', { ascending: false });
        expect(chain.range).toHaveBeenCalledWith(25, 49);
        expect(rows).toHaveLength(1);
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'deleted err' } }),
        });

        await expect(fetchDeletedSubscribers()).rejects.toThrow('deleted err');
    });
});

describe('countSubscribers', () => {
    it('cuenta suscriptores activos (sin deleted_at)', async () => {
        const chain = mockFrom({
            is: vi.fn().mockResolvedValue({ count: 12, error: null }),
        });

        await expect(countSubscribers()).resolves.toBe(12);

        expect(chain.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('incluye eliminados cuando includeDeleted es true', async () => {
        const chain = mockFrom({
            select: vi.fn().mockResolvedValue({ count: 20, error: null }),
        });

        await expect(countSubscribers({ includeDeleted: true })).resolves.toBe(20);

        expect(chain.is).not.toHaveBeenCalled();
    });

    it('aplica filtros de estado y fuente', async () => {
        const chain = mockFrom({});
        (chain.eq as Mock)
            .mockImplementationOnce(() => chain)
            .mockResolvedValue({ count: 5, error: null });

        await expect(countSubscribers({ status: 'active', source: 'manual' })).resolves.toBe(5);

        expect(chain.eq).toHaveBeenCalledWith('status', 'active');
        expect(chain.eq).toHaveBeenCalledWith('source', 'manual');
    });

    it('devuelve 0 cuando no hay count', async () => {
        mockFrom({ is: vi.fn().mockResolvedValue({ count: null, error: null }) });

        await expect(countSubscribers()).resolves.toBe(0);
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            is: vi.fn().mockResolvedValue({ count: null, error: { message: 'count err' } }),
        });

        await expect(countSubscribers()).rejects.toThrow('count err');
    });
});

describe('createSubscriber', () => {
    it('crea un suscriptor nuevo cuando no existe', async () => {
        const chain = mockFrom({
            // 1ra llamada: chequeo de existencia; 2da: fetchSubscriber tras el insert
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValue({ data: apiRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
        });

        const created = await createSubscriber({ email: 'ana@example.com' });

        expect(chain.eq).toHaveBeenCalledWith('email', 'ana@example.com');
        expect(chain.insert).toHaveBeenCalledWith({
            email: 'ana@example.com',
            source: 'manual',
            status: 'active',
        });
        expect(created).toMatchObject({ id: 's1', email: 'ana@example.com' });
    });

    it('restaura un suscriptor previamente eliminado', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({
                    data: { id: 'old1', deleted_at: '2024-01-01T00:00:00Z' },
                    error: null,
                })
                .mockResolvedValue({ data: apiRow(), error: null }),
        });

        await createSubscriber({ email: 'ana@example.com', source: 'landing_footer' });

        expect(chain.update).toHaveBeenCalledWith({
            deleted_at: null,
            status: 'active',
            source: 'landing_footer',
        });
        expect(chain.eq).toHaveBeenCalledWith('id', 'old1');
    });

    it('actualiza un suscriptor existente activo', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({ data: { id: 'old1', deleted_at: null }, error: null })
                .mockResolvedValue({ data: apiRow(), error: null }),
        });

        await createSubscriber({ email: 'ana@example.com', status: 'unsubscribed' });

        expect(chain.update).toHaveBeenCalledWith({ status: 'unsubscribed', source: 'manual' });
        expect(chain.eq).toHaveBeenCalledWith('id', 'old1');
        expect(chain.insert).not.toHaveBeenCalled();
    });

    it('lanza error si el chequeo de existencia falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'check err' } }),
        });

        await expect(createSubscriber({ email: 'ana@example.com' })).rejects.toThrow('check err');
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert err' } }),
        });

        await expect(createSubscriber({ email: 'ana@example.com' })).rejects.toThrow('insert err');
    });
});

describe('updateSubscriber', () => {
    it('actualiza estado y fuente, y devuelve el suscriptor', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: apiRow(), error: null }),
        });

        const updated = await updateSubscriber('s1', { status: 'bounced', source: 'otro' });

        expect(chain.update).toHaveBeenCalledWith({ status: 'bounced', source: 'otro' });
        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(updated).toMatchObject({ id: 's1' });
    });

    it('lanza error si el update falla', async () => {
        mockFrom({ is: vi.fn().mockResolvedValue({ data: null, error: { message: 'upd err' } }) });

        await expect(updateSubscriber('s1', {})).rejects.toThrow('upd err');
    });
});

describe('deleteSubscriber', () => {
    it('hace soft delete seteando deleted_at', async () => {
        const chain = mockFrom();

        await deleteSubscriber('s1');

        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
        expect(chain.delete).not.toHaveBeenCalled();
    });

    it('hace delete permanente cuando permanent es true', async () => {
        const chain = mockFrom();

        await deleteSubscriber('s1', true);

        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
    });

    it('lanza error si el delete falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'del err' } }) });

        await expect(deleteSubscriber('s1')).rejects.toThrow('del err');
    });
});

describe('softDeleteSubscriber / permanentDeleteSubscriber / restoreSubscriber', () => {
    it('softDeleteSubscriber delega en deleteSubscriber soft', async () => {
        const chain = mockFrom();

        await softDeleteSubscriber('s1');

        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('permanentDeleteSubscriber delega en deleteSubscriber permanente', async () => {
        const chain = mockFrom();

        await permanentDeleteSubscriber('s1');

        expect(chain.delete).toHaveBeenCalled();
    });

    it('restoreSubscriber limpia deleted_at y devuelve el suscriptor', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: apiRow(), error: null }),
        });

        const restored = await restoreSubscriber('s1');

        expect(chain.update).toHaveBeenCalledWith({ deleted_at: null });
        expect(chain.eq).toHaveBeenCalledWith('id', 's1');
        expect(restored).toMatchObject({ id: 's1' });
    });
});

describe('Operaciones bulk', () => {
    it('bulkCreateSubscribers cuenta creados y omitidos', async () => {
        mockFrom({
            // email 1: check null -> insert ok -> fetch row
            // email 2: check null -> insert falla -> skip
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({ data: apiRow(), error: null })
                .mockResolvedValue({ data: null, error: null }),
            single: vi
                .fn()
                .mockResolvedValueOnce({ data: { id: 's1' }, error: null })
                .mockResolvedValue({ data: null, error: { message: 'dup' } }),
        });

        await expect(bulkCreateSubscribers(['a@a.com', 'b@b.com'], 'manual')).resolves.toEqual({
            created: 1,
            skipped: 1,
        });
    });

    it('bulkUpdateSubscribers cuenta los actualizados e ignora errores', async () => {
        const chain = mockFrom({
            is: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
                .mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: apiRow(), error: null }),
        });

        await expect(bulkUpdateSubscribers(['a1', 'b1'], { status: 'active' })).resolves.toBe(1);

        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('bulkDeleteSubscribers cuenta eliminados (soft) e ignora errores', async () => {
        mockFrom({
            eq: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
                .mockResolvedValue({ data: null, error: null }),
        });

        await expect(bulkDeleteSubscribers(['a1', 'b1'])).resolves.toBe(1);
    });

    it('bulkDeleteSubscribers con permanent elimina de verdad', async () => {
        const chain = mockFrom();

        await expect(bulkDeleteSubscribers(['a1'], true)).resolves.toBe(1);

        expect(chain.delete).toHaveBeenCalled();
    });
});

describe('exportSubscribersToCSV', () => {
    it('genera CSV con headers y labels', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    apiRow({
                        email: 'ana@example.com',
                        source: 'landing_footer',
                        status: 'active',
                    }),
                    apiRow({
                        id: 's2',
                        email: 'juan@example.com',
                        source: 'manual',
                        status: 'bounced',
                    }),
                ],
                error: null,
            }),
        });

        const csv = await exportSubscribersToCSV({ status: 'active' });

        expect(csv).toContain('Email,Estado,Fuente,Fecha de suscripción');
        expect(csv).toContain('ana@example.com,Activo,Landing');
        expect(csv).toContain('juan@example.com,Rebotado,Manual');
    });

    it('usa pageSize máximo de 10000', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });

        await exportSubscribersToCSV();

        expect(chain.range).toHaveBeenCalledWith(0, 9999);
    });

    it('devuelve mensaje cuando no hay suscriptores', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });

        await expect(exportSubscribersToCSV()).resolves.toBe('No hay suscriptores para exportar');
    });
});

describe('subscribeFromLanding', () => {
    it('devuelve éxito cuando se registra el suscriptor', async () => {
        mockFrom({
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValue({ data: apiRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
        });

        await expect(subscribeFromLanding({ email: 'ana@example.com' })).resolves.toEqual({
            success: true,
            message: 'Suscriptor registrado correctamente',
        });
    });

    it('usa landing_footer como fuente por defecto', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValue({ data: apiRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
        });

        await subscribeFromLanding({ email: 'ana@example.com' });

        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ source: 'landing_footer' }),
        );
    });

    it('devuelve el error sin lanzar cuando falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });

        await expect(subscribeFromLanding({ email: 'ana@example.com' })).resolves.toEqual({
            success: false,
            message: 'boom',
        });
    });
});

describe('unsubscribeSubscriber', () => {
    it('da de baja a un suscriptor existente', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }),
        });

        await expect(unsubscribeSubscriber('ana@example.com')).resolves.toEqual({
            success: true,
            message: 'Suscriptor dado de baja correctamente',
        });

        expect(chain.eq).toHaveBeenCalledWith('email', 'ana@example.com');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('devuelve no encontrado sin suscriptor', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });

        await expect(unsubscribeSubscriber('nobody@example.com')).resolves.toEqual({
            success: false,
            message: 'Suscriptor no encontrado',
        });
    });

    it('devuelve el error cuando la búsqueda falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'q err' } }),
        });

        await expect(unsubscribeSubscriber('ana@example.com')).resolves.toEqual({
            success: false,
            message: 'q err',
        });
    });
});
