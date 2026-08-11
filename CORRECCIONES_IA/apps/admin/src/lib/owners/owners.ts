import { supabase } from '../supabase';
import type { Database } from '../../types/database';
import type {
    ActionPlanCategory,
    ActionPlanDetail,
    ActionPlanFormValues,
    ActionPlanPriority,
    ActionPlanRow,
    ActionPlanStatus,
    ActionPlanTaskFormValues,
    ActionPlanTaskRow,
    CommunicationFormValues,
    CommunicationRow,
    CommunicationStatus,
    CommunicationType,
    ComparableProperty,
    OwnerDetail,
    OwnerFormValues,
    OwnerPreferredContact,
    OwnerRow,
    OwnerType,
    PriceAnalysisFormValues,
    PriceAnalysisRow,
    PropertyOwnerLink,
    PropertyOwnerLinkRow,
    ReportFormValues,
    ReportRow,
    ReportType,
} from '../../types/owners';
import { getPriceStatusFromPct } from '../../types/owners';
// ============================================================
// DB Row Types with embedded relations
// ============================================================

type OwnerDbRow = Database['public']['Tables']['owners']['Row'];
type PropertyOwnerDbRow = Database['public']['Tables']['property_owners']['Row'];
type PriceAnalysisDbRow = Database['public']['Tables']['property_price_analyses']['Row'];
type ActionPlanDbRow = Database['public']['Tables']['property_action_plans']['Row'];
type ActionPlanTaskDbRow = Database['public']['Tables']['action_plan_tasks']['Row'];
type CommunicationDbRow = Database['public']['Tables']['owner_communications']['Row'];
type ReportDbRow = Database['public']['Tables']['owner_reports']['Row'];

interface OwnerApiRow extends OwnerDbRow {
    property_owners?: Array<{
        property_id: string;
        ownership_percentage: number;
        is_primary_contact: boolean;
        role: string;
        properties?:
            | { title: string; address: string; price: number | null; status: string }
            | { title: string; address: string; price: number | null; status: string }[]
            | null;
    }>;
}

interface PriceAnalysisApiRow extends PriceAnalysisDbRow {
    property?: { title: string } | { title: string }[] | null;
    analyzed_by_user?: { full_name: string } | { full_name: string }[] | null;
}

interface ActionPlanApiRow extends ActionPlanDbRow {
    property?: { title: string } | { title: string }[] | null;
    owner?: { full_name: string } | { full_name: string }[] | null;
    assignee?: { full_name: string } | { full_name: string }[] | null;
    creator?: { full_name: string } | { full_name: string }[] | null;
    action_plan_tasks?: Array<{
        id: string;
        status: ActionPlanStatus;
        due_date: string | null;
    }> | null;
}

interface ActionPlanTaskApiRow extends ActionPlanTaskDbRow {
    assignee?: { full_name: string } | { full_name: string }[] | null;
}

interface CommunicationApiRow extends CommunicationDbRow {
    property?: { title: string } | { title: string }[] | null;
    sent_by_user?: { full_name: string } | { full_name: string }[] | null;
}

interface ReportApiRow extends ReportDbRow {
    property?: { title: string } | { title: string }[] | null;
    owner?: { full_name: string } | { full_name: string }[] | null;
    created_by_user?: { full_name: string } | { full_name: string }[] | null;
}

// ============================================================
// Helpers
// ============================================================

function embedFullName(
    v: { full_name: string } | { full_name: string }[] | null | undefined,
): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.full_name ?? null) : v.full_name;
}

function embedTitle(v: { title: string } | { title: string }[] | null | undefined): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.title ?? null) : v.title;
}

// ============================================================
// Mappers
// ============================================================

