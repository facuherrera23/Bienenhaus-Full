// ============================================================
// Chat Types
// ============================================================

export type ChatChannelType = 'direct' | 'group' | 'property' | 'lead';
export type MessageType = 'text' | 'file' | 'image' | 'system';

export const MESSAGE_TYPE_LABEL: Record<MessageType, string> = {
    text: 'Texto',
    file: 'Archivo',
    image: 'Imagen',
    system: 'Sistema',
};

export const CHANNEL_TYPE_LABEL: Record<ChatChannelType, string> = {
    direct: 'Directo',
    group: 'Grupal',
    property: 'Propiedad',
    lead: 'Lead',
};

// ============================================================
// DB row types with embedded relations
// ============================================================

import { supabase } from '@bienenhaus/supabase';
import type { Database } from '../types/database';

type MessageEmbedded = Database['public']['Tables']['chat_messages']['Row'] & {
    sender: { name: string; photo_url: string | null }[] | null;
    reply_to?: MessageEmbedded[] | null;
    reads?: Array<
        Database['public']['Tables']['chat_message_reads']['Row'] & {
            agent: { name: string }[];
        }
    >;
};

export type ChannelApiRow = Database['public']['Tables']['chat_channels']['Row'] & {
    participants:
        | Array<
              Database['public']['Tables']['chat_channel_participants']['Row'] & {
                  agent: {
                      name: string;
                      email: string | null;
                      photo_url: string | null;
                      is_ai: boolean;
                  }[];
              }
          >
        | null;
    last_message: MessageEmbedded[];
};

export type MessageApiRow = MessageEmbedded;

// ============================================================
// Embed helpers
// ============================================================

export function embedAgentName(v: { name: string } | { name: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.name ?? null) : v.name;
}

export function embedAgentEmail(
    v: { email: string | null } | { email: string | null }[] | null,
): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.email ?? null) : v.email;
}

export function embedAgentPhoto(
    v: { photo_url: string | null } | { photo_url: string | null }[] | null,
): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.photo_url ?? null) : v.photo_url;
}

export function embedAgentIsAi(v: { is_ai: boolean } | { is_ai: boolean }[] | null): boolean {
    if (!v) return false;
    return Array.isArray(v) ? (v[0]?.is_ai ?? false) : v.is_ai;
}

// ============================================================
// Mappers
// ============================================================

export function toChannelRow(c: ChannelApiRow): ChatChannel {
    let lastMessage: ChatMessage | null = null;
    if (c.last_message && c.last_message.length > 0) {
        const msg = c.last_message[0];
        lastMessage = toMessageRow(msg);
    }

    return {
        id: c.id,
        type: c.type as ChatChannelType,
        name: c.name,
        property_id: c.property_id,
        lead_id: c.lead_id,
        created_by: c.created_by,
        created_at: c.created_at,
        updated_at: c.updated_at,
        deleted_at: c.deleted_at,
        participants: (c.participants ?? []).map((p) => ({
            id: p.id,
            channel_id: p.channel_id,
            agent_id: p.agent_id,
            joined_at: p.joined_at,
            last_read_at: p.last_read_at,
            notifications_enabled: p.notifications_enabled ?? false,
            agent_name: embedAgentName(p.agent),
            agent_email: embedAgentEmail(p.agent),
            agent_photo_url: embedAgentPhoto(p.agent),
            is_ai: embedAgentIsAi(p.agent),
        })),
        last_message: lastMessage,
        unread_count: 0,
    };
}

export function toMessageRow(m: MessageApiRow): ChatMessage {
    const replyTo = Array.isArray(m.reply_to) ? (m.reply_to[0] ?? null) : m.reply_to;
    return {
        id: m.id,
        channel_id: m.channel_id,
        sender_id: m.sender_id,
        content: m.content,
        message_type: m.message_type as MessageType,
        file_url: m.file_url,
        file_name: m.file_name,
        file_size: m.file_size,
        reply_to_id: m.reply_to_id,
        edited_at: m.edited_at,
        created_at: m.created_at,
        updated_at: m.updated_at,
        deleted_at: m.deleted_at,
        sender_name: embedAgentName(m.sender),
        sender_photo_url: embedAgentPhoto(m.sender),
        reply_to: replyTo ? toMessageRow(replyTo) : null,
        read_by: (m.reads ?? []).map((r) => ({
            id: r.id,
            message_id: r.message_id,
            agent_id: r.agent_id,
            read_at: r.read_at,
            agent_name: embedAgentName(r.agent),
        })),
    };
}

