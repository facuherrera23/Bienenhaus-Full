import { supabase } from '@bienenhaus/supabase';

export interface AgentPropertyAssignment {
    id: string;
    agent_id: string;
    property_id: string;
    assigned_by: string | null;
    assigned_at: string;
    notes: string | null;
}

export interface AgentPropertyView {
    assignment_id: string;
    agent_id: string;
    property_id: string;
    assigned_at: string;
    notes: string | null;
    agent_name: string;
    agent_email: string;
    agent_photo: string | null;
    property_title: string;
    property_status: string;
    property_listing_type: string;
    property_price: number | null;
}

export async function assignAgentToProperty(
    agentId: string,
    propertyId: string,
    notes?: string,
): Promise<{ assignment_id: string }> {
    const { data, error } = await supabase.rpc('assign_agent_to_property', {
        p_agent_id: agentId,
        p_property_id: propertyId,
        p_notes: notes ?? null,
    });
    if (error) throw new Error(error.message);
    return data as { assignment_id: string };
}

export async function unassignAgentFromProperty(
    agentId: string,
    propertyId: string,
): Promise<void> {
    const { error } = await supabase.rpc('unassign_agent_from_property', {
        p_agent_id: agentId,
        p_property_id: propertyId,
    });
    if (error) throw new Error(error.message);
}

export async function fetchPropertiesForAgent(agentId: string): Promise<AgentPropertyView[]> {
    const { data, error } = await supabase
        .from('v_agent_properties' as never)
        .select('*')
        .eq('agent_id', agentId)
        .order('assigned_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AgentPropertyView[];
}

export async function fetchAgentsForProperty(propertyId: string): Promise<AgentPropertyView[]> {
    const { data, error } = await supabase
        .from('v_agent_properties' as never)
        .select('*')
        .eq('property_id', propertyId)
        .order('assigned_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AgentPropertyView[];
}
