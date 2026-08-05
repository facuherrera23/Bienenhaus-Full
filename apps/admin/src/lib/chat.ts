import { supabase } from './supabase';
import type {
  ChatChannel,
  ChatChannelType,
  ChatParticipant,
  ChatMessage,
  MessageType,
  ChatMessageRead,
} from '../types/chat';
import type { Database } from '../types/database';
import {
  MESSAGE_TYPE_LABEL,
  CHANNEL_TYPE_LABEL,
} from '../types/chat';

// ============================================================
// Re-export types and constants
// ============================================================

export type {
  ChatChannel,
  ChatChannelType,
  ChatParticipant,
  ChatMessage,
  MessageType,
  ChatMessageRead,
};

export { MESSAGE_TYPE_LABEL, CHANNEL_TYPE_LABEL };

// ============================================================
// DB row types with embedded relations
// ============================================================

type MessageEmbedded = Database['public']['Tables']['chat_messages']['Row'] & {
  sender: { name: string; photo_url: string } | { name: string; photo_url: string }[] | null;
  reply_to: MessageEmbedded | null;
  reads: Array<Database['public']['Tables']['chat_message_reads']['Row'] & { agent: { name: string } }>;
};

type ChannelApiRow = Database['public']['Tables']['chat_channels']['Row'] & {
  participants: (Database['public']['Tables']['chat_channel_participants']['Row'] & {
    agent: { name: string; email: string; photo_url: string };
  })[];
  last_message: MessageEmbedded[];
};

type MessageApiRow = MessageEmbedded;

// ============================================================
// Embed helpers
// ============================================================

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

// ============================================================
// Mappers
// ============================================================

function toChannelRow(c: ChannelApiRow): ChatChannel {
  // Construir el last_message con todas las propiedades requeridas
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
    })),
    last_message: lastMessage,
    unread_count: 0,
  };
}

function toMessageRow(m: MessageEmbedded): ChatMessage {
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
    reply_to: m.reply_to ? toMessageRow(m.reply_to) : null,
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
// SELECT strings
// ============================================================

const CHANNEL_SELECT = `
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
`.trim();

const MESSAGE_SELECT = `
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
`.trim();

const SINGLE_MESSAGE_SELECT = `
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
`.trim();

// ============================================================
// API Functions - Channels
// ============================================================

export async function fetchChannels(agentId: string): Promise<ChatChannel[]> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select(CHANNEL_SELECT)
    .eq('chat_channel_participants.agent_id', agentId)
    .is('chat_channels.deleted_at', null)
    .order('updated_at', { ascending: false, foreignTable: 'chat_messages' });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ChannelApiRow[]).map(toChannelRow);
}

export async function fetchChannel(channelId: string): Promise<ChatChannel> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select(CHANNEL_SELECT)
    .eq('id', channelId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Canal no encontrado');
  return toChannelRow(data as unknown as ChannelApiRow);
}

export async function createDirectChannel(agentIds: string[], creatorId: string): Promise<ChatChannel> {
  // Verificar si ya existe un canal directo entre estos agentes
  const { data: existing } = await supabase
    .from('chat_channels')
    .select(
      `
      id, type,
      participants:chat_channel_participants!inner(agent_id)
    `
    )
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

  // Crear nuevo canal
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({ type: 'direct', created_by: creatorId })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const participants = agentIds.map((agentId) => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  const { error: partError } = await supabase.from('chat_channel_participants').insert(participants);

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

  const participants = agentIds.map((agentId) => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  const { error: partError } = await supabase.from('chat_channel_participants').insert(participants);

  if (partError) throw new Error(partError.message);

  return await fetchChannel(channel.id);
}

export async function createPropertyChannel(
  propertyId: string,
  agentIds: string[],
  creatorId: string
): Promise<ChatChannel> {
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

  const participants = agentIds.map((agentId) => ({
    channel_id: channel.id,
    agent_id: agentId,
  }));

  await supabase.from('chat_channel_participants').insert(participants);

  return await fetchChannel(channel.id);
}

export async function createLeadChannel(
  leadId: string,
  agentIds: string[],
  creatorId: string
): Promise<ChatChannel> {
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

  const participants = agentIds.map((agentId) => ({
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
// API Functions - Messages
// ============================================================

export async function fetchMessages(channelId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select(MESSAGE_SELECT)
    .eq('channel_id', channelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  const messages = ((data ?? []) as unknown as MessageApiRow[]).map(toMessageRow).reverse();
  return messages;
}

export async function fetchMessage(messageId: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(SINGLE_MESSAGE_SELECT)
    .eq('id', messageId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Mensaje no encontrado');
  return toMessageRow(data as unknown as MessageApiRow);
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
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return toMessageRow(data as unknown as MessageApiRow);
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
  // Obtener mensajes ya leídos
  const { data: readMessages } = await supabase
    .from('chat_message_reads')
    .select('message_id')
    .eq('agent_id', agentId);

  const readMessageIds = readMessages?.map((m) => m.message_id) ?? [];

  // Obtener mensajes no leídos
  let query = supabase
    .from('chat_messages')
    .select('id')
    .eq('channel_id', channelId)
    .is('deleted_at', null);

  if (readMessageIds.length > 0) {
    query = query.not('id', 'in', `(${readMessageIds.join(',')})`);
  }

  const { data: unreadMessages } = await query;

  // Marcar como leídos
  if (unreadMessages?.length) {
    const reads = unreadMessages.map((m) => ({
      message_id: m.id,
      agent_id: agentId,
      read_at: new Date().toISOString(),
    }));
    await supabase.from('chat_message_reads').upsert(reads);
  }

  // Actualizar last_read_at
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
        fetchMessage(payload.new.id).then(onMessage).catch(() => {});
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
        fetchMessage(payload.new.id).then(onUpdate).catch(() => {});
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