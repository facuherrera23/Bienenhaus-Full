export * from './properties';
export * from './leads';
export * from './ml';
export * from './newsletter';
export * from './chat';
export * from './admin';
export * from './owners';
export type * from './valuations';

// Export agents explicitly to avoid naming conflicts
export type {
    AgentRow,
    AgentFormValues,
    AgentPermissions,
    AgentCommission,
    AgentSchedule,
    AgentAvailability as AgentAvailabilityAgent,
} from './agents';
export { DAY_LABELS as AgentDayLabels } from './agents';

// Export visits explicitly to avoid naming conflicts
export type {
    VisitRow,
    VisitFormValues,
    VisitStatus,
    VisitType,
    RecurrenceRule,
    RecurringVisit,
    ReminderConfig,
    QrCheckin,
    AgentAvailability as AgentAvailabilityVisit,
} from './visits';
export {
    DAY_LABELS as VisitDayLabels,
    VISIT_STATUS_LABEL,
    VISIT_STATUS_TONE,
    MEETING_TYPE_LABEL,
    DEFAULT_REMINDERS,
} from './visits';