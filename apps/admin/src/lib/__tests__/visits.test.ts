import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { supabaseUrl } from '../supabase';
import { from } from '../../test/setup';
import {
    checkInWithQr,
    createAgentAvailability,
    createRecurringVisit,
    createReminders,
    createVisit,
    DAY_LABELS,
    DEFAULT_REMINDERS,
    deleteAgentAvailability,
    embedVisitEmail,
    embedVisitName,
    embedVisitPhone,
    embedVisitTitle,
    fetchAgentAvailability,
    fetchDeletedVisits,
    fetchVisit,
    fetchVisits,
    fetchVisitsByAgent,
    fetchVisitsByDateRange,
    fetchVisitsByLead,
    fetchVisitsByProperty,
    fetchVisitsByStatus,
    generateOccurrences,
    generateQrCode,
    getQrCode,
    MEETING_TYPE_LABEL,
    permanentDeleteVisit,
    processReminders,
    restoreVisit,
    softDeleteVisit,
    toVisitRow,
    updateAgentAvailability,
    updateVisit,
    updateVisitStatus,
    VISIT_STATUS_LABEL,
    VISIT_STATUS_TONE,
    VISITS_SELECT,
    type AgentAvailability,
    type QrCheckin,
    type RecurrenceRule,
    type RecurringVisit,
    type ReminderConfig,
    type VisitApiRow,
    type VisitRow,
} from '../visits';
import type {
    AgentAvailability,
    QrCheckin,
    RecurrenceRule,
    RecurringVisit,
    ReminderConfig,
    VisitApiRow,
    VisitRow,
} from '../visits';

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

// ============================================================
// Fixtures
// ============================================================

function makeVisitRow(overrides: Partial<VisitApiRow> = {}): VisitApiRow {
    return {
        id: 'v1',
        lead_id: 'l1',
        property_id: 'p1',
        agent_id: 'a1',
        title: 'Visita test',
        description: 'desc',
        starts_at: '2026-01-10T15:00:00.000Z',
        ends_at: '2026-01-10T16:00:00.000Z',
        status: 'programada',
        location: 'Oficina',
        meeting_type: 'presencial',
        meeting_link: null,
        notes: 'nota',
        reminder_sent: false,
        reminder_sent_at: null,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
        created_by: 'admin',
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
        deleted_at: null,
        lead: { name: 'Juan', email: 'juan@x.com', phone: '123456' },
        property: { title: 'Casa en Palermo' },
        agent: { name: 'Ana' },
        ...overrides,
    };
}

const availability: AgentAvailability = {
    id: 'av1',
    agent_id: 'a1',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '13:00',
    is_active: true,
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-01T10:00:00.000Z',
};

const baseVisit: VisitRow = {
    id: 'v1',
    lead_id: null,
    property_id: null,
    agent_id: null,
    title: 'Visita base',
    description: null,
    starts_at: '2026-01-01T10:00:00.000Z',
    ends_at: '2026-01-01T11:00:00.000Z',
    status: 'programada',
    location: null,
    meeting_type: null,
    meeting_link: null,
    notes: null,
    reminder_sent: false,
    reminder_sent_at: null,
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_by: null,
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-01T10:00:00.000Z',
    deleted_at: null,
    lead_name: null,
    lead_email: null,
    lead_phone: null,
    property_title: null,
    agent_name: null,
};

function makeRecurring(overrides: Partial<RecurringVisit> = {}): RecurringVisit {
    return {
        id: 1,
        base_visit_id: 'v1',
        rule: { frequency: 'daily', interval: 1, count: 2 },
        next_occurrence: '2099-01-01T10:00:00.000Z',
        occurrences_generated: 0,
        is_active: true,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
        ...overrides,
    };
}

function makeQr(overrides: Partial<QrCheckin> = {}): QrCheckin {
    return {
        id: 1,
        visit_id: 'v1',
        code: 'VIS-1234-ABC',
        checked_in: false,
        checked_in_at: null,
        checked_in_by: null,
        created_at: '2026-01-01T10:00:00.000Z',
        ...overrides,
    };
}

const reminderConfig: ReminderConfig = {
    id: 1,
    visit_id: 'v1',
    type: 'email',
    trigger_minutes_before: 1440,
    is_sent: false,
    sent_at: null,
    created_at: '2026-01-01T10:00:00.000Z',
};

// ============================================================
// Constantes
// ============================================================