// ============================================================
// Public Types
// ============================================================

export interface ChatChannel {
    id: string;
    type: ChatChannelType;
    name: string | null;
    property_id: string | null;
    lead_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    participants: ChannelParticipant[];
    last_message: ChatMessage | null;
    unread_count: number;
}

export interface ChannelParticipant {
    id: string;
    channel_id: string;
    agent_id: string;
    joined_at: string;
    last_read_at: string | null;
    notifications_enabled: boolean;
    agent_name: string | null;
    agent_email: string | null;
    agent_photo_url: string | null;
    is_ai: boolean;
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    message_type: MessageType;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    reply_to_id: string | null;
    edited_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    sender_name: string | null;
    sender_photo_url: string | null;
    reply_to: ChatMessage | null;
    read_by: MessageRead[];
}

export interface MessageRead {
    id: string;
    message_id: string;
    agent_id: string;
    read_at: string;
    agent_name: string | null;
}

// ============================================================
// Channel API
// ============================================================

export async function fetchChannels(agentId: string): Promise<ChatChannel[]> {
    const { data, error } = await supabase
        .from('chat_channels')
        .select(
            `
            id, type, name, property_id, lead_id, created_by, created_at, updated_at, deleted_at,
            participants:chat_channel_participants!inner(
                id, channel_id, agent_id, joined_at, last_read_at, notifications_enabled,
                agent:agents(name, email, photo_url, is_ai)
            ),
            last_message:chat_messages!chat_messages_channel_id_fkey(
                id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                reply_to_id, edited_at, created_at, updated_at, deleted_at,
                sender:agents(name, photo_url),
                reply_to:chat_messages!chat_messages_reply_to_id_fkey(
                    id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                    reply_to_id, edited_at, created_at, updated_at, deleted_at,
                    sender:agents(name, photo_url)
                ),
                reads:chat_message_reads(id, message_id, agent_id, read_at, agent:agents(name))
            )
        `,
        )
        .eq('chat_channel_participants.agent_id', agentId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(toChannelRow);
}

export async function fetchChannel(channelId: string): Promise<ChatChannel> {
    const { data, error } = await supabase
        .from('chat_channels')
        .select(
            `
            id, type, name, property_id, lead_id, created_by, created_at, updated_at, deleted_at,
            participants:chat_channel_participants!inner(
                id, channel_id, agent_id, joined_at, last_read_at, notifications_enabled,
                agent:agents(name, email, photo_url, is_ai)
            ),
            last_message:chat_messages!chat_messages_channel_id_fkey(
                id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                reply_to_id, edited_at, created_at, updated_at, deleted_at,
                sender:agents(name, photo_url),
                reply_to:chat_messages!chat_messages_reply_to_id_fkey(
                    id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                    reply_to_id, edited_at, created_at, updated_at, deleted_at,
                    sender:agents(name, photo_url)
                ),
                reads:chat_message_reads(id, message_id, agent_id, read_at, agent:agents(name))
            )
        `,
        )
        .eq('id', channelId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Canal no encontrado');
    return toChannelRow(data);
}

export async function createDirectChannel(
    agentIds: string[],
    creatorId: string,
): Promise<ChatChannel> {
    const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .insert({ type: 'direct', created_by: creatorId })
        .select('id')
        .single();

    if (channelError) throw new Error(channelError.message);

    const participants = agentIds.map((agentId) => ({
        channel_id: channel.id,
        agent_id: agentId,
    }));

    const { error: participantsError } = await supabase
        .from('chat_channel_participants')
        .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    return fetchChannel(channel.id);
}

export async function createGroupChannel(
    name: string,
    agentIds: string[],
    creatorId: string,
): Promise<ChatChannel> {
    const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .insert({ type: 'group', name, created_by: creatorId })
        .select('id')
        .single();

    if (channelError) throw new Error(channelError.message);

    const participants = agentIds.map((agentId) => ({
        channel_id: channel.id,
        agent_id: agentId,
    }));

    const { error: participantsError } = await supabase
        .from('chat_channel_participants')
        .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    return fetchChannel(channel.id);
}

export async function createPropertyChannel(
    propertyId: string,
    agentIds: string[],
    creatorId: string,
): Promise<ChatChannel> {
    const { data: prop } = await supabase
        .from('properties')
        .select('title')
        .eq('id', propertyId)
        .single();

    const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .insert({
            type: 'property',
            name: prop?.title ?? 'Propiedad',
            property_id: propertyId,
            created_by: creatorId,
        })
        .select('id')
        .single();

    if (channelError) throw new Error(channelError.message);

    const participants = agentIds.map((agentId) => ({
        channel_id: channel.id,
        agent_id: agentId,
    }));

    const { error: participantsError } = await supabase
        .from('chat_channel_participants')
        .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    return fetchChannel(channel.id);
}

export async function createLeadChannel(
    leadId: string,
    agentIds: string[],
    creatorId: string,
): Promise<ChatChannel> {
    const { data: lead } = await supabase
        .from('leads')
        .select('name, last_name')
        .eq('id', leadId)
        .single();

    const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .insert({
            type: 'lead',
            name: lead ? `${lead.name} ${lead.last_name}` : 'Lead',
            lead_id: leadId,
            created_by: creatorId,
        })
        .select('id')
        .single();

    if (channelError) throw new Error(channelError.message);

    const participants = agentIds.map((agentId) => ({
        channel_id: channel.id,
        agent_id: agentId,
    }));

    const { error: participantsError } = await supabase
        .from('chat_channel_participants')
        .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    return fetchChannel(channel.id);
}

// ============================================================
// Auto channel creation (G5)
// ============================================================

export interface CreateChannelForLeadParams {
    leadId: string;
    creatorId: string;
    additionalAgentIds?: string[];
}

export async function createChannelForLead(
    params: CreateChannelForLeadParams,
): Promise<ChatChannel | null> {
    const { leadId, creatorId, additionalAgentIds = [] } = params;

    const { data: lead } = await supabase
        .from('leads')
        .select('assigned_to')
        .eq('id', leadId)
        .single();

    const participantIds = new Set<string>(additionalAgentIds);
    if (lead?.assigned_to) participantIds.add(lead.assigned_to);
    participantIds.add(creatorId);

    const { data: existing } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('type', 'lead')
        .eq('lead_id', leadId)
        .is('deleted_at', null)
        .maybeSingle();

    if (existing) {
        const { data: currentParticipants } = await supabase
            .from('chat_channel_participants')
            .select('agent_id')
            .eq('channel_id', existing.id);

        const currentIds = new Set(currentParticipants?.map((p) => p.agent_id) ?? []);
        const toAdd = Array.from(participantIds).filter((id) => !currentIds.has(id));

        if (toAdd.length > 0) {
            await supabase
                .from('chat_channel_participants')
                .insert(toAdd.map((agentId) => ({ channel_id: existing.id, agent_id: agentId })));
        }

        return fetchChannel(existing.id);
    }

    return createLeadChannel(leadId, Array.from(participantIds), creatorId);
}

export interface CreateChannelForVisitParams {
    visitId: string;
    creatorId: string;
    additionalAgentIds?: string[];
}

export async function createChannelForVisit(
    params: CreateChannelForVisitParams,
): Promise<ChatChannel | null> {
    const { visitId, creatorId, additionalAgentIds = [] } = params;

    const { data: visit } = await supabase
        .from('visits')
        .select('agent_id, property_id, lead_id')
        .eq('id', visitId)
        .single();

    if (!visit) return null;

    const participantIds = new Set<string>(additionalAgentIds);
    participantIds.add(creatorId);
    if (visit.agent_id) participantIds.add(visit.agent_id);

    if (visit.lead_id) {
        const { data: lead } = await supabase
            .from('leads')
            .select('assigned_to')
            .eq('id', visit.lead_id)
            .single();
        if (lead?.assigned_to) participantIds.add(lead.assigned_to);
    }

    if (visit.property_id) {
        const { data: assignments } = await supabase
            .from('v_agent_properties' as never)
            .select('agent_id')
            .eq('property_id', visit.property_id)
            .returns<{ agent_id: string }[]>();
        assignments?.forEach((a) => participantIds.add(a.agent_id));
    }

    const channelType = visit.property_id ? 'property' : 'lead';
    const refId = visit.property_id ?? visit.lead_id;

    if (!refId) return null;

    const { data: existing } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('type', channelType)
        .eq(channelType === 'property' ? 'property_id' : 'lead_id', refId)
        .is('deleted_at', null)
        .maybeSingle();

    if (existing) {
        const { data: currentParticipants } = await supabase
            .from('chat_channel_participants')
            .select('agent_id')
            .eq('channel_id', existing.id);

        const currentIds = new Set(currentParticipants?.map((p) => p.agent_id) ?? []);
        const toAdd = Array.from(participantIds).filter((id) => !currentIds.has(id));

        if (toAdd.length > 0) {
            await supabase
                .from('chat_channel_participants')
                .insert(toAdd.map((agentId) => ({ channel_id: existing.id, agent_id: agentId })));
        }

        return fetchChannel(existing.id);
    }

    let channelName = 'Visita';
    if (channelType === 'property') {
        const { data: prop } = await supabase
            .from('properties')
            .select('title')
            .eq('id', refId)
            .single();
        channelName = prop?.title ?? 'Propiedad';
    } else if (visit.lead_id) {
        const { data: lead } = await supabase
            .from('leads')
            .select('name, last_name')
            .eq('id', visit.lead_id)
            .single();
        channelName = lead ? `${lead.name} ${lead.last_name}` : 'Lead';
    }

    const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .insert({
            type: channelType,
            name: channelName,
            [channelType === 'property' ? 'property_id' : 'lead_id']: refId,
            created_by: creatorId,
        })
        .select('id')
        .single();

    if (channelError) throw new Error(channelError.message);

    const participants = Array.from(participantIds).map((agentId) => ({
        channel_id: channel.id,
        agent_id: agentId,
    }));

    const { error: participantsError } = await supabase
        .from('chat_channel_participants')
        .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    return fetchChannel(channel.id);
}

// ============================================================
// Message API
// ============================================================

export async function fetchMessages(
    channelId: string,
    before?: string,
    limit = 50,
): Promise<ChatMessage[]> {
    let query = supabase
        .from('chat_messages')
        .select(
            `
            id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
            reply_to_id, edited_at, created_at, updated_at, deleted_at,
            sender:agents(name, photo_url),
            reply_to:chat_messages!chat_messages_reply_to_id_fkey(
                id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                reply_to_id, edited_at, created_at, updated_at, deleted_at,
                sender:agents(name, photo_url)
            ),
            reads:chat_message_reads(id, message_id, agent_id, read_at, agent:agents(name))
        `,
        )
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMessageRow);
}

export async function fetchMessage(messageId: string): Promise<ChatMessage> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select(
            `
            id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
            reply_to_id, edited_at, created_at, updated_at, deleted_at,
            sender:agents(name, photo_url),
            reply_to:chat_messages!chat_messages_reply_to_id_fkey(
                id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                reply_to_id, edited_at, created_at, updated_at, deleted_at,
                sender:agents(name, photo_url)
            ),
            reads:chat_message_reads(id, message_id, agent_id, read_at, agent:agents(name))
        `,
        )
        .eq('id', messageId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Mensaje no encontrado');
    return toMessageRow(data);
}

export async function sendMessage(
    channelId: string,
    senderId: string,
    content: string,
    options?: {
        message_type?: MessageType;
        file_url?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        reply_to_id?: string | null;
    },
): Promise<ChatMessage> {
    const start = Date.now();

    const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
            channel_id: channelId,
            sender_id: senderId,
            content,
            message_type: options?.message_type ?? 'text',
            file_url: options?.file_url ?? null,
            file_name: options?.file_name ?? null,
            file_size: options?.file_size ?? null,
            reply_to_id: options?.reply_to_id ?? null,
        })
        .select(
            `
            id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
            reply_to_id, edited_at, created_at, updated_at, deleted_at,
            sender:agents(name, photo_url),
            reply_to:chat_messages!chat_messages_reply_to_id_fkey(
                id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
                reply_to_id, edited_at, created_at, updated_at, deleted_at,
                sender:agents(name, photo_url)
            ),
            reads:chat_message_reads(id, message_id, agent_id, read_at, agent:agents(name))
        `,
        )
        .single();

    if (error) throw new Error(error.message);

    logChatAction({
        action: 'sendMessage',
        channel_id: channelId,
        sender_id: senderId,
        message_id: message.id,
        duration_ms: Date.now() - start,
    });
    return toMessageRow(message);
}

