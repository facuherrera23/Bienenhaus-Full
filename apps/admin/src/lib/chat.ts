import { supabase } from './supabase';

export type ChatChannelType = 'direct' | 'group' | 'property' | 'lead';

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
  // Joined
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
}

export interface ChatParticipant {
  id: string;
  channel_id: string;
  agent_id: string;
  joined_at: string;
  last_read_at: string | null;
  notifications_enabled: boolean;
  // Joined
  agent_name: string | null;
  agent_email: string | null;
  agent_photo_url: string | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'file' | 'image';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_id: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined
  sender_name: string | null;
  sender_photo_url: string | null;
  reply_to: ChatMessage | null;
  read_by: ChatMessageRead[];
}

export interface ChatMessageRead {
  id: string;
  message_id: string;
  agent_id: string;
  read_at: string;
  agent_name: string | null;
}

export const MESSAGE_TYPE_LABEL: Record<string, string> = {
  text: 'Texto',
  system: 'Sistema',
  file: 'Archivo',
  image: 'Imagen',
};

export const CHANNEL_TYPE_LABEL: Record<ChatChannelType, string> = {
  direct: 'Directo',
  group: 'Grupo',
  property: 'Propiedad',
  lead: 'Lead',
};

function embedAgentName(v: { name: string } | { name: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.name ?? null : v.name;
}

function embedAgentEmail(v: { email: string } | { email: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.email ?? null : v.email;
}

function embedAgentPhoto(v: { photo_url: string } | { photo_url: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.photo_url ?? null : v.photo_url;
}

function toChannelRow(c: any): ChatChannel {
  return {
    id: c.id,
    type: c.type,
    name: c.name,
    property_id: c.property_id,
    lead_id: c.lead_id,
    created_by: c.created_by,
    created_at: c.created_at,
    updated_at: c.updated_at,
    deleted_at: c.deleted_at,
    participants: (c.participants ?? []).map((p: any) => ({
      id: p.id,
      channel_id: p.channel_id,
      agent_id: p.agent_id,
      joined_at: p.joined_at,
      last_read_at: p.last_read_at,
      notifications_enabled: p.notifications_enabled,
      agent_name: embedAgentName(p.agent),
      agent_email: embedAgentEmail(p.agent),
      agent_photo_url: embedAgentPhoto(p.agent),
    })),
    last_message: c.last_message && c.last_message.length > 0 ? toMessageRow(c.last_message[0]) : null,
    unread_count: 0, // computed client-side or via RPC
  };
}

function toMessageRow(m: any): ChatMessage {
  return {
    id: m.id,
    channel_id: m.channel_id,
    sender_id: m.sender_id,
    content: m.content,
    message_type: m.message_type as ChatMessage['message_type'],
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
    reply_to: m.reply_to && m.reply_to.length > 0 ? toMessageRow(m.reply_to[0]) : null,
    read_by: (m.reads ?? []).map((r: any) => ({
      id: r.id,
      message_id: r.message_id,
      agent_id: r.agent_id,
      read_at: r.read_at,
      agent_name: embedAgentName(r.agent),
    })),
  };
}

// ============================================================
// CHANNELS
// ============================================================

export async function fetchChannels(agentId: string): Promise<ChatChannel[]> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select(`
      id, type, name, property_id, lead_id, created_by, created_at, updated_at, deleted_at,
      participants:chat_channel_participants!inner(
        id, channel_id, agent_id, joined_at, last_read_at, notifications_enabled,
        agent:agents(name, email, photo_url)
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
        reads:chat_message_reads(
          id, message_id, agent_id, read_at,
          agent:agents(name)
        )
      )
    `)
    .eq('chat_channel_participants.agent_id', agentId)
    .is('chat_channels.deleted_at', null)
    .order('updated_at', { ascending: false, foreignTable: 'chat_messages' });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toChannelRow);
}

export async function fetchChannel(channelId: string): Promise<ChatChannel> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select(`
      id, type, name, property_id, lead_id, created_by, created_at, updated_at, deleted_at,
      participants:chat_channel_participants(
        id, channel_id, agent_id, joined_at, last_read_at, notifications_enabled,
        agent:agents(name, email, photo_url)
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
        reads:chat_message_reads(
          id, message_id, agent_id, read_at,
          agent:agents(name)
        )
      )
    `)
    .eq('id', channelId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Canal no encontrado');
  return toChannelRow(data as any);
}

export async function createDirectChannel(agentIds: string[], creatorId: string): Promise<ChatChannel> {
  // Check if direct channel already exists between these agents
  const { data: existing } = await supabase
    .from('chat_channels')
    .select(`
      id, type,
      participants:chat_channel_participants!inner(agent_id)
    `)
    .eq('type', 'direct')
    .is('deleted_at', null);

  if (existing) {
    for (const ch of existing) {
      const participantAgentIds = ch.participants.map((p: any) => p.agent_id).sort();
      const targetIds = [...agentIds].sort();
      if (JSON.stringify(participantAgentIds) === JSON.stringify(targetIds)) {
        return await fetchChannel(ch.id);
      }
    }
  }

  // Create new direct channel
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({ type: 'direct', created_by: creatorId })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // Add participants
  const participants = agentIds.map(agentId => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  const { error: partError } = await supabase
    .from('chat_channel_participants')
    .insert(participants);

  if (partError) throw new Error(partError.message);

  return await fetchChannel(channel.id);
}

export async function createGroupChannel(
  name: string,
  agentIds: string[],
  creatorId: string
): Promise<ChatChannel> {
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({ type: 'group', name, created_by: creatorId })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const participants = agentIds.map(agentId => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  const { error: partError } = await supabase
    .from('chat_channel_participants')
    .insert(participants);

  if (partError) throw new Error(partError.message);

  return await fetchChannel(channel.id);
}

export async function createPropertyChannel(propertyId: string, agentIds: string[], creatorId: string): Promise<ChatChannel> {
  const { data: prop } = await supabase
    .from('properties')
    .select('title')
    .eq('id', propertyId)
    .maybeSingle();

  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({
      type: 'property',
      name: prop?.title ?? 'Propiedad',
      property_id: propertyId,
      created_by: creatorId,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const participants = agentIds.map(agentId => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  await supabase.from('chat_channel_participants').insert(participants);

  return await fetchChannel(channel.id);
}

export async function createLeadChannel(leadId: string, agentIds: string[], creatorId: string): Promise<ChatChannel> {
  const { data: lead } = await supabase
    .from('leads')
    .select('name, last_name')
    .eq('id', leadId)
    .maybeSingle();

  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({
      type: 'lead',
      name: lead ? `${lead.name} ${lead.last_name}` : 'Lead',
      lead_id: leadId,
      created_by: creatorId,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const participants = agentIds.map(agentId => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  await supabase.from('chat_channel_participants').insert(participants);

  return await fetchChannel(channel.id);
}

export async function addParticipant(channelId: string, agentId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channel_participants')
    .insert({ channel_id: channelId, agent_id: agentId })
    .select()
    .single();

  if (error) throw new Error(error.message);
}

export async function removeParticipant(channelId: string, agentId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channel_participants')
    .delete()
    .eq('channel_id', channelId)
    .eq('agent_id', agentId);

  if (error) throw new Error(error.message);
}

export async function updateLastRead(channelId: string, agentId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_channel_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('agent_id', agentId);

  if (error) throw new Error(error.message);
}

// ============================================================
// MESSAGES
// ============================================================

export async function fetchMessages(channelId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select(`
      id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
      reply_to_id, edited_at, created_at, updated_at, deleted_at,
      sender:agents(name, photo_url),
      reply_to:chat_messages!chat_messages_reply_to_id_fkey(
        id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
        reply_to_id, edited_at, created_at, updated_at, deleted_at,
        sender:agents(name, photo_url)
      ),
      reads:chat_message_reads(
        id, message_id, agent_id, read_at,
        agent:agents(name)
      )
    `)
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  const messages = (data ?? []).map(toMessageRow).reverse();
  return messages;
}

export async function sendMessage(
  channelId: string,
  senderId: string,
  content: string,
  options?: {
    message_type?: 'text' | 'file' | 'image';
    file_url?: string;
    file_name?: string;
    file_size?: number;
    reply_to_id?: string;
  }
): Promise<ChatMessage> {
  const { data, error } = await supabase
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
    .select(`
      id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
      reply_to_id, edited_at, created_at, updated_at, deleted_at,
      sender:agents(name, photo_url),
      reply_to:chat_messages!chat_messages_reply_to_id_fkey(
        id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
        reply_to_id, edited_at, created_at, updated_at, deleted_at,
        sender:agents(name, photo_url)
      ),
      reads:chat_message_reads(
        id, message_id, agent_id, read_at,
        agent:agents(name)
      )
    `)
    .single();

  if (error) throw new Error(error.message);
  return toMessageRow(data as any);
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
  // Get all unread message IDs for this channel using a safe approach
  // First, get the read message IDs for this agent
  const { data: readMessages } = await supabase
    .from('chat_message_reads')
    .select('message_id')
    .eq('agent_id', agentId);

  const readMessageIds = readMessages?.map(m => m.message_id) ?? [];

  // Get unread messages for this channel (not deleted, not already read by this agent)
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
    const reads = unreadMessages.map(m => ({
      message_id: m.id,
      agent_id: agentId,
      read_at: new Date().toISOString(),
    }));
    await supabase.from('chat_message_reads').upsert(reads);
  }

  // Update last_read_at on participant
  await supabase
    .from('chat_channel_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('agent_id', agentId);
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

export function subscribeToChannelMessages(
  channelId: string,
  onMessage: (msg: ChatMessage) => void,
  onUpdate: (msg: ChatMessage) => void,
  onDelete: (messageId: string) => void
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
        // Fetch full message with relations
        fetchMessage(payload.new.id).then(onMessage);
      }
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
        fetchMessage(payload.new.id).then(onUpdate);
      }
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
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchMessage(messageId: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
      reply_to_id, edited_at, created_at, updated_at, deleted_at,
      sender:agents(name, photo_url),
      reply_to:chat_messages!chat_messages_reply_to_id_fkey(
        id, channel_id, sender_id, content, message_type, file_url, file_name, file_size,
        reply_to_id, edited_at, created_at, updated_at, deleted_at,
        sender:agents(name, photo_url)
      ),
      reads:chat_message_reads(
        id, message_id, agent_id, read_at,
        agent:agents(name)
      )
    `)
    .eq('id', messageId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Mensaje no encontrado');
  return toMessageRow(data as any);
}