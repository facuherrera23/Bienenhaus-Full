// Owners Module - Barrel Export

// Types
export type {
    OwnerType,
    OwnerPreferredContact,
    PriceStatus,
    MarketTrend,
    ActionPlanCategory,
    ActionPlanPriority,
    ActionPlanStatus,
    CommunicationType,
    CommunicationStatus,
    ReportType,
    OwnerDbRow,
    PropertyOwnerDbRow,
    PriceAnalysisDbRow,
    ActionPlanDbRow,
    ActionPlanTaskDbRow,
    CommunicationDbRow,
    ReportDbRow,
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
} from '../../types/owners';

export {
    OWNER_TYPE_LABEL,
    OWNER_PREFERRED_CONTACT_LABEL,
    PRICE_STATUS_LABEL,
    PRICE_STATUS_TONE,
    PRICE_STATUS_GAUGE_COLOR,
    MARKET_TREND_LABEL,
    MARKET_TREND_ICON,
    ACTION_PLAN_CATEGORY_LABEL,
    ACTION_PLAN_PRIORITY_LABEL,
    ACTION_PLAN_PRIORITY_TONE,
    ACTION_PLAN_STATUS_LABEL,
    ACTION_PLAN_STATUS_TONE,
    COMMUNICATION_TYPE_LABEL,
    COMMUNICATION_STATUS_LABEL,
    COMMUNICATION_STATUS_TONE,
    REPORT_TYPE_LABEL,
    getPriceStatusFromPct,
    formatPriceStatus,
    generateWhatsAppLink,
} from '../../types/owners';

// Schemas
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

export type {
    OwnersFilters,
    ActionPlansFilters,
    CommunicationsFilters,
    ReportsFilters,
} from './schemas';

// API Functions - Owners
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
} from './owners';

// API Functions - Property-Owner Links
export {
    fetchPropertyOwners,
    fetchOwnerProperties,
    linkOwnerToProperty,
    unlinkOwnerFromProperty,
    updatePropertyOwnerLink,
    setPrimaryContact,
} from './owners';

// API Functions - Price Analysis
export {
    fetchPriceAnalysis,
    fetchPriceAnalysisHistory,
    createPriceAnalysis,
    updatePriceAnalysis,
    deletePriceAnalysis,
} from './owners';

// API Functions - Action Plans
export {
    fetchActionPlans,
    fetchActionPlanById,
    createActionPlan,
    updateActionPlan,
    completeActionPlan,
    softDeleteActionPlan,
    restoreActionPlan,
    permanentDeleteActionPlan,
    fetchDeletedActionPlans,
} from './owners';

// API Functions - Action Plan Tasks
export {
    fetchTasksByPlan,
    createActionPlanTask,
    updateActionPlanTask,
    completeActionPlanTask,
    deleteActionPlanTask,
} from './owners';

// API Functions - Communications
export {
    fetchCommunications,
    createCommunication,
    createDraftCommunication,
    sendCommunication,
    deleteCommunication,
} from './owners';

// API Functions - Reports
export { fetchReports, fetchReportById, createReport, sendReport, deleteReport } from './owners';

// Query Hooks
export {
    ownersKeys,
    propertyOwnersKeys,
    priceAnalysisKeys,
    actionPlansKeys,
    actionPlanTasksKeys,
    communicationsKeys,
    reportsKeys,
    useOwners,
    useOwner,
    useCreateOwner,
    useUpdateOwner,
    useSoftDeleteOwner,
    useRestoreOwner,
    usePermanentDeleteOwner,
    useDeletedOwners,
    usePropertyOwners,
    useOwnerProperties,
    useLinkOwnerToProperty,
    useUnlinkOwnerFromProperty,
    useUpdatePropertyOwnerLink,
    useSetPrimaryContact,
    usePriceAnalysis,
    usePriceAnalysisHistory,
    useCreatePriceAnalysis,
    useUpdatePriceAnalysis,
    useDeletePriceAnalysis,
    useActionPlans,
    useActionPlan,
    useCreateActionPlan,
    useUpdateActionPlan,
    useCompleteActionPlan,
    useSoftDeleteActionPlan,
    useRestoreActionPlan,
    usePermanentDeleteActionPlan,
    useDeletedActionPlans,
    useActionPlanTasks,
    useCreateActionPlanTask,
    useUpdateActionPlanTask,
    useCompleteActionPlanTask,
    useDeleteActionPlanTask,
    useCommunications,
    useCreateCommunication,
    useCreateDraftCommunication,
    useSendCommunication,
    useDeleteCommunication,
    useReports,
    useReport,
    useCreateReport,
    useSendReport,
    useDeleteReport,
} from './api';