function toOwnerRow(o: OwnerApiRow): OwnerRow {
    const props = o.property_owners ?? [];
    return {
        id: o.id,
        full_name: o.full_name,
        email: o.email,
        phone: o.phone,
        dni_cuit: o.dni_cuit,
        address: o.address,
        owner_type: (o.owner_type ?? 'persona_fisica') as OwnerType,
        company_name: o.company_name,
        notes: o.notes,
        preferred_contact: (o.preferred_contact ?? 'whatsapp') as OwnerPreferredContact,
        created_by: o.created_by ?? null,
        created_at: o.created_at ?? '',
        updated_at: o.updated_at ?? '',
        deleted_at: o.deleted_at ?? null,
        property_count: props.length,
    };
}

function toOwnerDetail(o: OwnerApiRow): OwnerDetail {
    const base = toOwnerRow(o);
    const props = o.property_owners ?? [];
    return {
        ...base,
        properties: props.map((po) => {
            const prop = Array.isArray(po.properties) ? po.properties[0] : po.properties;
            return {
                id: po.property_id,
                title: prop?.title ?? 'Sin título',
                address: prop?.address ?? null,
                price: prop?.price ?? null,
                status: prop?.status ?? 'desconocido',
                ownership_percentage: po.ownership_percentage,
                is_primary_contact: po.is_primary_contact,
                role: po.role,
            };
        }),
    };
}

function toPropertyOwnerLinkRow(
    po: PropertyOwnerDbRow & {
        properties?: { title: string } | { title: string }[] | null;
        owners?: { full_name: string } | { full_name: string }[] | null;
    },
): PropertyOwnerLinkRow {
    const prop = Array.isArray(po.properties) ? po.properties[0] : po.properties;
    const own = Array.isArray(po.owners) ? po.owners[0] : po.owners;
    return {
        id: po.id,
        property_id: po.property_id,
        owner_id: po.owner_id,
        ownership_percentage: po.ownership_percentage ?? 0,
        is_primary_contact: po.is_primary_contact ?? false,
        role: po.role ?? '',
        created_at: po.created_at ?? '',
        property_title: prop?.title ?? null,
        owner_name: own?.full_name ?? null,
    };
}

function toPriceAnalysisRow(pa: PriceAnalysisApiRow): PriceAnalysisRow {
    const comps = pa.comparable_properties ?? [];
    return {
        id: pa.id,
        property_id: pa.property_id,
        estimated_market_price: Number(pa.estimated_market_price),
        price_per_sqm_market: pa.price_per_sqm_market ? Number(pa.price_per_sqm_market) : null,
        our_listing_price: Number(pa.our_listing_price),
        price_difference_pct: Number(pa.price_difference_pct),
        price_status: pa.price_status ?? 'fair',
        market_trend: pa.market_trend ?? 'stable',
        comparable_properties: Array.isArray(comps)
            ? (comps as unknown as ComparableProperty[])
            : [],
        recommendation: pa.recommendation ?? null,
        notes: pa.notes ?? null,
        analyzed_by: pa.analyzed_by ?? null,
        analyzed_by_name: embedFullName(pa.analyzed_by_user) ?? null,
        analysis_date: pa.analysis_date ?? '',
        valid_until: pa.valid_until ?? null,
        created_at: pa.created_at ?? '',
    };
}

function toActionPlanRow(ap: ActionPlanApiRow): ActionPlanRow {
    const tasks = ap.action_plan_tasks ?? [];
    return {
        id: ap.id,
        property_id: ap.property_id,
        owner_id: ap.owner_id ?? null,
        title: ap.title,
        description: ap.description ?? null,
        category: ap.category ?? 'other',
        priority: ap.priority ?? 'medium',
        status: ap.status ?? 'pending',
        due_date: ap.due_date ?? null,
        completed_at: ap.completed_at ?? null,
        assigned_to: ap.assigned_to ?? null,
        assigned_to_name: embedFullName(ap.assignee) ?? null,
        created_by: ap.created_by ?? null,
        created_by_name: embedFullName(ap.creator) ?? null,
        created_at: ap.created_at ?? '',
        updated_at: ap.updated_at ?? '',
        deleted_at: ap.deleted_at ?? null,
        property_title: embedTitle(ap.property) ?? null,
        owner_name: embedFullName(ap.owner) ?? null,
        tasks_count: tasks.length,
        completed_tasks_count: tasks.filter((t) => t.status === 'completed').length,
    };
}

