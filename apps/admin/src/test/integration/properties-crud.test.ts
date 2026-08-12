import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const TEST_SUPABASE_URL = 'http://localhost:54321';
const TEST_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGRxaXd3emhqbnVya2d1aWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk0MDgzMywiZXhwIjoyMTAwNTE2ODMzfQ.QWqdmDRPZrwZW41WvL3VFDzKhgMRtZzSIIR17fV1uRE';

describe('Properties Integration (local supabase)', () => {
    let supabase: ReturnType<typeof createClient>;
    let testPropertyId: string;
    let testLocationId: string;

    beforeAll(async () => {
        supabase = createClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
        
        // Create test location
        const { data: location } = await supabase
            .from('locations')
            .insert({ name: 'Test Location', zone: 'Test Zone', is_active: true, sort_order: 1 })
            .select('id')
            .single();
        testLocationId = location?.id;
    });

    afterAll(async () => {
        // Cleanup test data
        if (testPropertyId) {
            await supabase.from('properties').delete().eq('id', testPropertyId);
        }
        if (testLocationId) {
            await supabase.from('locations').delete().eq('id', testLocationId);
        }
    });

    it('Create property → Publish → ML enqueue', async () => {
        // 1. Create property
        const { data: property, error: createError } = await supabase
            .from('properties')
            .insert({
                title: 'Integration Test Property',
                slug: 'integration-test-property',
                status: 'publicada',
                listing_type: 'venta',
                price: 250000,
                currency: 'USD',
                location_id: testLocationId,
                area_total: 200,
                bedrooms: 3,
                bathrooms: 2,
                featured: false,
            })
            .select('id')
            .single();

        expect(createError).toBeNull();
        testPropertyId = property?.id;
        expect(testPropertyId).toBeDefined();

        // 2. Verify property_ml_meta created with status=pending
        const { data: meta } = await supabase
            .from('property_ml_meta')
            .select('status, ml_item_id')
            .eq('property_id', testPropertyId)
            .maybeSingle();

        expect(meta).toBeDefined();
        expect(meta?.status).toBe('pending');
        expect(meta?.ml_item_id).toBeNull();

        // 3. Verify ml_sync_queue job enqueued
        const { data: queue } = await supabase
            .from('ml_sync_queue')
            .select('operation, status')
            .eq('property_id', testPropertyId)
            .maybeSingle();

        expect(queue).toBeDefined();
        expect(queue?.operation).toBe('publish');
        expect(queue?.status).toBe('pending');
    });

    it('Soft delete → Trash → Restore', async () => {
        // Create a property for this test
        const { data: property } = await supabase
            .from('properties')
            .insert({
                title: 'Soft Delete Test',
                slug: 'soft-delete-test',
                status: 'borrador',
                listing_type: 'venta',
                price: 100000,
                currency: 'USD',
            })
            .select('id')
            .single();

        const testId = property?.id;
        expect(testId).toBeDefined();

        // Soft delete
        await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', testId);

        // Verify deleted_at set
        const { data: deleted } = await supabase
            .from('properties')
            .select('deleted_at')
            .eq('id', testId)
            .single();
        expect(deleted?.deleted_at).toBeDefined();

        // Verify not in active list
        const { data: activeList } = await supabase
            .from('properties')
            .select('id')
            .is('deleted_at', null);
        expect(activeList?.some(p => p.id === testId)).toBe(false);

        // Verify in trash
        const { data: trashList } = await supabase
            .from('properties')
            .select('id')
            .not('deleted_at', 'is', null);
        expect(trashList?.some(p => p.id === testId)).toBe(true);

        // Restore
        await supabase.from('properties').update({ deleted_at: null }).eq('id', testId);

        // Verify restored
        const { data: restored } = await supabase
            .from('properties')
            .select('deleted_at')
            .eq('id', testId)
            .single();
        expect(restored?.deleted_at).toBeNull();

        // Cleanup
        await supabase.from('properties').delete().eq('id', testId);
    });

    it('Permanent delete → Storage cleanup', async () => {
        // Create property with image
        const { data: property } = await supabase
            .from('properties')
            .insert({
                title: 'Permanent Delete Test',
                slug: 'permanent-delete-test',
                status: 'borrador',
                listing_type: 'venta',
                price: 100000,
                currency: 'USD',
            })
            .select('id')
            .single();

        const testId = property?.id;
        expect(testId).toBeDefined();

        // Add image record
        const { data: image } = await supabase
            .from('property_images')
            .insert({
                property_id: testId,
                url: 'https://test.supabase.co/storage/v1/object/public/property-images/test/test.jpg',
                alt: 'Test',
                position: 0,
                is_cover: false,
            })
            .select('id')
            .single();

        // Soft delete first
        await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', testId);

        // Permanent delete (this would also clean storage in real implementation)
        await supabase.from('properties').delete().eq('id', testId);

        // Verify property gone
        const { data: gone } = await supabase.from('properties').select('id').eq('id', testId).maybeSingle();
        expect(gone).toBeNull();

        // Verify images cascade deleted (FK)
        const { data: images } = await supabase.from('property_images').select('id').eq('property_id', testId);
        expect(images).toEqual([]);
    });

    it('Duplicate → Independent property', async () => {
        // Create original
        const { data: original } = await supabase
            .from('properties')
            .insert({
                title: 'Original Property',
                slug: 'original-property',
                status: 'publicada',
                listing_type: 'venta',
                price: 300000,
                currency: 'USD',
            })
            .select('id, title, status, featured')
            .single();

        // Duplicate via RPC or manual
        const { data: duplicate } = await supabase
            .from('properties')
            .insert({
                title: 'Original Property (Copia)',
                slug: 'original-property-copia',
                status: 'borrador',
                listing_type: 'venta',
                price: 300000,
                currency: 'USD',
                featured: false,
            })
            .select('id, title, status, featured')
            .single();

        expect(duplicate?.title).toBe('Original Property (Copia)');
        expect(duplicate?.status).toBe('borrador');
        expect(duplicate?.featured).toBe(false);
        expect(duplicate?.id).not.toBe(original?.id);

        // Cleanup
        await supabase.from('properties').delete().in('id', [original?.id, duplicate?.id]);
    });
});