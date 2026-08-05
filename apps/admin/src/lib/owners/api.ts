import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOwnersPaginated,
  fetchOwnerById,
  createOwner,
  updateOwner,
  softDeleteOwner,
  restoreOwner,
  permanentDeleteOwner,
  fetchDeletedOwners,
  fetchPropertyOwners,
  fetchOwnerProperties,
  linkOwnerToProperty,
  unlinkOwnerFromProperty,
  updatePropertyOwnerLink,
  setPrimaryContact,
  fetchPriceAnalysis,
  fetchPriceAnalysisHistory,
  createPriceAnalysis,
  updatePriceAnalysis,
  deletePriceAnalysis,
  fetchActionPlans,
  fetchActionPlanById,
  createActionPlan,
  updateActionPlan,
  completeActionPlan,
  softDeleteActionPlan,
  restoreActionPlan,
  permanentDeleteActionPlan,
  fetchDeletedActionPlans,
  fetchTasksByPlan,
  createActionPlanTask,
  updateActionPlanTask,
  completeActionPlanTask,
  deleteActionPlanTask,
  fetchCommunications,
  createCommunication,
  createDraftCommunication,
  sendCommunication,
  deleteCommunication,
  fetchReports,
  fetchReportById,
  createReport,
  sendReport,
  deleteReport,
} from './owners';
import type {
  OwnersFilters,
  ActionPlansFilters,
  CommunicationsFilters,
  ReportsFilters,
  OwnerFormValues,
  PropertyOwnerLink,
  PriceAnalysisFormValues,
  ActionPlanFormValues,
  ActionPlanTaskFormValues,
  CommunicationFormValues,
  ReportFormValues,
} from '../../types/owners';

// ============================================================
// Query Keys
// ============================================================

export const ownersKeys = {
  all: ['owners'] as const,
  lists: () => [...ownersKeys.all, 'list'] as const,
  list: (filters: OwnersFilters) => [...ownersKeys.lists(), filters] as const,
  detail: (id: string) => [...ownersKeys.all, 'detail', id] as const,
  deleted: () => [...ownersKeys.all, 'deleted'] as const,
};

export const propertyOwnersKeys = {
  all: ['property-owners'] as const,
  byProperty: (propertyId: string) => [...propertyOwnersKeys.all, 'property', propertyId] as const,
  byOwner: (ownerId: string) => [...propertyOwnersKeys.all, 'owner', ownerId] as const,
};

export const priceAnalysisKeys = {
  all: ['price-analysis'] as const,
  current: (propertyId: string) => [...priceAnalysisKeys.all, 'current', propertyId] as const,
  history: (propertyId: string) => [...priceAnalysisKeys.all, 'history', propertyId] as const,
};

export const actionPlansKeys = {
  all: ['action-plans'] as const,
  lists: () => [...actionPlansKeys.all, 'list'] as const,
  list: (filters: ActionPlansFilters) => [...actionPlansKeys.lists(), filters] as const,
  detail: (id: string) => [...actionPlansKeys.all, 'detail', id] as const,
  deleted: () => [...actionPlansKeys.all, 'deleted'] as const,
};

export const actionPlanTasksKeys = {
  all: ['action-plan-tasks'] as const,
  byPlan: (planId: string) => [...actionPlanTasksKeys.all, 'plan', planId] as const,
};

export const communicationsKeys = {
  all: ['owner-communications'] as const,
  lists: () => [...communicationsKeys.all, 'list'] as const,
  list: (filters: CommunicationsFilters) => [...communicationsKeys.lists(), filters] as const,
};

export const reportsKeys = {
  all: ['owner-reports'] as const,
  lists: () => [...reportsKeys.all, 'list'] as const,
  list: (filters: ReportsFilters) => [...reportsKeys.lists(), filters] as const,
  detail: (id: string) => [...reportsKeys.all, 'detail', id] as const,
};

// ============================================================
// Owners Hooks
// ============================================================

export function useOwners(filters?: OwnersFilters) {
  return useQuery({
    queryKey: ownersKeys.list(filters ?? {}),
    queryFn: () => fetchOwnersPaginated(filters ?? {}),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useOwner(id: string | null) {
  return useQuery({
    queryKey: ownersKeys.detail(id ?? ''),
    queryFn: () => fetchOwnerById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (owner: Omit<OwnerFormValues, 'id'>) => createOwner(owner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
    },
  });
}

export function useUpdateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, owner }: { id: string; owner: Partial<OwnerFormValues> }) =>
      updateOwner(id, owner),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ownersKeys.detail(data.id) });
    },
  });
}

export function useSoftDeleteOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ownersKeys.deleted() });
    },
  });
}