function toActionPlanDetail(ap: ActionPlanApiRow, tasks: ActionPlanTaskRow[]): ActionPlanDetail {
    const base = toActionPlanRow(ap);
    return {
        ...base,
        tasks,
        tasks_count: tasks.length,
        completed_tasks_count: tasks.filter((t) => t.status === 'completed').length,
    };
}

function toActionPlanTaskRow(t: ActionPlanTaskApiRow): ActionPlanTaskRow {
    return {
        id: t.id,
        plan_id: t.plan_id,
        title: t.title,
        description: t.description ?? null,
        status: t.status ?? 'pending',
        due_date: t.due_date ?? null,
        completed_at: t.completed_at ?? null,
        assigned_to: t.assigned_to ?? null,
        assigned_to_name: embedFullName(t.assignee) ?? null,
        created_at: t.created_at ?? '',
        updated_at: t.updated_at ?? '',
    };
}

function toCommunicationRow(c: CommunicationApiRow): CommunicationRow {
    return {
        id: c.id,
        owner_id: c.owner_id,
        property_id: c.property_id ?? null,
        type: c.type,
        subject: c.subject ?? null,
        content: c.content ?? null,
        status: c.status ?? 'draft',
        sent_at: c.sent_at ?? null,
        sent_by: c.sent_by ?? null,
        sent_by_name: embedFullName(c.sent_by_user) ?? null,
        created_at: c.created_at ?? '',
        property_title: embedTitle(c.property) ?? null,
    };
}

function toReportRow(r: ReportApiRow): ReportRow {
    return {
        id: r.id,
        property_id: r.property_id,
        owner_id: r.owner_id,
        report_type: r.report_type,
        title: r.title ?? null,
        content_json: (r.content_json ?? {}) as Record<string, unknown>,
        pdf_url: r.pdf_url ?? null,
        generated_at: r.generated_at ?? '',
        sent_at: r.sent_at ?? null,
        status: r.status ?? 'draft',
        created_by: r.created_by ?? null,
        created_by_name: embedFullName(r.created_by_user) ?? null,
        property_title: embedTitle(r.property) ?? null,
        owner_name: embedFullName(r.owner) ?? null,
    };
}

// ============================================================
// SELECT Strings
// ============================================================

const OWNERS_SELECT = `
  id, full_name, email, phone, dni_cuit, address, owner_type, company_name,
  notes, preferred_contact, created_by, created_at, updated_at, deleted_at,
  property_owners(id, property_id)
`.trim();

const OWNER_DETAIL_SELECT = `
  id, full_name, email, phone, dni_cuit, address, owner_type, company_name,
  notes, preferred_contact, created_by, created_at, updated_at, deleted_at,
  property_owners(
    property_id, ownership_percentage, is_primary_contact, role, created_at,
    properties(id, title, address, price, status)
  )
`.trim();

const PROPERTY_OWNERS_SELECT = `
  id, property_id, owner_id, ownership_percentage, is_primary_contact, role, created_at,
  properties(id, title),
  owners(id, full_name)
`.trim();

const PRICE_ANALYSIS_SELECT = `
  id, property_id, estimated_market_price, price_per_sqm_market, our_listing_price,
  price_difference_pct, price_status, market_trend, comparable_properties,
  recommendation, notes, analyzed_by, analysis_date, valid_until, created_at,
  property:properties(title),
  analyzed_by_user:admin_users(full_name)
`.trim();

