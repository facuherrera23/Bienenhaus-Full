import {
    queryKeys,
    useCreate,
    useDelete,
    useItem,
    useList,
    useMutation,
    useUpdate,
} from './api';
import { useQueryClient } from '@tanstack/react-query';
import {
    create,
    deleteDraft,
    deleteValuation,
    enableEdit,
    fetchAll,
    fetchById,
    fetchDrafts,
    finalize,
    loadDraft,
    saveDraft,
    toValuacionDBRow,
    update,
} from './valuationService';
import type { ValuationRow } from './valuationService';
import type {
    ValuacionDBRow,
    ValuacionDraftData,
    ValuacionFilters,
    ValuacionFormData,
} from '../types/valuationTypes';

// ============================================================
// Query Hooks - Valuaciones
// ============================================================

export function useValuations(filters?: ValuacionFilters) {
    return useList<ValuacionDBRow, ValuationRow>({
        queryKey: queryKeys.valuations(filters),
        path: 'property_valuations',
        select: '*',
        transform: toValuacionDBRow,
        filters: {
            deleted_at: 'is.null',
            ...(filters?.status === 'draft' ? { finalized_at: 'is.null' } : {}),
            ...(filters?.status === 'finalized' ? { finalized_at: 'not.is.null' } : {}),
            ...(filters?.tipo ? { tipo: `eq.${filters.tipo}` } : {}),
            ...(filters?.dateFrom ? { fecha: `gte.${filters.dateFrom}` } : {}),
            ...(filters?.dateTo ? { fecha: `lte.${filters.dateTo}` } : {}),
        },
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'updated_at',
        ascending: false,
    });
}

export function useValuation(id: string | null) {
    return useItem<ValuacionDBRow>(queryKeys.valuation(id ?? ''), 'property_valuations', id, !!id);
}

// ============================================================
// Query Hooks - Drafts
// ============================================================

export function useValuationDrafts() {
    return useList<ValuacionDraftData, ValuacionDraftData>({
        queryKey: queryKeys.valuationDrafts(),
        path: 'property_valuations',
        select: '*',
        filters: { deleted_at: 'is.null', finalized_at: 'is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'updated_at',
        ascending: false,
    });
}

export function useLoadValuationDraft(id?: string) {
    const queryKey = queryKeys.valuationDraft(id ?? null);
    return useList<ValuacionDraftData, ValuacionDraftData>({
        queryKey,
        path: 'property_valuations',
        select: '*',
        filters: {
            deleted_at: 'is.null',
            finalized_at: 'is.null',
            ...(id ? { id: `eq.${id}` } : {}),
        },
        page: 1,
        pageSize: id ? 1 : 1,
        orderBy: 'updated_at',
        ascending: false,
        enabled: !id,
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateValuation() {
    return useCreate<ValuacionDBRow, ValuacionFormData>(
        queryKeys.valuations(),
        'property_valuations',
        {
            invalidateKeys: [['valuations'], ['valuation-drafts']],
        },
    );
}

export function useUpdateValuation() {
    return useUpdate<ValuacionDBRow, Partial<ValuacionFormData>>(
        queryKeys.valuations(),
        'property_valuations',
        {
            invalidateKeys: [['valuations'], ['valuation-drafts']],
        },
    );
}

export function useDeleteValuation() {
    return useDelete(queryKeys.valuations(), 'property_valuations', {
        invalidateKeys: [['valuations'], ['valuation-drafts']],
    });
}

// ============================================================
// Mutation Hooks - Ciclo de vida
// ============================================================

export function useFinalizeValuation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return finalize(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['valuations'] });
            queryClient.invalidateQueries({ queryKey: ['valuation-drafts'] });
        },
    });
}

export function useEnableEditValuation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return enableEdit(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['valuations'] });
            queryClient.invalidateQueries({ queryKey: ['valuation-drafts'] });
        },
    });
}

// ============================================================
// Mutation Hooks - Drafts
// ============================================================

export function useDeleteDraftValuation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return deleteDraft(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['valuation-drafts'] });
            queryClient.invalidateQueries({ queryKey: ['valuations'] });
        },
    });
}

export function useSaveValuationDraft() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { form: ValuacionFormData; id?: string }) => {
            return saveDraft(data.form, data.id);
        },
        onSuccess: (savedId) => {
            queryClient.invalidateQueries({ queryKey: ['valuation-drafts'] });
            queryClient.invalidateQueries({ queryKey: ['valuations'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.valuation(savedId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.valuationDraft(savedId) });
        },
    });
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchAll,
    fetchById,
    create,
    update,
    deleteValuation,
    finalize,
    enableEdit,
    fetchDrafts,
    loadDraft,
    saveDraft,
    deleteDraft,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type {
    ValuacionDBRow,
    ValuacionDraftData,
    ValuacionFilters,
    ValuacionFormData,
};