describe('constantes de visitas', () => {
    it('VISIT_STATUS_LABEL traduce todos los estados', () => {
        expect(VISIT_STATUS_LABEL).toEqual({
            programada: 'Programada',
            confirmada: 'Confirmada',
            en_curso: 'En curso',
            completada: 'Completada',
            cancelada: 'Cancelada',
            no_show: 'No asistió',
        });
    });

    it('VISIT_STATUS_TONE asigna tonos a todos los estados', () => {
        expect(VISIT_STATUS_TONE).toEqual({
            programada: 'info',
            confirmada: 'success',
            en_curso: 'warning',
            completada: 'neutral',
            cancelada: 'danger',
            no_show: 'danger',
        });
    });

    it('MEETING_TYPE_LABEL traduce los tipos de reunión', () => {
        expect(MEETING_TYPE_LABEL).toEqual({
            presencial: 'Presencial',
            virtual: 'Virtual',
            telefono: 'Teléfono',
        });
    });

    it('DEFAULT_REMINDERS define 4 recordatorios por defecto', () => {
        expect(DEFAULT_REMINDERS).toHaveLength(4);
        expect(DEFAULT_REMINDERS[0]).toEqual({ type: 'email', trigger_minutes_before: 1440 });
    });

    it('DAY_LABELS lista los 7 días en español', () => {
        expect(DAY_LABELS).toHaveLength(7);
        expect(DAY_LABELS[0]).toBe('Domingo');
        expect(DAY_LABELS[6]).toBe('Sábado');
    });
});

// ============================================================
// Helpers embed*
// ============================================================

describe('helpers embed*', () => {
    it('embedVisitName extrae el nombre', () => {
        expect(embedVisitName(null)).toBeNull();
        expect(embedVisitName({ name: 'Ana' })).toBe('Ana');
        expect(embedVisitName([{ name: 'Ana' }, { name: 'Beto' }])).toBe('Ana');
        expect(embedVisitName([])).toBeNull();
    });

    it('embedVisitEmail extrae el email', () => {
        expect(embedVisitEmail(null)).toBeNull();
        expect(embedVisitEmail({ email: 'a@x.com' })).toBe('a@x.com');
        expect(embedVisitEmail([{ email: 'a@x.com' }])).toBe('a@x.com');
        expect(embedVisitEmail([])).toBeNull();
    });

    it('embedVisitPhone extrae el teléfono', () => {
        expect(embedVisitPhone(null)).toBeNull();
        expect(embedVisitPhone({ phone: '123' })).toBe('123');
        expect(embedVisitPhone([{ phone: '123' }])).toBe('123');
        expect(embedVisitPhone([])).toBeNull();
    });

    it('embedVisitTitle extrae el título', () => {
        expect(embedVisitTitle(null)).toBeNull();
        expect(embedVisitTitle({ title: 'Casa' })).toBe('Casa');
        expect(embedVisitTitle([{ title: 'Casa' }])).toBe('Casa');
        expect(embedVisitTitle([])).toBeNull();
    });
});

// ============================================================
// Mapper toVisitRow
// ============================================================

describe('toVisitRow', () => {
    it('mapea embeds como objeto', () => {
        const row = toVisitRow(makeVisitRow());
        expect(row.lead_name).toBe('Juan');
        expect(row.lead_email).toBe('juan@x.com');
        expect(row.lead_phone).toBe('123456');
        expect(row.property_title).toBe('Casa en Palermo');
        expect(row.agent_name).toBe('Ana');
        expect(row.status).toBe('programada');
        expect(row.reminder_sent).toBe(false);
        expect(row.meeting_type).toBe('presencial');
    });

    it('mapea embeds como array usando el primer elemento', () => {
        const row = toVisitRow(
            makeVisitRow({
                lead: [
                    { name: 'Juan', email: 'juan@x.com', phone: '1' },
                    { name: 'Pedro', email: 'p@x.com', phone: '2' },
                ],
                property: [{ title: 'Depto' }],
                agent: [{ name: 'Ana' }],
            }),
        );
        expect(row.lead_name).toBe('Juan');
        expect(row.lead_email).toBe('juan@x.com');
        expect(row.lead_phone).toBe('1');
        expect(row.property_title).toBe('Depto');
        expect(row.agent_name).toBe('Ana');
    });

    it('maneja embeds nulos y reminder_sent ausente', () => {
        const row = toVisitRow({
            ...makeVisitRow({ lead: null, property: null, agent: null }),
            reminder_sent: null,
        } as unknown as VisitApiRow);
        expect(row.lead_name).toBeNull();
        expect(row.lead_email).toBeNull();
        expect(row.property_title).toBeNull();
        expect(row.agent_name).toBeNull();
        expect(row.reminder_sent).toBe(false);
    });
});

