import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import type { PropertyFormValues } from '../types/properties';

export function usePropertyDraft(propertyId: string | null) {
    const [draft, setDraft] = useState<Partial<PropertyFormValues> | null>(null);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load draft on mount
    useEffect(() => {
        if (!propertyId) return;
        loadDraft();
    }, [propertyId]);

    const loadDraft = useCallback(async () => {
        if (!propertyId) return;
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;
        try {
            const { data } = await supabase
                .from('property_drafts')
                .select('form_values')
                .eq('property_id', propertyId)
                .eq('admin_user_id', userId)
                .maybeSingle();

            if (data?.form_values) {
                setDraft(data.form_values as Partial<PropertyFormValues>);
            }
        } catch {
            // Ignore errors
        }
    }, [propertyId]);

    const saveDraft = useCallback(async (values: Partial<PropertyFormValues>) => {
        if (!propertyId) return;
        
        // Clear existing timeout
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        // Debounce save
        saveTimeoutRef.current = setTimeout(async () => {
            setSaving(true);
            try {
                await supabase.from('property_drafts').upsert({
                    property_id: propertyId,
                    admin_user_id: (await supabase.auth.getUser()).data.user?.id,
                    form_values: values,
                });
                setLastSaved(new Date());
            } catch {
                // Ignore errors
            } finally {
                setSaving(false);
            }
        }, 2000); // 2 second debounce
    }, [propertyId]);

    const clearDraft = useCallback(async () => {
        if (!propertyId) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        await supabase.from('property_drafts').delete().eq('property_id', propertyId);
        setDraft(null);
        setLastSaved(null);
    }, [propertyId]);

    return { draft, saveDraft, clearDraft, saving, lastSaved };
}