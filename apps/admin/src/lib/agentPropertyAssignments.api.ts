import { useMutation, useQuery } from './query/hooks';
import { useQueryClient } from '@tanstack/react-query';
import {
    assignAgentToProperty,
    fetchAgentsForProperty,
    fetchPropertiesForAgent,
    unassignAgentFromProperty,
} from './agentPropertyAssignments';
import { queryKeys } from './api';
import { pushToast } from '../store/app';

export function usePropertiesForAgent(agentId: string | null) {
    return useQuery({
        queryKey: [...queryKeys.agents(), 'properties', agentId ?? ''],
        queryFn: () => fetchPropertiesForAgent(agentId!),
        enabled: !!agentId,
        staleTime: 30_000,
    });
}

export function useAgentsForProperty(propertyId: string | null) {
    return useQuery({
        queryKey: [...queryKeys.properties(), 'agents', propertyId ?? ''],
        queryFn: () => fetchAgentsForProperty(propertyId!),
        enabled: !!propertyId,
        staleTime: 30_000,
    });
}

export function useAssignAgentToProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            agentId,
            propertyId,
            notes,
        }: {
            agentId: string;
            propertyId: string;
            notes?: string;
        }) => assignAgentToProperty(agentId, propertyId, notes),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['agents'] });
            void qc.invalidateQueries({ queryKey: ['properties'] });
            pushToast({ type: 'success', title: 'Agente asignado a la propiedad' });
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            pushToast({ type: 'error', title: 'No se pudo asignar', description: msg });
        },
    });
}

export function useUnassignAgentFromProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            agentId,
            propertyId,
        }: {
            agentId: string;
            propertyId: string;
        }) => unassignAgentFromProperty(agentId, propertyId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['agents'] });
            void qc.invalidateQueries({ queryKey: ['properties'] });
            pushToast({ type: 'success', title: 'Agente desasignado de la propiedad' });
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            pushToast({ type: 'error', title: 'No se pudo desasignar', description: msg });
        },
    });
}