// ============================================================
// Fetch
// ============================================================

describe('fetchVisits', () => {
    it('devuelve visitas activas ordenadas por starts_at', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        const rows = await fetchVisits();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe('Visita test');
        expect(rows[0].lead_name).toBe('Juan');
        expect(chain.select).toHaveBeenCalledWith(VISITS_SELECT);
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: true });
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'visits err' } }) });
        await expect(fetchVisits()).rejects.toThrow('visits err');
    });
});

describe('fetchVisit', () => {
    it('devuelve una visita por id', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: makeVisitRow(), error: null }) });
        const row = await fetchVisit('v1');
        expect(row.id).toBe('v1');
        expect(row.property_title).toBe('Casa en Palermo');
        expect(chain.eq).toHaveBeenCalledWith('id', 'v1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('lanza error si no existe', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(fetchVisit('v1')).rejects.toThrow('Visita no encontrada');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'visit err' } }) });
        await expect(fetchVisit('v1')).rejects.toThrow('visit err');
    });
});

describe('fetchDeletedVisits', () => {
    it('devuelve visitas eliminadas ordenadas por deleted_at', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [makeVisitRow({ deleted_at: '2026-02-01T10:00:00.000Z' })],
                error: null,
            }),
        });
        const rows = await fetchDeletedVisits();
        expect(rows).toHaveLength(1);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
        expect(chain.order).toHaveBeenCalledWith('deleted_at', { ascending: false });
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'deleted err' } }) });
        await expect(fetchDeletedVisits()).rejects.toThrow('deleted err');
    });
});

describe('fetchVisitsByAgent', () => {
    it('filtra por agente', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        const rows = await fetchVisitsByAgent('a1');
        expect(rows).toHaveLength(1);
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: true });
    });
});

describe('fetchVisitsByDateRange', () => {
    it('devuelve visitas en el rango sin agente', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        const rows = await fetchVisitsByDateRange('2026-01-01', '2026-01-31');
        expect(rows).toHaveLength(1);
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.gte).toHaveBeenCalledWith('starts_at', '2026-01-01');
        expect(chain.lte).toHaveBeenCalledWith('starts_at', '2026-01-31');
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: true });
        expect(chain.eq).not.toHaveBeenCalled();
    });

    it('filtra por agente cuando se provee', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        const rows = await fetchVisitsByDateRange('2026-01-01', '2026-01-31', 'a1');
        expect(rows).toHaveLength(1);
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a1');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'range err' } }) });
        await expect(fetchVisitsByDateRange('2026-01-01', '2026-01-31')).rejects.toThrow('range err');
    });
});

describe('fetchVisitsByLead / fetchVisitsByProperty / fetchVisitsByStatus', () => {
    it('filtra por lead', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        await fetchVisitsByLead('l1');
        expect(chain.eq).toHaveBeenCalledWith('lead_id', 'l1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: false });
    });

    it('filtra por propiedad', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        await fetchVisitsByProperty('p1');
        expect(chain.eq).toHaveBeenCalledWith('property_id', 'p1');
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: false });
    });

    it('filtra por estado', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [makeVisitRow()], error: null }) });
        await fetchVisitsByStatus('programada');
        expect(chain.eq).toHaveBeenCalledWith('status', 'programada');
        expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: true });
    });
});

// ============================================================
// CRUD
// ============================================================

describe('createVisit', () => {
    it('crea una visita con los valores provistos', async () => {
        const chain = mockFrom({ single: vi.fn().mockResolvedValue({ data: makeVisitRow(), error: null }) });
        const result = await createVisit({
            lead_id: '11111111-1111-1111-1111-111111111111',
            property_id: '22222222-2222-2222-2222-222222222222',
            agent_id: '33333333-3333-3333-3333-333333333333',
            title: 'Reunión',
            description: '',
            starts_at: '2026-01-10T15:00:00.000Z',
            ends_at: '2026-01-10T16:00:00.000Z',
            status: 'programada',
            location: '',
            meeting_type: 'presencial',
            meeting_link: null,
            notes: '',
        });
        expect(result.id).toBe('v1');
        expect(chain.insert).toHaveBeenCalledWith({
            lead_id: 'l1',
            property_id: 'p1',
            agent_id: 'a1',
            title: 'Reunión',
            description: null,
            starts_at: '2026-01-10T15:00:00.000Z',
            ends_at: '2026-01-10T16:00:00.000Z',
            status: 'programada',
            location: null,
            meeting_type: 'presencial',
            meeting_link: null,
            notes: null,
            reminder_sent: false,
        });
        expect(chain.select).toHaveBeenCalledWith(VISITS_SELECT);
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert err' } }) });
        await expect(
            createVisit({
                lead_id: '11111111-1111-1111-1111-111111111111',
                property_id: '22222222-2222-2222-2222-222222222222',
                agent_id: '33333333-3333-3333-3333-333333333333',
                title: 'Test Visit',
                description: '',
                starts_at: '2026-01-10T15:00:00.000Z',
                ends_at: '2026-01-10T16:00:00.000Z',
                status: 'programada',
                location: '',
                meeting_type: 'presencial',
                meeting_link: '',
                notes: '',
            }),
        ).rejects.toThrow('insert err');
    });
});