export function useRestoreOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ownersKeys.deleted() });
    },
  });
}

export function usePermanentDeleteOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permanentDeleteOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownersKeys.deleted() });
    },
  });
}

export function useDeletedOwners() {
  return useQuery({
    queryKey: ownersKeys.deleted(),
    queryFn: () => fetchDeletedOwners(),
    staleTime: 30_000,
  });
}

// ============================================================
// Property-Owner Links Hooks
// ============================================================

export function usePropertyOwners(propertyId: string | null) {
  return useQuery({
    queryKey: propertyOwnersKeys.byProperty(propertyId ?? ''),
    queryFn: () => fetchPropertyOwners(propertyId!),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useOwnerProperties(ownerId: string | null) {
  return useQuery({
    queryKey: propertyOwnersKeys.byOwner(ownerId ?? ''),
    queryFn: () => fetchOwnerProperties(ownerId!),
    enabled: !!ownerId,
    staleTime: 30_000,
  });
}

export function useLinkOwnerToProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (link: PropertyOwnerLink) => linkOwnerToProperty(link),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byProperty(data.property_id) });
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byOwner(data.owner_id) });
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
    },
  });
}

export function useUnlinkOwnerFromProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, ownerId }: { propertyId: string; ownerId: string }) =>
      unlinkOwnerFromProperty(propertyId, ownerId),
    onSuccess: (_, { propertyId, ownerId }) => {
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byProperty(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byOwner(ownerId) });
      queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
    },
  });
}

export function useUpdatePropertyOwnerLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      ownerId,
      updates,
    }: {
      propertyId: string;
      ownerId: string;
      updates: Partial<PropertyOwnerLink>;
    }) => updatePropertyOwnerLink(propertyId, ownerId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byProperty(data.property_id) });
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byOwner(data.owner_id) });
    },
  });
}

export function useSetPrimaryContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, ownerId }: { propertyId: string; ownerId: string }) =>
      setPrimaryContact(propertyId, ownerId),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: propertyOwnersKeys.byProperty(propertyId) });
    },
  });
}

// ============================================================
// Price Analysis Hooks
// ============================================================

export function usePriceAnalysis(propertyId: string | null) {
  return useQuery({
    queryKey: priceAnalysisKeys.current(propertyId ?? ''),
    queryFn: () => fetchPriceAnalysis(propertyId!),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function usePriceAnalysisHistory(propertyId: string | null) {
  return useQuery({
    queryKey: priceAnalysisKeys.history(propertyId ?? ''),
    queryFn: () => fetchPriceAnalysisHistory(propertyId!),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useCreatePriceAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (analysis: PriceAnalysisFormValues) => createPriceAnalysis(analysis),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: priceAnalysisKeys.current(data.property_id) });
      queryClient.invalidateQueries({ queryKey: priceAnalysisKeys.history(data.property_id) });
    },
  });
}

export function useUpdatePriceAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, analysis }: { id: string; analysis: Partial<PriceAnalysisFormValues> }) =>
      updatePriceAnalysis(id, analysis),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: priceAnalysisKeys.current(data.property_id) });
      queryClient.invalidateQueries({ queryKey: priceAnalysisKeys.history(data.property_id) });
    },
  });
}

export function useDeletePriceAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePriceAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceAnalysisKeys.all });
    },
  });
}

// ============================================================
// Action Plans Hooks
// ============================================================

export function useActionPlans(filters?: ActionPlansFilters) {
  return useQuery({
    queryKey: actionPlansKeys.list(filters ?? {}),
    queryFn: () => fetchActionPlans(filters ?? {}),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useActionPlan(id: string | null) {
  return useQuery({
    queryKey: actionPlansKeys.detail(id ?? ''),
    queryFn: () => fetchActionPlanById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: ActionPlanFormValues) => createActionPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
    },
  });
}

export function useUpdateActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Partial<ActionPlanFormValues> }) =>
      updateActionPlan(id, plan),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.detail(data.id) });
    },
  });
}

export function useCompleteActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeActionPlan(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.detail(id) });
    },
  });
}

export function useSoftDeleteActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteActionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.deleted() });
    },
  });
}

export function useRestoreActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreActionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.deleted() });
    },
  });
}

export function usePermanentDeleteActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permanentDeleteActionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.deleted() });
    },
  });
}

export function useDeletedActionPlans() {
  return useQuery({
    queryKey: actionPlansKeys.deleted(),
    queryFn: () => fetchDeletedActionPlans(),
    staleTime: 30_000,
  });
}

// ============================================================
// Action Plan Tasks Hooks
// ============================================================

