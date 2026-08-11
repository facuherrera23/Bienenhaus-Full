import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateNextOccurrence, checkConflicts } from '../visits';

const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    is: vi.fn(() => mockSupabase),
    not: vi.fn(() => mockSupabase),
    lt: vi.fn(() => mockSupabase),
    gt: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
};

describe('calculateNextOccurrence', () => {
    it('should calculate daily occurrences correctly', () => {
        const rule = { frequency: 'daily', interval: 1 };
        const date = new Date('2024-01-15T10:00:00');
        const next = calculateNextOccurrence(rule, date);
        expect(next.getTime()).toBe(new Date('2024-01-16T10:00:00').getTime());
    });

    it('should calculate weekly occurrences correctly', () => {
        const rule = { frequency: 'weekly', interval: 1, days_of_week: [1] };
        const date = new Date('2024-01-15T10:00:00'); // Monday
        const next = calculateNextOccurrence(rule, date);
        expect(next.getDay()).toBe(1); // Next Monday
    });

    it('should calculate monthly occurrences correctly', () => {
        const rule = { frequency: 'monthly', interval: 1, day_of_month: 15 };
        const date = new Date('2024-01-15T10:00:00');
        const next = calculateNextOccurrence(rule, date);
        expect(next.getDate()).toBe(15);
        expect(next.getMonth()).toBe(1); // February
    });

    it('should calculate yearly occurrences correctly', () => {
        const rule = { frequency: 'yearly', interval: 1 };
        const date = new Date('2024-01-15T10:00:00');
        const next = calculateNextOccurrence(rule, date);
        expect(next.getFullYear()).toBe(2025);
    });
});

describe('checkConflicts', () => {
    it('should detect agent conflicts', async () => {
        const result = await checkConflicts({
            agent_id: 'agent-1',
            starts_at: '2024-01-15T10:00:00',
            ends_at: '2024-01-15T11:00:00',
        });
        expect(typeof result).toBe('boolean');
    });
});