describe('updateVisit', () => {
    it('actualiza solo los campos provistos', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await updateVisit('v1', { title: 'Nuevo título', notes: '' });
        expect(chain.update).toHaveBeenCalledWith({ title: 'Nuevo título', notes: null });
        expect(chain.eq).toHaveBeenCalledWith('id', 'v1');
    });

    it('lanza error si falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'upd err' } }) });
        await expect(updateVisit('v1', { title: 'Valid Title' })).rejects.toThrow('upd err');
    });
});

describe('updateVisitStatus', () => {
    it('actualiza el estado', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await updateVisitStatus('v1', 'en_curso');
        expect(chain.update).toHaveBeenCalledWith({ status: 'en_curso' });
    });

    it('lanza error si falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'status err' } }) });
        await expect(updateVisitStatus('v1', 'en_curso')).rejects.toThrow('status err');
    });
});

describe('timestamps automáticos por estado', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('updateVisit agrega confirmed_at al confirmar', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await updateVisit('v1', { status: 'confirmada' });
        expect(chain.update).toHaveBeenCalledWith({
            status: 'confirmada',
            confirmed_at: '2026-01-15T10:00:00.000Z',
        });
    });

    it('updateVisitStatus agrega cancelled_at al cancelar', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await updateVisitStatus('v1', 'cancelada');
        expect(chain.update).toHaveBeenCalledWith({
            status: 'cancelada',
            cancelled_at: '2026-01-15T10:00:00.000Z',
        });
    });

    it('softDeleteVisit setea deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await softDeleteVisit('v1');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: '2026-01-15T10:00:00.000Z' });
    });
});

describe('restoreVisit / permanentDeleteVisit', () => {
    it('restaura una visita', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await restoreVisit('v1');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: null });
        expect(chain.eq).toHaveBeenCalledWith('id', 'v1');
    });

    it('elimina permanentemente una visita', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await permanentDeleteVisit('v1');
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 'v1');
    });

    it('lanza error si el borrado falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'del err' } }) });
        await expect(permanentDeleteVisit('v1')).rejects.toThrow('del err');
    });
});

// ============================================================
// Disponibilidad de agentes
// ============================================================

describe('fetchAgentAvailability', () => {
    it('devuelve la disponibilidad activa del agente', async () => {
        const chain = mockFrom({
            order: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: [availability], error: null }),
        });
        const rows = await fetchAgentAvailability('a1');
        expect(rows).toEqual([availability]);
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a1');
        expect(chain.eq).toHaveBeenCalledWith('is_active', true);
        expect(chain.order).toHaveBeenCalledWith('day_of_week', { ascending: true });
        expect(chain.order).toHaveBeenCalledWith('start_time', { ascending: true });
    });

    it('lanza error si la consulta falla', async () => {
        const chain = mockFrom({
            order: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: { message: 'avail err' } }),
        });
        await expect(fetchAgentAvailability('a1')).rejects.toThrow('avail err');
    });
});

describe('createAgentAvailability', () => {
    it('crea un slot de disponibilidad', async () => {
        const chain = mockFrom({ single: vi.fn().mockResolvedValue({ data: availability, error: null }) });
        const result = await createAgentAvailability({
            agent_id: 'a1',
            day_of_week: 1,
            start_time: '09:00',
            end_time: '13:00',
            is_active: true,
        });
        expect(result).toEqual(availability);
        expect(chain.insert).toHaveBeenCalledWith({
            agent_id: 'a1',
            day_of_week: 1,
            start_time: '09:00',
            end_time: '13:00',
            is_active: true,
        });
        expect(chain.select).toHaveBeenCalledWith('*');
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'avail insert err' } }) });
        await expect(
            createAgentAvailability({
                agent_id: 'a1',
                day_of_week: 1,
                start_time: '09:00',
                end_time: '13:00',
                is_active: true,
            }),
        ).rejects.toThrow('avail insert err');
    });
});