export function useActionPlanTasks(planId: string | null) {
  return useQuery({
    queryKey: actionPlanTasksKeys.byPlan(planId ?? ''),
    queryFn: () => fetchTasksByPlan(planId!),
    enabled: !!planId,
    staleTime: 30_000,
  });
}

export function useCreateActionPlanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: ActionPlanTaskFormValues) => createActionPlanTask(task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actionPlanTasksKeys.byPlan(data.plan_id) });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.detail(data.plan_id) });
    },
  });
}

export function useUpdateActionPlanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<ActionPlanTaskFormValues> }) =>
      updateActionPlanTask(id, task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actionPlanTasksKeys.byPlan(data.plan_id) });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.detail(data.plan_id) });
    },
  });
}

export function useCompleteActionPlanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeActionPlanTask(id),
    onSuccess: (_, _id) => {
      queryClient.invalidateQueries({ queryKey: actionPlanTasksKeys.all });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
    },
  });
}

export function useDeleteActionPlanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActionPlanTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionPlanTasksKeys.all });
      queryClient.invalidateQueries({ queryKey: actionPlansKeys.lists() });
    },
  });
}

// ============================================================
// Communications Hooks
// ============================================================

export function useCommunications(filters?: CommunicationsFilters) {
  return useQuery({
    queryKey: communicationsKeys.list(filters ?? {}),
    queryFn: () => fetchCommunications(filters ?? {}),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useCreateCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comm: CommunicationFormValues) => createCommunication(comm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.lists() });
    },
  });
}

export function useCreateDraftCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comm: CommunicationFormValues) => createDraftCommunication(comm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.lists() });
    },
  });
}

export function useSendCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendCommunication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.lists() });
    },
  });
}

export function useDeleteCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCommunication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationsKeys.lists() });
    },
  });
}

// ============================================================
// Reports Hooks
// ============================================================

export function useReports(filters?: ReportsFilters) {
  return useQuery({
    queryKey: reportsKeys.list(filters ?? {}),
    queryFn: () => fetchReports(filters ?? {}),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: reportsKeys.detail(id ?? ''),
    queryFn: () => fetchReportById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (report: ReportFormValues) => createReport(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
    },
  });
}

export function useSendReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
    },
  });
}

// ============================================================
// Re-export raw functions for components that need direct access
// ============================================================
export {
  fetchOwners,
  fetchOwnersPaginated,
  fetchOwnerById,
  createOwner,
  updateOwner,
  softDeleteOwner,
  restoreOwner,
  permanentDeleteOwner,
  fetchDeletedOwners,
  fetchPropertyOwners,
  fetchOwnerProperties,
  linkOwnerToProperty,
  unlinkOwnerFromProperty,
  updatePropertyOwnerLink,
  setPrimaryContact,
  fetchPriceAnalysis,
  fetchPriceAnalysisHistory,
  createPriceAnalysis,
  updatePriceAnalysis,
  deletePriceAnalysis,
  fetchActionPlans,
  fetchActionPlanById,
  createActionPlan,
  updateActionPlan,
  completeActionPlan,
  softDeleteActionPlan,
  restoreActionPlan,
  permanentDeleteActionPlan,
  fetchDeletedActionPlans,
  fetchTasksByPlan,
  createActionPlanTask,
  updateActionPlanTask,
  completeActionPlanTask,
  deleteActionPlanTask,
  fetchCommunications,
  createCommunication,
  createDraftCommunication,
  sendCommunication,
  deleteCommunication,
  fetchReports,
  fetchReportById,
  createReport,
  sendReport,
  deleteReport,
} from './owners';

// ============================================================
// Re-export schemas for components that need direct access
// ============================================================
export {
  ownerSchema,
  propertyOwnerLinkSchema,
  comparablePropertySchema,
  priceAnalysisSchema,
  actionPlanSchema,
  actionPlanTaskSchema,
  communicationSchema,
  reportSchema,
  ownersFiltersSchema,
  actionPlansFiltersSchema,
  communicationsFiltersSchema,
  reportsFiltersSchema,
} from './schemas';

// ============================================================
// Re-export types for components that need direct access
// ============================================================
export type {
  OwnerRow,
  OwnerDetail,
  OwnerFormValues,
  PropertyOwnerLink,
  PropertyOwnerLinkRow,
  PriceAnalysisRow,
  ComparableProperty,
  PriceAnalysisFormValues,
  ActionPlanRow,
  ActionPlanDetail,
  ActionPlanFormValues,
  ActionPlanTaskRow,
  ActionPlanTaskFormValues,
  CommunicationRow,
  CommunicationFormValues,
  ReportRow,
  ReportFormValues,
  DashboardKPI,
} from './owners';