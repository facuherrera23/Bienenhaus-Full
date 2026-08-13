import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateQrCheckin } from '../_shared/visits-validation';

describe('visits QR validation', () => {
    describe('validateQrCheckin', () => {
        it('validates correct QR checkin payload', () => {
            const result = validateQrCheckin({
                visitId: '123e4567-e89b-12d3-a456-426614174000',
                agentLat: -34.6037,
                agentLng: -58.3816,
                photoBase64: 'base64string',
            });
            expect(result.valid).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('requires visitId', () => {
            const result = validateQrCheckin({
                agentLat: -34.6037,
                agentLng: -58.3816,
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('visitId');
        });

        it('validates visitId format', () => {
            const result = validateQrCheckin({
                visitId: 'not-uuid',
            });
            expect(result.valid).toBe(false);
        });

        it('validates latitude range', () => {
            const result = validateQrCheckin({
                visitId: '123e4567-e89b-12d3-a456-426614174000',
                agentLat: 100,
            });
            expect(result.valid).toBe(false);
        });

        it('validates longitude range', () => {
            const result = validateQrCheckin({
                visitId: '123e4567-e89b-12d3-a456-426614174000',
                agentLng: -200,
            });
            expect(result.valid).toBe(false);
        });

        it('allows optional photoBase64', () => {
            const result = validateQrCheckin({
                visitId: '123e4567-e89b-12d3-a456-426614174000',
                photoBase64: 'base64string',
            });
            expect(result.valid).toBe(true);
        });
    });
});