describe('updateAgentAvailability / deleteAgentAvailability', () => {
    it('actualiza un slot', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await updateAgentAvailability('av1', { is_active: false });
        expect(chain.update).toHaveBeenCalledWith({ is_active: false });
        expect(chain.eq).toHaveBeenCalledWith('id', 'av1');
    });

    it('elimina un slot', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await deleteAgentAvailability('av1');
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 'av1');
    });
});

// ============================================================
// Visitas recurrentes
// ============================================================

describe('createRecurringVisit', () => {
    it('crea una regla recurrente', async () => {
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 1, days_of_week: [1, 3] };
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { ...makeRecurring(), rule }, error: null }),
        });
        const result = await createRecurringVisit('v1', rule);
        expect(result.rule).toEqual(rule);
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                base_visit_id: 'v1',
                occurrences_generated: 0,
                is_active: true,
            }),
        );
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ next_occurrence: expect.any(String) }),
        );
        expect(chain.select).toHaveBeenCalledWith();
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'rec err' } }) });
        await expect(createRecurringVisit('v1', { frequency: 'daily', interval: 1 })).rejects.toThrow('rec err');
    });
});

describe('generateOccurrences', () => {
    const recurringRow = (overrides: Partial<RecurringVisit> = {}) => ({
        ...makeRecurring(overrides),
        base_visit: baseVisit,
    });

    it('lanza error si no encuentra la regla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'nf' } }) });
        await expect(generateOccurrences(1)).rejects.toThrow('Recurring visit not found');
    });

    it('no genera nada si la regla está inactiva', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: recurringRow({ is_active: false }), error: null }),
        });
        await expect(generateOccurrences(1)).resolves.toEqual({ created: 0, skipped: 0 });
        expect(chain.insert).not.toHaveBeenCalled();
        expect(chain.update).not.toHaveBeenCalled();
    });

    it('genera ocurrencias futuras hasta el límite de count', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: recurringRow(), error: null }),
        });
        const result = await generateOccurrences(1);
        expect(result).toEqual({ created: 2, skipped: 0 });
        expect(chain.insert).toHaveBeenCalledTimes(2);
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Visita base', status: 'programada', reminder_sent: false }),
        );
        expect(chain.update).toHaveBeenCalledWith(
            expect.objectContaining({ occurrences_generated: 2 }),
        );
    });

    it('saltea ocurrencias que ya existen', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: recurringRow(), error: null }),
            maybeSingle: vi
                .fn()
                .mockImplementationOnce(() => ({ data: { id: 'ex' }, error: null }))
                .mockResolvedValue({ data: null, error: null }),
        });
        const result = await generateOccurrences(1);
        expect(result).toEqual({ created: 2, skipped: 1 });
        expect(chain.insert).toHaveBeenCalledTimes(2);
        expect(chain.update).toHaveBeenCalledWith(
            expect.objectContaining({ occurrences_generated: 2 }),
        );
    });

    it('respeta las excepciones de la regla', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: recurringRow({
                    rule: { frequency: 'daily', interval: 1, count: 3, exceptions: ['2099-01-01'] },
                }),
                error: null,
            }),
        });
        const result = await generateOccurrences(1);
        expect(result).toEqual({ created: 3, skipped: 1 });
        expect(chain.update).toHaveBeenCalledWith(
            expect.objectContaining({ occurrences_generated: 3 }),
        );
    });

    it('no genera nada si la próxima ocurrencia está en el pasado', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: recurringRow({ next_occurrence: '2020-01-01T10:00:00.000Z' }),
                error: null,
            }),
        });
        const result = await generateOccurrences(1);
        expect(result).toEqual({ created: 0, skipped: 0 });
        expect(chain.insert).not.toHaveBeenCalled();
    });
});

// ============================================================
// Recordatorios
// ============================================================