export async function editMessage(messageId: string, content: string): Promise<void> {
    const { error } = await supabase
        .from('chat_messages')
        .update({ content, edited_at: new Date().toISOString() })
        .eq('id', messageId);

    if (error) throw new Error(error.message);
}

export async function softDeleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString(), content: '[Mensaje eliminado]' })
        .eq('id', messageId);

    if (error) throw new Error(error.message);
}

export async function markAsRead(messageId: string, agentId: string): Promise<void> {
    const { error } = await supabase
        .from('chat_message_reads')
        .upsert({ message_id: messageId, agent_id: agentId, read_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
}

export async function markChannelAsRead(channelId: string, agentId: string): Promise<void> {
    const { data: readMessages } = await supabase
        .from('chat_message_reads')
        .select('message_id')
        .eq('agent_id', agentId);

    const readMessageIds = readMessages?.map((m: { message_id: string }) => m.message_id) ?? [];

    let query = supabase
        .from('chat_messages')
        .select('id')
        .eq('channel_id', channelId)
        .is('deleted_at', null);

    if (readMessageIds.length > 0) {
        query = query.not('id', 'in', `(${readMessageIds.join(',')})`);
    }

    const { data: unreadMessages } = await query;

    if (unreadMessages?.length) {
        const reads = unreadMessages.map((m: { id: string }) => ({
            message_id: m.id,
            agent_id: agentId,
            read_at: new Date().toISOString(),
        }));
        await supabase.from('chat_message_reads').upsert(reads);
    }

    await supabase
        .from('chat_channel_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('agent_id', agentId);
}

// ============================================================
// Realtime Subscriptions
// ============================================================

export function subscribeToChannelMessages(
    channelId: string,
    onMessage: (msg: ChatMessage) => void,
    onUpdate: (msg: ChatMessage) => void,
    onDelete: (messageId: string) => void,
) {
    const channel = supabase
        .channel(`chat:${channelId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
            },
            (payload) => {
                fetchMessage(payload.new.id)
                    .then(onMessage)
                    .catch((err) => {
                        logChatError({ action: 'realtime_insert', message_id: payload.new.id, error: String(err) });
                    });
            },
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
            },
            (payload) => {
                fetchMessage(payload.new.id)
                    .then(onUpdate)
                    .catch((err) => {
                        logChatError({ action: 'realtime_update', message_id: payload.new.id, error: String(err) });
                    });
            },
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
            },
            (payload) => {
                onDelete(payload.old.id);
            },
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// ============================================================
// Structured Logging
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ChatLogEntry {
    timestamp: string;
    level: LogLevel;
    action: string;
    channel_id?: string;
    message_id?: string;
    sender_id?: string;
    duration_ms?: number;
    error?: string;
    metadata?: Record<string, unknown>;
}

function log(level: LogLevel, entry: Omit<ChatLogEntry, 'timestamp' | 'level'>): void {
    const out: ChatLogEntry = { timestamp: new Date().toISOString(), level, ...entry };
    if (level === 'error') {
        console.error(JSON.stringify(out));
    } else {
        console.warn(JSON.stringify(out));
    }
}

export function logChatAction(entry: Omit<ChatLogEntry, 'timestamp' | 'level'>): void {
    log('info', entry);
}

export function logChatWarn(entry: Omit<ChatLogEntry, 'timestamp' | 'level'>): void {
    log('warn', entry);
}

export function logChatError(entry: Omit<ChatLogEntry, 'timestamp' | 'level'>): void {
    log('error', entry);
}


