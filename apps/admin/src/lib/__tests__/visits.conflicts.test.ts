import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateNextOccurrence, checkConflicts } from '../visits';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        neq: vi.fn(() => mockSupabase),
        lt: vi.fn(() => mockSupabase),
        gt: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        insert: vi.fn(() => mockSupabase),
        update: vi.fn(() => mockSupabase),
        delete: vi.fn(() => mockSupabase),
        returns: vi.fn(() => mockSupabase),
        auth: {
            getUser: vi.fn(),
        },
        storage: {
            from: vi.fn(),
        },
        rpc: vi.fn().mockResolvedValue({ error: null }),
    };
    return { mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabase,
}));

describe.skip('visits conflicts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validFormValues = {
        lead_id: 'lead-1',
        property_id: 'prop-1',
        agent_id: 'agent-1',
        title: 'Visita Test',
        description: 'DescripciÃ³n test',
        starts_at: '2024-01-15T10:00:00Z',
        ends_at: '2024-01-15T11:00:00Z',
        status: 'programada',
        location: 'Calle 123',
        meeting_type: 'presencial',
        meeting_link: null,
        notes: null,
    };

    describe('checkConflicts', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('returns no errors when no conflicts', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ day_of_week: 0, start_time: '09:00', end_time: '18:00' }],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            // Mock the checkConflicts function
            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues);
            expect(conflicts).toHaveLength(0);
        });

        it('detects agent not available', async () => {
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues);
            expect(conflicts).toContain('Agente no disponible en ese horario');
        });

        it('detects double booking for agent', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ day_of_week: 0, start_time: '09:00', end_time: '18:00' }],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({
                data: [
                    {
                        id: 'visit-2',
                        title: 'Otra visita',
                        starts_at: '2024-01-15T09:00:00Z',
                        ends_at: '2024-01-15T10:00:00Z',
                    },
                ],
                error: null,
            });

            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues);
            expect(conflicts).toContain('Conflicto con: Otra visita');
        });

        it('detects lead double booking', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ day_of_week: 0, start_time: '09:00', end_time: '18:00' }],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { id: 'visit-3', title: 'Visita del lead' },
                error: null,
            });

            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues);
            expect(conflicts).toContain('Lead ya tiene visita en ese horario');
        });

        it('detects property double booking', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ day_of_week: 0, start_time: '09:00', end_time: '18:00' }],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { id: 'visit-4', title: 'Visita de la propiedad' },
                error: null,
            });

            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues);
            expect(conflicts).toContain('Propiedad ya tiene visita en ese horario');
        });

        it('excludes current visit when updating', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ day_of_week: 0, start_time: '09:00', end_time: '18:00' }],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const { checkConflicts: checkConflictsFn } = await import('../visits');
            const conflicts = await checkConflictsFn(validFormValues, 'visit-1');
            expect(conflicts).toHaveLength(0);
        });
    });

    describe('calculateNextOccurrence', () => {
        it('calculates daily occurrence', () => {
            const rule = { frequency: 'daily' as const, interval: 2 };
            const from = new Date('2024-01-15T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getDate()).toBe(from.getDate() + 2);
            expect(next.getHours()).toBe(10);
        });

        it('calculates weekly occurrence with specific days', () => {
            const rule = { frequency: 'weekly' as const, interval: 1, days_of_week: [1, 3] }; // Mon, Wed
            const from = new Date('2024-01-15T10:00:00Z'); // Monday
            const next = calculateNextOccurrence(rule, from);
            expect(next.getDay()).toBe(3); // Wednesday
        });

        it('calculates weekly occurrence without specific days', () => {
            const rule = { frequency: 'weekly' as const, interval: 2 };
            const from = new Date('2024-01-15T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getDate()).toBe(from.getDate() + 14);
        });

        it('calculates monthly occurrence with day_of_month', () => {
            const rule = { frequency: 'monthly' as const, interval: 1, day_of_month: 15 };
            const from = new Date('2024-01-10T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getMonth()).toBe(from.getMonth() + 1);
            expect(next.getDate()).toBe(15);
        });

        it('calculates monthly occurrence without day_of_month', () => {
            const rule = { frequency: 'monthly' as const, interval: 1 };
            const from = new Date('2024-01-15T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getMonth()).toBe(from.getMonth() + 1);
            expect(next.getDate()).toBe(15); // same day
        });

        it('calculates yearly occurrence', () => {
            const rule = { frequency: 'yearly' as const, interval: 2 };
            const from = new Date('2024-01-15T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getFullYear()).toBe(from.getFullYear() + 2);
        });

        it('preserves time', () => {
            const rule = { frequency: 'daily' as const, interval: 1 };
            const from = new Date('2024-01-15T14:30:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getHours()).toBe(14);
            expect(next.getMinutes()).toBe(30);
        });

        it('handles weekly with no matching days (defaults to interval)', () => {
            const rule = { frequency: 'weekly' as const, interval: 1, days_of_week: [] };
            const from = new Date('2024-01-15T10:00:00Z');
            const next = calculateNextOccurrence(rule, from);
            expect(next.getDate()).toBe(from.getDate() + 7);
        });
    });
});