const ACTION_PLANS_SELECT = `
  id, property_id, owner_id, title, description, category, priority, status,
  due_date, completed_at, assigned_to, created_by, created_at, updated_at, deleted_at,
  property:properties(title),
  owner:owners(full_name),
  assignee:admin_users(full_name),
  creator:admin_users(full_name),
  action_plan_tasks(id, status, due_date)
`.trim();

const ACTION_PLAN_TASKS_SELECT = `
  id, plan_id, title, description, status, due_date, completed_at,
  assigned_to, created_at, updated_at,
  assignee:admin_users(full_name)
`.trim();

const COMMUNICATIONS_SELECT = `
  id, owner_id, property_id, type, subject, content, status, sent_at, sent_by, created_at,
  property:properties(title),
  sent_by_user:admin_users(full_name)
`.trim();

const REPORTS_SELECT = `
  id, property_id, owner_id, report_type, title, content_json, pdf_url,
  generated_at, sent_at, status, created_by,
  property:properties(title),
  owner:owners(full_name),
  created_by_user:admin_users(full_name)
`.trim();

// ============================================================
// API Functions - Owners
// ============================================================

export async function fetchOwners(search?: string): Promise<OwnerRow[]> {
    let q = supabase.from('owners').select(OWNERS_SELECT).is('deleted_at', null).order('full_name');
    if (search) q = q.ilike('full_name', `%${search}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as OwnerApiRow[]).map(toOwnerRow);
}

export async function fetchOwnersPaginated(filters: {
    search?: string;
    owner_type?: OwnerType;
    preferred_contact?: OwnerPreferredContact;
    has_properties?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'full_name' | 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
}): Promise<{
    data: OwnerRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
        .from('owners')
        .select(OWNERS_SELECT, { count: 'exact' })
        .is('deleted_at', null);

    if (filters.search) q = q.ilike('full_name', `%${filters.search}%`);
    if (filters.owner_type) q = q.eq('owner_type', filters.owner_type);
    if (filters.preferred_contact) q = q.eq('preferred_contact', filters.preferred_contact);

    const sortBy = filters.sortBy ?? 'full_name';
    const sortOrder = filters.sortOrder ?? 'asc';
    q = q.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as unknown as OwnerApiRow[]).map(toOwnerRow);

    if (filters.has_properties !== undefined) {
        // For has_properties filter, we'd need a separate count query or post-filter
        // For now, we'll post-filter (acceptable for small datasets)
        if (filters.has_properties) {
            rows = rows.filter((o) => o.property_count > 0);
        } else {
            rows = rows.filter((o) => o.property_count === 0);
        }
    }

    return {
        data: rows,
        count: count ?? rows.length,
        page,
        pageSize,
        totalPages: pageSize > 0 ? Math.max(1, Math.ceil((count ?? rows.length) / pageSize)) : 1,
    };
}

export async function fetchOwnerById(id: string): Promise<OwnerDetail> {
    const { data, error } = await supabase
        .from('owners')
        .select(OWNER_DETAIL_SELECT)
        .eq('id', id)
        .single();
    if (error) throw new Error(error.message);
    return toOwnerDetail(data as unknown as OwnerApiRow);
}

export async function createOwner(owner: Omit<OwnerFormValues, 'id'>): Promise<OwnerRow> {
    const { data, error } = await supabase
        .from('owners')
        .insert(owner)
        .select(OWNERS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toOwnerRow(data as unknown as OwnerApiRow);
}

export async function updateOwner(id: string, owner: Partial<OwnerFormValues>): Promise<OwnerRow> {
    const { data, error } = await supabase
        .from('owners')
        .update(owner)
        .eq('id', id)
        .select(OWNERS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toOwnerRow(data as unknown as OwnerApiRow);
}

export async function softDeleteOwner(id: string): Promise<void> {
    const { error } = await supabase
        .from('owners')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function restoreOwner(id: string): Promise<void> {
    const { error } = await supabase.from('owners').update({ deleted_at: null }).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function permanentDeleteOwner(id: string): Promise<void> {
    const { error } = await supabase.from('owners').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function fetchDeletedOwners(): Promise<OwnerRow[]> {
    const { data, error } = await supabase
        .from('owners')
        .select(OWNERS_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as OwnerApiRow[]).map(toOwnerRow);
}

// ============================================================
// API Functions - Property-Owner Links
// ============================================================

export async function fetchPropertyOwners(propertyId: string): Promise<PropertyOwnerLinkRow[]> {
    const { data, error } = await supabase
        .from('property_owners')
        .select(PROPERTY_OWNERS_SELECT)
        .eq('property_id', propertyId)
        .order('is_primary_contact', { ascending: false });
    if (error) throw new Error(error.message);
    return (
        (data ?? []) as unknown as Array<
            PropertyOwnerDbRow & { properties?: { title: string }; owners?: { full_name: string } }
        >
    ).map(toPropertyOwnerLinkRow);
}

export async function fetchOwnerProperties(ownerId: string): Promise<PropertyOwnerLinkRow[]> {
    const { data, error } = await supabase
        .from('property_owners')
        .select(PROPERTY_OWNERS_SELECT)
        .eq('owner_id', ownerId)
        .order('is_primary_contact', { ascending: false });
    if (error) throw new Error(error.message);
    return (
        (data ?? []) as unknown as Array<
            PropertyOwnerDbRow & { properties?: { title: string }; owners?: { full_name: string } }
        >
    ).map(toPropertyOwnerLinkRow);
}

export async function linkOwnerToProperty(link: PropertyOwnerLink): Promise<PropertyOwnerLinkRow> {
    const { data, error } = await supabase
        .from('property_owners')
        .insert(link)
        .select(PROPERTY_OWNERS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toPropertyOwnerLinkRow(
        data as unknown as PropertyOwnerDbRow & {
            properties?: { title: string };
            owners?: { full_name: string };
        },
    );
}

export async function unlinkOwnerFromProperty(propertyId: string, ownerId: string): Promise<void> {
    const { error } = await supabase
        .from('property_owners')
        .delete()
        .eq('property_id', propertyId)
        .eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
}

export async function updatePropertyOwnerLink(
    propertyId: string,
    ownerId: string,
    updates: Partial<PropertyOwnerLink>,
): Promise<PropertyOwnerLinkRow> {
    const { data, error } = await supabase
        .from('property_owners')
        .update(updates)
        .eq('property_id', propertyId)
        .eq('owner_id', ownerId)
        .select(PROPERTY_OWNERS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toPropertyOwnerLinkRow(
        data as unknown as PropertyOwnerDbRow & {
            properties?: { title: string };
            owners?: { full_name: string };
        },
    );
}

export async function setPrimaryContact(propertyId: string, ownerId: string): Promise<void> {
    // First, unset all primary contacts for this property
    await supabase
        .from('property_owners')
        .update({ is_primary_contact: false })
        .eq('property_id', propertyId)
        .eq('is_primary_contact', true);

    // Then set the new primary contact
    const { error } = await supabase
        .from('property_owners')
        .update({ is_primary_contact: true })
        .eq('property_id', propertyId)
        .eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Price Analysis
// ============================================================

export async function fetchPriceAnalysis(propertyId: string): Promise<PriceAnalysisRow | null> {
    const { data, error } = await supabase
        .from('property_price_analyses')
        .select(PRICE_ANALYSIS_SELECT)
        .eq('property_id', propertyId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toPriceAnalysisRow(data as unknown as PriceAnalysisApiRow) : null;
}

export async function fetchPriceAnalysisHistory(propertyId: string): Promise<PriceAnalysisRow[]> {
    const { data, error } = await supabase
        .from('property_price_analyses')
        .select(PRICE_ANALYSIS_SELECT)
        .eq('property_id', propertyId)
        .order('analysis_date', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as PriceAnalysisApiRow[]).map(toPriceAnalysisRow);
}

export async function createPriceAnalysis(
    analysis: PriceAnalysisFormValues,
): Promise<PriceAnalysisRow> {
    const diff =
        ((analysis.our_listing_price - analysis.estimated_market_price) /
            analysis.estimated_market_price) *
        100;
    const price_status = getPriceStatusFromPct(diff);

    const payload: any = {
        ...analysis,
        price_status,
        comparable_properties: analysis.comparable_properties,
    };

    const { data, error } = await supabase
        .from('property_price_analyses')
        .insert(payload)
        .select(PRICE_ANALYSIS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toPriceAnalysisRow(data as unknown as PriceAnalysisApiRow);
}

export async function updatePriceAnalysis(
    id: string,
    analysis: Partial<PriceAnalysisFormValues>,
): Promise<PriceAnalysisRow> {
    const payload: any = { ...analysis };

    // Recalculate price_status if prices changed
    if (analysis.estimated_market_price !== undefined && analysis.our_listing_price !== undefined) {
        const diff =
            ((analysis.our_listing_price - analysis.estimated_market_price) /
                analysis.estimated_market_price) *
            100;
        payload.price_status = getPriceStatusFromPct(diff);
    }

    if (analysis.comparable_properties !== undefined) {
        payload.comparable_properties = analysis.comparable_properties;
    }

    const { data, error } = await supabase
        .from('property_price_analyses')
        .update(payload)
        .eq('id', id)
        .select(PRICE_ANALYSIS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toPriceAnalysisRow(data as unknown as PriceAnalysisApiRow);
}

export async function deletePriceAnalysis(id: string): Promise<void> {
    const { error } = await supabase.from('property_price_analyses').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Action Plans
// ============================================================

export async function fetchActionPlans(filters?: {
    property_id?: string;
    owner_id?: string;
    assigned_to?: string;
    status?: ActionPlanStatus;
    category?: ActionPlanCategory;
    priority?: ActionPlanPriority;
    overdue?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'due_date' | 'created_at' | 'priority' | 'title';
    sortOrder?: 'asc' | 'desc';
}): Promise<{
    data: ActionPlanRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
        .from('property_action_plans')
        .select(ACTION_PLANS_SELECT, { count: 'exact' })
        .is('deleted_at', null);

    if (filters?.property_id) q = q.eq('property_id', filters.property_id);
    if (filters?.owner_id) q = q.eq('owner_id', filters.owner_id);
    if (filters?.assigned_to) {
        if (filters.assigned_to === 'null') {
            q = q.is('assigned_to', null);
        } else if (filters.assigned_to === 'current_user') {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user?.id) q = q.eq('assigned_to', user.id);
        } else {
            q = q.eq('assigned_to', filters.assigned_to);
        }
    }
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.category) q = q.eq('category', filters.category);
    if (filters?.priority) q = q.eq('priority', filters.priority);
    if (filters?.overdue) {
        q = q.lt('due_date', new Date().toISOString()).in('status', ['pending', 'in_progress']);
    }

    const sortBy = filters?.sortBy ?? 'due_date';
    const sortOrder = filters?.sortOrder ?? 'asc';
    q = q.order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    const rows = ((data ?? []) as unknown as ActionPlanApiRow[]).map(toActionPlanRow);

    return {
        data: rows,
        count: count ?? rows.length,
        page,
        pageSize,
        totalPages: pageSize > 0 ? Math.max(1, Math.ceil((count ?? rows.length) / pageSize)) : 1,
    };
}

export async function fetchActionPlanById(id: string): Promise<ActionPlanDetail | null> {
    const [planRes, tasksRes] = await Promise.all([
        supabase
            .from('property_action_plans')
            .select(ACTION_PLANS_SELECT)
            .eq('id', id)
            .maybeSingle(),
        supabase
            .from('action_plan_tasks')
            .select(ACTION_PLAN_TASKS_SELECT)
            .eq('plan_id', id)
            .order('due_date'),
    ]);

    if (planRes.error) throw new Error(planRes.error.message);
    if (!planRes.data) return null;

    if (tasksRes.error) throw new Error(tasksRes.error.message);

    const tasks = ((tasksRes.data ?? []) as unknown as ActionPlanTaskApiRow[]).map(
        toActionPlanTaskRow,
    );

    return toActionPlanDetail(planRes.data as unknown as ActionPlanApiRow, tasks);
}

export async function createActionPlan(plan: ActionPlanFormValues): Promise<ActionPlanRow> {
    const { data, error } = await supabase
        .from('property_action_plans')
        .insert(plan)
        .select(ACTION_PLANS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toActionPlanRow(data as unknown as ActionPlanApiRow);
}

export async function updateActionPlan(
    id: string,
    plan: Partial<ActionPlanFormValues>,
): Promise<ActionPlanRow> {
    const { data, error } = await supabase
        .from('property_action_plans')
        .update(plan)
        .eq('id', id)
        .select(ACTION_PLANS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toActionPlanRow(data as unknown as ActionPlanApiRow);
}

export async function completeActionPlan(id: string): Promise<void> {
    const { error } = await supabase
        .from('property_action_plans')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function softDeleteActionPlan(id: string): Promise<void> {
    const { error } = await supabase
        .from('property_action_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function restoreActionPlan(id: string): Promise<void> {
    const { error } = await supabase
        .from('property_action_plans')
        .update({ deleted_at: null })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function permanentDeleteActionPlan(id: string): Promise<void> {
    const { error } = await supabase.from('property_action_plans').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function fetchDeletedActionPlans(): Promise<ActionPlanRow[]> {
    const { data, error } = await supabase
        .from('property_action_plans')
        .select(ACTION_PLANS_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ActionPlanApiRow[]).map(toActionPlanRow);
}

// ============================================================
// API Functions - Action Plan Tasks
// ============================================================

export async function fetchTasksByPlan(planId: string): Promise<ActionPlanTaskRow[]> {
    const { data, error } = await supabase
        .from('action_plan_tasks')
        .select(ACTION_PLAN_TASKS_SELECT)
        .eq('plan_id', planId)
        .order('due_date');
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ActionPlanTaskApiRow[]).map(toActionPlanTaskRow);
}

export async function createActionPlanTask(
    task: ActionPlanTaskFormValues,
): Promise<ActionPlanTaskRow> {
    const { data, error } = await supabase
        .from('action_plan_tasks')
        .insert(task)
        .select(ACTION_PLAN_TASKS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toActionPlanTaskRow(data as unknown as ActionPlanTaskApiRow);
}

export async function updateActionPlanTask(
    id: string,
    task: Partial<ActionPlanTaskFormValues>,
): Promise<ActionPlanTaskRow> {
    const payload = { ...task };
    if (task.status === 'completed' && !task.completed_at) {
        payload.completed_at = new Date().toISOString();
    }
    const { data, error } = await supabase
        .from('action_plan_tasks')
        .update(payload)
        .eq('id', id)
        .select(ACTION_PLAN_TASKS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toActionPlanTaskRow(data as unknown as ActionPlanTaskApiRow);
}

export async function completeActionPlanTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('action_plan_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function deleteActionPlanTask(id: string): Promise<void> {
    const { error } = await supabase.from('action_plan_tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Communications
// ============================================================

export async function fetchCommunications(filters?: {
    owner_id?: string;
    property_id?: string;
    type?: CommunicationType;
    status?: CommunicationStatus;
    from_date?: string;
    to_date?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'created_at' | 'sent_at';
    sortOrder?: 'asc' | 'desc';
}): Promise<{
    data: CommunicationRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase.from('owner_communications').select(COMMUNICATIONS_SELECT, { count: 'exact' });

    if (filters?.owner_id) q = q.eq('owner_id', filters.owner_id);
    if (filters?.property_id) q = q.eq('property_id', filters.property_id);
    if (filters?.type) q = q.eq('type', filters.type);
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.from_date) q = q.gte('created_at', filters.from_date);
    if (filters?.to_date) q = q.lte('created_at', filters.to_date);

    const sortBy = filters?.sortBy ?? 'created_at';
    const sortOrder = filters?.sortOrder ?? 'desc';
    q = q.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
        data: ((data ?? []) as unknown as CommunicationApiRow[]).map(toCommunicationRow),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: pageSize > 0 ? Math.max(1, Math.ceil((count ?? 0) / pageSize)) : 1,
    };
}

export async function createCommunication(
    comm: CommunicationFormValues,
): Promise<CommunicationRow> {
    const payload = {
        ...comm,
        status: 'sent' as CommunicationStatus,
        sent_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('owner_communications')
        .insert(payload)
        .select(COMMUNICATIONS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toCommunicationRow(data as unknown as CommunicationApiRow);
}

export async function createDraftCommunication(
    comm: CommunicationFormValues,
): Promise<CommunicationRow> {
    const { data, error } = await supabase
        .from('owner_communications')
        .insert({ ...comm, status: 'draft' })
        .select(COMMUNICATIONS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toCommunicationRow(data as unknown as CommunicationApiRow);
}

export async function sendCommunication(id: string): Promise<CommunicationRow> {
    const { data, error } = await supabase
        .from('owner_communications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id)
        .select(COMMUNICATIONS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toCommunicationRow(data as unknown as CommunicationApiRow);
}

export async function deleteCommunication(id: string): Promise<void> {
    const { error } = await supabase.from('owner_communications').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Reports
// ============================================================

export async function fetchReports(filters?: {
    property_id?: string;
    owner_id?: string;
    report_type?: ReportType;
    status?: CommunicationStatus;
    page?: number;
    pageSize?: number;
    sortBy?: 'generated_at' | 'sent_at';
    sortOrder?: 'asc' | 'desc';
}): Promise<{
    data: ReportRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase.from('owner_reports').select(REPORTS_SELECT, { count: 'exact' });

    if (filters?.property_id) q = q.eq('property_id', filters.property_id);
    if (filters?.owner_id) q = q.eq('owner_id', filters.owner_id);
    if (filters?.report_type) q = q.eq('report_type', filters.report_type);
    if (filters?.status) q = q.eq('status', filters.status);

    const sortBy = filters?.sortBy ?? 'generated_at';
    const sortOrder = filters?.sortOrder ?? 'desc';
    q = q.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
        data: ((data ?? []) as unknown as ReportApiRow[]).map(toReportRow),
        count: count ?? 0,
        page,
        pageSize,
        totalPages: pageSize > 0 ? Math.max(1, Math.ceil((count ?? 0) / pageSize)) : 1,
    };
}

export async function fetchReportById(id: string): Promise<ReportRow | null> {
    const { data, error } = await supabase
        .from('owner_reports')
        .select(REPORTS_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toReportRow(data as unknown as ReportApiRow) : null;
}

export async function createReport(report: ReportFormValues): Promise<ReportRow> {
    const { data, error } = await supabase
        .from('owner_reports')
        .insert({
            ...report,
            generated_at: new Date().toISOString(),
            content_json: report.content_json as any,
        })
        .select(REPORTS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toReportRow(data as unknown as ReportApiRow);
}

export async function sendReport(id: string): Promise<ReportRow> {
    const { data, error } = await supabase
        .from('owner_reports')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id)
        .select(REPORTS_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return toReportRow(data as unknown as ReportApiRow);
}

export async function deleteReport(id: string): Promise<void> {
    const { error } = await supabase.from('owner_reports').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

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
} from '../../types/owners';

export type {
    OwnersFilters,
    ActionPlansFilters,
    CommunicationsFilters,
    ReportsFilters,
} from '../../types/owners';
