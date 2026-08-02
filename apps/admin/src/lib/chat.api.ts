import { useList, useItem, useMutation, queryKeys } from './api';
import type {
  ChatChannelType,
  MessageType,
  ChatChannel,
  ChatParticipant,
  ChatMessage,
  ChatMessageRead,
} from '../types/chat';
import {
  MESSAGE_TYPE_LABEL,
  CHANNEL_TYPE_LABEL,
} from '../types/chat';

const CHANNELS_PATH = 'chat_channels';
const MESSAGES_PATH = 'chat_messages';

export function useChannels(agentId: string | null) {
  return useList<ChatChannel>({
    queryKey: queryKeys.leads([{ chat: agentId }]),
    path: CHANNELS_PATH,
    select: `
      id,type,name,property_id,lead_id,created_by,created_at,updated_at,deleted_at,
      participants:chat_channel_participants!inner(
        id,channel_id,agent_id,joined_at,last_read_at,notifications_enabled,
        agent:agents(name,email,photo_url)
      ),
      last_message:chat_messages!chat_messages_channel_id_fkey(
        id,channel_id,sender_id,content,message_type,file_url,file_name,file_size,
        reply_to_id,edited_at,created_at,updated_at,deleted_at,
        sender:agents(name,photo_url),
        reply_to:chat_messages!chat_messages_reply_to_id_fkey(
          id,channel_id,sender_id,content,message_type,file_url,file_name,file_size,
          reply_to_id,edited_at,created_at,updated_at,deleted_at,
          sender:agents(name,photo_url)
        ),
        reads:chat_message_reads(
          id,message_id,agent_id,read_at,
          agent:agents(name)
        )
      )
    `,
    filters: {
      deleted_at: 'is.null',
      chat_channel_participants: { agent_id: `eq.${agentId}` },
    },
    page: 1,
    pageSize: 50,
    orderBy: 'updated_at',
    ascending: false,
    enabled: !!agentId,
  });
}

export function useChannel(channelId: string | null) {
  return useItem<ChatChannel>(
    queryKeys.leads([{ chat: channelId }]),
    CHANNELS_PATH,
    channelId,
    !!channelId
  );
}

export function useMessages(channelId: string | null, options?: {
  limit?: number;
  before?: string;
}) {
  return useList<ChatMessage>({
    queryKey: queryKeys.leads([{ chat: channelId, messages: options }]),
    path: MESSAGES_PATH,
    select: `
      id,channel_id,sender_id,content,message_type,file_url,file_name,file_size,
      reply_to_id,edited_at,created_at,updated_at,deleted_at,
      sender:agents(name,photo_url),
      reply_to:chat_messages!chat_messages_reply_to_id_fkey(
        id,channel_id,sender_id,content,message_type,file_url,file_name,file_size,
        reply_to_id,edited_at,created_at,updated_at,deleted_at,
        sender:agents(name,photo_url)
      ),
      reads:chat_message_reads(
        id,message_id,agent_id,read_at,
        agent:agents(name)
      )
    `,
    filters: {
      channel_id: `eq.${channelId}`,
      deleted_at: 'is.null',
      ...(options?.before ? { created_at: `lt.${options.before}` } : {}),
    },
    page: 1,
    pageSize: options?.limit ?? 50,
    orderBy: 'created_at',
    ascending: false,
    enabled: !!channelId,
  });
}

export function useCreateDirectChannel() {
  return useMutation({
    mutationFn: async ({ agentIds, creatorId }: { agentIds: string[]; creatorId: string }) => {
      const { createDirectChannel } = await import('./chat');
      return createDirectChannel(agentIds, creatorId);
    },
  });
}

export function useCreateGroupChannel() {
  return useMutation({
    mutationFn: async ({ name, agentIds, creatorId }: { name: string; agentIds: string[]; creatorId: string }) => {
      const { createGroupChannel } = await import('./chat');
      return createGroupChannel(name, agentIds, creatorId);
    },
  });
}

export function useCreatePropertyChannel() {
  return useMutation({
    mutationFn: async ({ propertyId, agentIds, creatorId }: { propertyId: string; agentIds: string[]; creatorId: string }) => {
      const { createPropertyChannel } = await import('./chat');
      return createPropertyChannel(propertyId, agentIds, creatorId);
    },
  });
}

export function useCreateLeadChannel() {
  return useMutation({
    mutationFn: async ({ leadId, agentIds, creatorId }: { leadId: string; agentIds: string[]; creatorId: string }) => {
      const { createLeadChannel } = await import('./chat');
      return createLeadChannel(leadId, agentIds, creatorId);
    },
  });
}

export function useAddParticipant() {
  return useMutation({
    mutationFn: async ({ channelId, agentId }: { channelId: string; agentId: string }) => {
      const { addParticipant } = await import('./chat');
      return addParticipant(channelId, agentId);
    },
  });
}

export function useRemoveParticipant() {
  return useMutation({
    mutationFn: async ({ channelId, agentId }: { channelId: string; agentId: string }) => {
      const { removeParticipant } = await import('./chat');
      return removeParticipant(channelId, agentId);
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      channelId,
      senderId,
      content,
      options,
    }: {
      channelId: string;
      senderId: string;
      content: string;
      options?: {
        message_type?: 'text' | 'file' | 'image';
        file_url?: string;
        file_name?: string;
        file_size?: number;
        reply_to_id?: string;
      };
    }) => {
      const { sendMessage } = await import('./chat');
      return sendMessage(channelId, senderId, content, options);
    },
  });
}

export function useEditMessage() {
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { editMessage } = await import('./chat');
      return editMessage(messageId, content);
    },
  });
}

export function useSoftDeleteMessage() {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { softDeleteMessage } = await import('./chat');
      return softDeleteMessage(messageId);
    },
  });
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: async ({ messageId, agentId }: { messageId: string; agentId: string }) => {
      const { markAsRead } = await import('./chat');
      return markAsRead(messageId, agentId);
    },
  });
}

export function useMarkChannelAsRead() {
  return useMutation({
    mutationFn: async ({ channelId, agentId }: { channelId: string; agentId: string }) => {
      const { markChannelAsRead } = await import('./chat');
      return markChannelAsRead(channelId, agentId);
    },
  });
}

export function useUpdateLastRead() {
  return useMutation({
    mutationFn: async ({ channelId, agentId }: { channelId: string; agentId: string }) => {
      const { updateLastRead } = await import('./chat');
      return updateLastRead(channelId, agentId);
    },
  });
}

export function useSubscribeToChannelMessages(
  _channelId: string | null,
  _callbacks: {
    onMessage?: (msg: ChatMessage) => void;
    onUpdate?: (msg: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
  }
) {
  return { subscribe: () => {}, unsubscribe: () => {} };
}

export { queryKeys };
export type { ChatChannelType, MessageType, ChatChannel, ChatParticipant, ChatMessage, ChatMessageRead };
export { MESSAGE_TYPE_LABEL, CHANNEL_TYPE_LABEL };