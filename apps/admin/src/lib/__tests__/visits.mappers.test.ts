import { describe, expect, it } from 'vitest';
import {
    embedVisitEmail,
    embedVisitName,
    embedVisitPhone,
    embedVisitTitle,
    toVisitRow,
} from '../visits';

describe('Visits embed helpers', () => {
    describe('embedVisitName', () => {
        it('returns null for null input', () => {
            expect(embedVisitName(null)).toBeNull();
        });

        it('returns name from single object', () => {
            expect(embedVisitName({ name: 'Juan Pérez' })).toBe('Juan Pérez');
        });

        it('returns name from first element of array', () => {
            expect(embedVisitName([{ name: 'Juan Pérez' }, { name: 'María García' }])).toBe('Juan Pérez');
        });

        it('returns null for empty array', () => {
            expect(embedVisitName([])).toBeNull();
        });
    });

    describe('embedVisitEmail', () => {
        it('returns null for null input', () => {
            expect(embedVisitEmail(null)).toBeNull();
        });

        it('returns email from single object', () => {
            expect(embedVisitEmail({ email: 'juan@test.com' })).toBe('juan@test.com');
        });

        it('returns email from first element of array', () => {
            expect(embedVisitEmail([{ email: 'juan@test.com' }, { email: 'maria@test.com' }])).toBe('juan@test.com');
        });
    });

    describe('embedVisitPhone', () => {
        it('returns null for null input', () => {
            expect(embedVisitPhone(null)).toBeNull();
        });

        it('returns phone from single object', () => {
            expect(embedVisitPhone({ phone: '+54 11 1234-5678' })).toBe('+54 11 1234-5678');
        });

        it('returns phone from first element of array', () => {
            expect(embedVisitPhone([{ phone: '+54 11 1234-5678' }, { phone: '+54 11 8765-4321' }])).toBe('+54 11 1234-5678');
        });
    });

    describe('embedVisitTitle', () => {
        it('returns null for null input', () => {
            expect(embedVisitTitle(null)).toBeNull();
        });

        it('returns title from single object', () => {
            expect(embedVisitTitle({ title: 'Casa en Belgrano' })).toBe('Casa en Belgrano');
        });

        it('returns title from first element of array', () => {
            expect(embedVisitTitle([{ title: 'Casa 1' }, { title: 'Casa 2' }])).toBe('Casa 1');
        });
    });
});

describe('Visits mappers', () => {
    const baseVisit = {
        id: 'visit-1',
        lead_id: 'lead-1',
        property_id: 'prop-1',
        agent_id: 'agent-1',
        title: 'Visita a casa en Belgrano',
        description: 'Visita programada',
        starts_at: '2024-01-15T10:00:00Z',
        ends_at: '2024-01-15T11:00:00Z',
        status: 'scheduled' as const,
        location: 'Av. Cabildo 1234, Belgrano, CABA',
        meeting_type: 'in_person' as const,
        meeting_link: null,
        notes: 'Llevar llaves',
        reminder_sent: false,
        reminder_sent_at: null,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
        created_by: 'agent-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        lead: { name: 'Juan Pérez', email: 'juan@test.com', phone: '+54 11 1234-5678' },
        property: { title: 'Casa en Belgrano' },
        agent: { name: 'Carlos Agente' },
    };

    describe('toVisitRow', () => {
        it('maps visit with all embedded relations', () => {
            const result = toVisitRow(baseVisit);
            expect(result.id).toBe('visit-1');
            expect(result.lead_id).toBe('lead-1');
            expect(result.property_id).toBe('prop-1');
            expect(result.agent_id).toBe('agent-1');
            expect(result.title).toBe('Visita a casa en Belgrano');
            expect(result.description).toBe('Visita programada');
            expect(result.status).toBe('scheduled');
            expect(result.location).toBe('Av. Cabildo 1234, Belgrano, CABA');
            expect(result.meeting_type).toBe('in_person');
            expect(result.lead_name).toBe('Juan Pérez');
            expect(result.lead_email).toBe('juan@test.com');
            expect(result.lead_phone).toBe('+54 11 1234-5678');
            expect(result.property_title).toBe('Casa en Belgrano');
            expect(result.agent_name).toBe('Carlos Agente');
        });

        it('handles null lead', () => {
            const result = toVisitRow({ ...baseVisit, lead: null });
            expect(result.lead_name).toBeNull();
            expect(result.lead_email).toBeNull();
            expect(result.lead_phone).toBeNull();
        });

        it('handles null property', () => {
            const result = toVisitRow({ ...baseVisit, property: null });
            expect(result.property_title).toBeNull();
        });

        it('handles null agent', () => {
            const result = toVisitRow({ ...baseVisit, agent: null });
            expect(result.agent_name).toBeNull();
        });

        it('handles lead as array', () => {
            const result = toVisitRow({
                ...baseVisit,
                lead: [{ name: 'Juan Pérez', email: 'juan@test.com', phone: '+54 11 1234-5678' }],
            });
            expect(result.lead_name).toBe('Juan Pérez');
        });

        it('handles property as array', () => {
            const result = toVisitRow({
                ...baseVisit,
                property: [{ title: 'Casa 1' }, { title: 'Casa 2' }],
            });
            expect(result.property_title).toBe('Casa 1');
        });

        it('handles agent as array', () => {
            const result = toVisitRow({
                ...baseVisit,
                agent: [{ name: 'Carlos Agente' }, { name: 'Otro Agente' }],
            });
            expect(result.agent_name).toBe('Carlos Agente');
        });
    });
});