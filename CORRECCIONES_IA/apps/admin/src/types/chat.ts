export type ChatChannelType = 'direct' | 'group' | 'property' | 'lead';
export type MessageType = 'text' | 'system' | 'file' | 'image';

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
    notifications_enabled: boolean | null;
    agent_name: string | null;
    agent_email: string | null;
    agent_photo_url: string | null;
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
    read_by: ChatMessageRead[];
}

export interface ChatMessageRead {
    id: string;
    message_id: string;
    agent_id: string;
    read_at: string;
    agent_name: string | null;
}

export const MESSAGE_TYPE_LABEL: Record<MessageType, string> = {
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
