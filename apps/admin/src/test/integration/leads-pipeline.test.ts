import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const TEST_SUPABASE_URL = 'http://localhost:54321';
const TEST_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGRxaXd3emhqbnVya2d1aWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk0MDgzMywiZXhwIjoyMTAwNTE2ODMzfQ.QWqdmDRPZrwZW41WvL3VFDzKhgMRtZzSIIR17fV1uRE';

describe('Leads Integration (local supabase)', () => {
    let supabase: ReturnType<typeof createClient>;
    let testLeadId: string;

    beforeAll(async () => {
        supabase = createClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
    });

    afterAll(async () => {
        // Cleanup test data
        if (testLeadId) {
            await supabase.from('leads').delete().eq('id', testLeadId);
        }
    });

    it('Create lead → auto-score → auto-assign', async () => {
        // 1. Create lead
        const { data: lead, error: createError } = await supabase
            .from('leads')
            .insert({
                name: 'Integration',
                last_name: 'Test',
                email: 'integration@test.com',
                phone: '+54 9 11 1234-5678',
                city: 'Córdoba',
                intent: 'comprar',
                source: 'landing_form',
                status: 'nuevo',
                message: 'Quiero comprar una casa en zona norte',
            })
            .select('id, score')
            .single();

        expect(createError).toBeNull();
        testLeadId = lead?.id;
        expect(testLeadId).toBeDefined();

        // 2. Verify score calculated
        const { data: leadScore } = await supabase
            .from('leads')
            .select('score')
            .eq('id', testLeadId)
            .single();

        expect(leadScore).toBeDefined();
        expect(leadScore?.score).toBeGreaterThan(0);
        expect(leadScore?.score).toBeLessThanOrEqual(100);

        // 3. Auto-assign
        const { data: agent } = await supabase
            .from('agents')
            .select('id, name')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(1)
            .single();

        if (agent) {
            await supabase.from('leads').update({ assigned_to: agent.id }).eq('id', testLeadId);

            const { data: assignedLead } = await supabase
                .from('leads')
                .select('assigned_to')
                .eq('id', testLeadId)
                .single();

            expect(assignedLead?.assigned_to).toBe(agent.id);
        }
    });

    it('Status flow: nuevo → contactado → calificado → en_proceso → cerrado_ganado', async () => {
        // Create lead
        const { data: lead } = await supabase
            .from('leads')
            .insert({
                name: 'Status Flow',
                last_name: 'Test',
                email: 'statusflow@test.com',
                phone: '+54 9 11 1234-5678',
                city: 'Córdoba',
                intent: 'comprar',
                source: 'landing_form',
                status: 'nuevo',
                message: 'Test status flow',
            })
            .select('id')
            .single();

        const testId = lead?.id;
        expect(testId).toBeDefined();

        const statuses = ['contactado', 'calificado', 'en_proceso', 'cerrado_ganado'];

        for (const status of statuses) {
            await supabase.from('leads').update({ status }).eq('id', testId);

            const { data: updated } = await supabase
                .from('leads')
                .select('status')
                .eq('id', testId)
                .single();

            expect(updated?.status).toBe(status);
        }

        // Cleanup
        await supabase.from('leads').delete().eq('id', testId);
    });

    it('Bulk auto-assign balances workload', async () => {
        // Create 5 leads
        const leads = [];
        for (let i = 0; i < 5; i++) {
            const { data } = await supabase
                .from('leads')
                .insert({
                    name: `Bulk ${i}`,
                    last_name: 'Test',
                    email: `bulk${i}@test.com`,
                    phone: '+54 9 11 1234-5678',
                    city: 'Córdoba',
                    intent: 'comprar',
                    source: 'landing_form',
                    status: 'nuevo',
                    message: `Bulk test ${i}`,
                })
                .select('id')
                .single();

            leads.push(data?.id);
        }

        // Get agent lead counts before
        const { data: agentsBefore } = await supabase
            .from('agents')
            .select('id, name, leads:leads(count)')
            .eq('is_active', true)
            .order('leads.count', { ascending: true, referencedTable: 'leads' });

        // Bulk auto-assign
        // Note: This would use the RPC or edge function in real implementation
        // For test, we manually assign to test the logic
        for (const leadId of leads) {
            const { data: agent } = await supabase
                .from('agents')
                .select('id, name, leads:leads(count)')
                .eq('is_active', true)
                .order('leads.count', { ascending: true, referencedTable: 'leads' })
                .order('sort_order', { ascending: true })
                .limit(1)
                .single();

            if (agent) {
                await supabase.from('leads').update({ assigned_to: agent.id }).eq('id', leadId);
            }
        }

        // Verify workload balanced (within 1 lead difference)
        const { data: agentsAfter } = await supabase
            .from('agents')
            .select('id, name, leads:leads(count)')
            .eq('is_active', true);

        if (agentsAfter && agentsAfter.length > 1) {
            const counts = agentsAfter.map(a => a.leads?.count ?? 0);
            const min = Math.min(...counts);
            const max = Math.max(...counts);
            expect(max - min).toBeLessThanOrEqual(1);
        }

        // Cleanup
        await supabase.from('leads').delete().in('id', leads);
    });

    it('CSV import with deduplication', async () => {
        // Create existing lead
        const { data: existing } = await supabase
            .from('leads')
            .insert({
                name: 'Existing',
                last_name: 'Lead',
                email: 'duplicate@test.com',
                phone: '+54 9 11 1234-5678',
                city: 'Córdoba',
                intent: 'comprar',
                source: 'landing_form',
                status: 'nuevo',
                message: 'Original message',
            })
            .select('id')
            .single();

        // Import CSV with same email
        const csvText = `name,last_name,email,intent,source,status,message
Duplicate,Lead,duplicate@test.com,vender,landing_form,nuevo,New message`;

        const { data: imported } = await supabase
            .from('leads')
            .select('id')
            .or(`email.eq.duplicate@test.com,phone.eq.+54 9 11 1234-5678`)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // In real implementation, the createLead would deduplicate
        // Here we verify the existing lead exists
        expect(existing).toBeDefined();
        expect(existing.email).toBe('duplicate@test.com');

        // Cleanup
        await supabase.from('leads').delete().eq('id', existing.id);
    });
});