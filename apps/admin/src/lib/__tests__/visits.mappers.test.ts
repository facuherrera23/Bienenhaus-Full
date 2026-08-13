import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    embedVisitEmail,
    embedVisitName,
    embedVisitPhone,
    embedVisitTitle,
    toVisitRow,
} from '../visits';

describe('visits mappers', () => {
    const baseApiRow = {
        id: 'visit-1',
        lead_id: 'lead-1',
        property_id: 'prop-1',
        agent_id: 'agent-1',
        title: 'Visita Test',
        description: 'Descripción test',
        starts_at: '2024-01-15T10:00:00Z',
        ends_at: '2024-01-15T11:00:00Z',
        status: 'programada',
        location: 'Calle 123',
        meeting_type: 'presencial',
        meeting_link: null,
        notes: null,
        reminder_sent: false,
        reminder_sent_at: null,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        lead: { name: 'Juan Pérez', email: 'juan@test.com', phone: '+54 9 11 1234-5678' },
        property: { title: 'Casa Test' },
        agent: { name: 'Agente 1' },
    } as any;

    describe('toVisitRow', () => {
        it('maps nested property object correctly', () => {
            const mapped = toVisitRow(baseApiRow);
            expect(mapped.lead_name).toBe('Juan Pérez');
            expect(mapped.lead_email).toBe('juan@test.com');
            expect(mapped.lead_phone).toBe('+54 9 11 1234-5678');
            expect(mapped.property_title).toBe('Casa Test');
            expect(mapped.agent_name).toBe('Agente 1');
        });

        it('handles array property', () => {
            const row = { ...baseApiRow, property: [{ title: 'Array Casa' }] };
            const mapped = toVisitRow(row);
            expect(mapped.property_title).toBe('Array Casa');
        });

        it('handles null property', () => {
            const row = { ...baseApiRow, property: null };
            const mapped = toVisitRow(row);
            expect(mapped.property_title).toBeNull();
        });

        it('handles null lead', () => {
            const row = { ...baseApiRow, lead: null };
            const mapped = toVisitRow(row);
            expect(mapped.lead_name).toBeNull();
            expect(mapped.lead_email).toBeNull();
            expect(mapped.lead_phone).toBeNull();
        });

        it('handles array lead', () => {
            const row = {
                ...baseApiRow,
                lead: [
                    { name: 'Array Lead', email: 'array@test.com', phone: '+54 9 11 9999-9999' },
                ],
            };
            const mapped = toVisitRow(row);
            expect(mapped.lead_name).toBe('Array Lead');
        });

        it('handles null agent', () => {
            const row = { ...baseApiRow, agent: null };
            const mapped = toVisitRow(row);
            expect(mapped.agent_name).toBeNull();
        });
    });

    describe('embedVisitName', () => {
        it('handles null', () => {
            expect(embedVisitName(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedVisitName({ name: 'Juan Pérez' })).toBe('Juan Pérez');
        });

        it('handles array', () => {
            expect(embedVisitName([{ name: 'Juan Pérez' }])).toBe('Juan Pérez');
        });

        it('handles empty array', () => {
            expect(embedVisitName([])).toBeNull();
        });
    });

    describe('embedVisitEmail', () => {
        it('handles null', () => {
            expect(embedVisitEmail(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedVisitEmail({ email: 'test@test.com' })).toBe('test@test.com');
        });

        it('handles array', () => {
            expect(embedVisitEmail([{ email: 'test@test.com' }])).toBe('test@test.com');
        });
    });

    describe('embedVisitPhone', () => {
        it('handles null', () => {
            expect(embedVisitPhone(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedVisitPhone({ phone: '+54 9 11 1234-5678' })).toBe('+54 9 11 1234-5678');
        });
    });

    describe('embedVisitTitle', () => {
        it('handles null', () => {
            expect(embedVisitTitle(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedVisitTitle({ title: 'Casa Test' })).toBe('Casa Test');
        });

        it('handles array', () => {
            expect(embedVisitTitle([{ title: 'Casa Test' }])).toBe('Casa Test');
        });
    });
});