describe('createReminders', () => {
    it('crea los recordatorios por defecto para la visita', async () => {
        const chain = mockFrom({ select: vi.fn().mockResolvedValue({ data: [reminderConfig], error: null }) });
        const result = await createReminders('v1');
        expect(result).toEqual([reminderConfig]);
        expect(chain.insert).toHaveBeenCalledWith(DEFAULT_REMINDERS.map((r) => ({ ...r, visit_id: 'v1' })));
        expect(chain.select).toHaveBeenCalledWith();
    });

    it('crea recordatorios personalizados', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await createReminders('v1', [{ type: 'sms', trigger_minutes_before: 30 }]);
        expect(chain.insert).toHaveBeenCalledWith([{ type: 'sms', trigger_minutes_before: 30, visit_id: 'v1' }]);
    });

    it('lanza error si falla', async () => {
        mockFrom({ select: vi.fn().mockResolvedValue({ data: null, error: { message: 'rem err' } }) });
        await expect(createReminders('v1')).rejects.toThrow('rem err');
    });
});

describe('processReminders', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('invoca la edge function y devuelve el resumen', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ sent: 3, failed: 1 }) });
        const result = await processReminders();
        expect(result).toEqual({ sent: 3, failed: 1 });
        expect(fetchMock).toHaveBeenCalledWith(`${supabaseUrl}/functions/v1/visits-process-reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    });

    it('devuelve ceros si la respuesta no trae datos', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
        await expect(processReminders()).resolves.toEqual({ sent: 0, failed: 0 });
    });

    it('lanza error si la respuesta no es ok', async () => {
        fetchMock.mockResolvedValue({ ok: false });
        await expect(processReminders()).rejects.toThrow('Error procesando recordatorios');
    });
});

// ============================================================
// QR Check-in
// ============================================================

describe('generateQrCode', () => {
    it('genera un código QR para la visita', async () => {
        const chain = mockFrom({ single: vi.fn().mockResolvedValue({ data: makeQr(), error: null }) });
        const result = await generateQrCode('v1');
        expect(result).toEqual(makeQr());
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ visit_id: 'v1', code: expect.stringMatching(/^VIS-v1-[A-Z0-9]+$/) }),
        );
        expect(chain.select).toHaveBeenCalledWith();
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'qr err' } }) });
        await expect(generateQrCode('v1')).rejects.toThrow('qr err');
    });
});

describe('checkInWithQr', () => {
    it('devuelve error para un código inválido', async () => {
        mockFrom({ single: vi.fn().mockResolvedValue({ data: null, error: { message: 'nf' } }) });
        const result = await checkInWithQr('BAD', 'a1');
        expect(result).toEqual({ success: false, message: 'Código QR inválido' });
    });

    it('rechaza visitas ya registradas', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({
                data: { ...makeQr({ checked_in: true }), visit: { agent_id: 'a1' } },
                error: null,
            }),
        });
        const result = await checkInWithQr('CODE', 'a1');
        expect(result).toEqual({ success: false, message: 'Esta visita ya fue registrada' });
    });

    it('rechaza un agente no asignado', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({
                data: { ...makeQr(), visit: { agent_id: 'otro' } },
                error: null,
            }),
        });
        const result = await checkInWithQr('CODE', 'a1');
        expect(result).toEqual({ success: false, message: 'No sos el agente asignado a esta visita' });
    });

    it('registra el check-in y actualiza la visita a en_curso', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: { ...makeQr(), visit: { agent_id: 'a1' } },
                error: null,
            }),
        });
        const result = await checkInWithQr('CODE', 'a1');
        expect(result.success).toBe(true);
        expect(result.visit).toEqual({ agent_id: 'a1' });
        expect(result.message).toBe('Check-in registrado correctamente');
        expect(chain.update).toHaveBeenCalledWith(
            expect.objectContaining({ checked_in: true, checked_in_by: 'a1' }),
        );
        expect(chain.update).toHaveBeenCalledWith({ status: 'en_curso' });
        expect(chain.eq).toHaveBeenCalledWith('code', 'CODE');
        expect(chain.eq).toHaveBeenCalledWith('id', 1);
    });

    it('devuelve error si falla la actualización', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: { ...makeQr(), visit: { agent_id: 'a1' } },
                error: null,
            }),
            eq: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: { message: 'upd err' } }),
        });
        const result = await checkInWithQr('CODE', 'a1');
        expect(result).toEqual({ success: false, message: 'Error al registrar' });
    });
});

describe('getQrCode', () => {
    it('devuelve el código QR existente', async () => {
        const chain = mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: makeQr(), error: null }) });
        const result = await getQrCode('v1');
        expect(result).toEqual(makeQr());
        expect(chain.eq).toHaveBeenCalledWith('visit_id', 'v1');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.limit).toHaveBeenCalledWith(1);
    });

    it('devuelve null cuando no existe', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(getQrCode('v1')).resolves.toBeNull();
    });
});
