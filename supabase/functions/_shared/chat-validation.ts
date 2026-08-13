/**
 * Zod Schemas para validación runtime de Chat.
 * Elimina `any` en chat.ts, ChatPage.tsx, realtime handlers.
 */

import { z } from 'zod';

export const ChatChannelTypeSchema = z.enum(['direct', 'group', 'property', 'lead']);
export const MessageTypeSchema = z.enum(['text', 'file', 'image']);

export const ChatChannelSchema = z.object({
    id: z.string().uuid(),
    type: ChatChannelTypeSchema,
    name: z.string().max(100).nullable(),
    property_id: z.string().uuid().nullable(),
    lead_id: z.string().uuid().nullable(),
    created_by: z.string().uuid(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    deleted_at: z.string().datetime().nullable(),
    participants: z.array(
        z.object({
            id: z.string().uuid(),
            channel_id: z.string().uuid(),
            agent_id: z.string().uuid(),
            joined_at: z.string().datetime(),
            last_read_at: z.string().datetime().nullable(),
            notifications_enabled: z.boolean().default(false),
            agent_name: z.string().nullable(),
            agent_email: z.string().nullable(),
            agent_photo_url: z.string().url().nullable(),
        }),
    ),
    last_message: z.object({
        id: z.string().uuid(),
        channel_id: z.string().uuid(),
        sender_id: z.string().uuid(),
        content: z.string(),
        message_type: MessageTypeSchema,
        file_url: z.string().url().nullable(),
        file_name: z.string().nullable(),
        file_size: z.number().nullable(),
        reply_to_id: z.string().uuid().nullable(),
        edited_at: z.string().datetime().nullable(),
        created_at: z.string().datetime(),
        updated_at: z.string().datetime(),
        deleted_at: z.string().datetime().nullable(),
        sender_name: z.string().nullable(),
        sender_photo_url: z.string().url().nullable(),
        reply_to: z
            .object({
                id: z.string().uuid(),
                channel_id: z.string().uuid(),
                sender_id: z.string().uuid(),
                content: z.string(),
                message_type: z.enum(['text', 'file', 'image']),
                file_url: z.string().url().nullable(),
                file_name: z.string().nullable(),
                file_size: z.number().nullable(),
                reply_to_id: z.string().uuid().nullable(),
                edited_at: z.string().datetime().nullable(),
                created_at: z.string().datetime(),
                updated_at: z.string().datetime(),
                deleted_at: z.string().datetime().nullable(),
                sender_name: z.string().nullable(),
                sender_photo_url: z.string().url().nullable(),
            })
            .nullable(),
        unread_count: z.number().int().nonnegative().default(0),
    }),
});

export const ChatMessageSchema = z.object({
    id: z.string().uuid(),
    channel_id: z.string().uuid(),
    sender_id: z.string().uuid(),
    content: z.string(),
    message_type: MessageTypeSchema,
    file_url: z.string().url().nullable(),
    file_name: z.string().nullable(),
    file_size: z.number().nullable(),
    reply_to_id: z.string().uuid().nullable(),
    edited_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    deleted_at: z.string().datetime().nullable(),
    sender_name: z.string().nullable(),
    sender_photo_url: z.string().url().nullable(),
    reply_to: z
        .object({
            id: z.string().uuid(),
            channel_id: z.string().uuid(),
            sender_id: z.string().uuid(),
            content: z.string(),
            message_type: z.enum(['text', 'file', 'image']),
            file_url: z.string().url().nullable(),
            file_name: z.string().nullable(),
            file_size: z.number().nullable(),
            reply_to_id: z.string().uuid().nullable(),
            edited_at: z.string().datetime().nullable(),
            created_at: z.string().datetime(),
            updated_at: z.string().datetime(),
            deleted_at: z.string().datetime().nullable(),
            sender_name: z.string().nullable(),
            sender_photo_url: z.string().url().nullable(),
        })
        .nullable(),
    read_by: z.array(
        z.object({
            id: z.string().uuid(),
            message_id: z.string().uuid(),
            agent_id: z.string().uuid(),
            read_at: z.string().datetime(),
            agent_name: z.string().nullable(),
        }),
    ),
});

export const ChatMessageRealtimeSchema = z.discriminatedUnion('eventType', [
    z.object({
        eventType: z.literal('INSERT'),
        new: z.object({
            id: z.string().uuid(),
            channel_id: z.string().uuid(),
            sender_id: z.string().uuid(),
            content: z.string(),
            message_type: z.enum(['text', 'file', 'image']),
            file_url: z.string().url().nullable(),
            file_name: z.string().nullable(),
            file_size: z.number().nullable(),
            reply_to_id: z.string().uuid().nullable(),
            created_at: z.string().datetime(),
        }),
    }),
    z.object({
        eventType: z.literal('UPDATE'),
        new: z.object({
            id: z.string().uuid(),
            content: z.string(),
            edited_at: z.string().datetime(),
        }),
        old: z.object({ id: z.string().uuid(), content: z.string() }),
    }),
    z.object({
        eventType: z.literal('DELETE'),
        old: z.object({ id: z.string().uuid() }),
    }),
]);

export const CreateDirectChannelSchema = z.object({
    agentIds: z.array(z.string().uuid()).length(2),
    creatorId: z.string().uuid(),
});

export const CreateGroupChannelSchema = z.object({
    name: z.string().min(1).max(100),
    agentIds: z.array(z.string().uuid()).min(2),
    creatorId: z.string().uuid(),
});

export const CreatePropertyChannelSchema = z.object({
    propertyId: z.string().uuid(),
    agentIds: z.array(z.string().uuid()).min(1),
    creatorId: z.string().uuid(),
});

export const CreateLeadChannelSchema = z.object({
    leadId: z.string().uuid(),
    agentIds: z.array(z.string().uuid()).min(1),
    creatorId: z.string().uuid(),
});

export const SendMessageSchema = z.object({
    channel_id: z.string().uuid(),
    sender_id: z.string().uuid(),
    content: z.string().min(1).max(4000),
    message_type: z.enum(['text', 'file', 'image']).default('text'),
    file_url: z.string().url().nullable().optional(),
    file_name: z.string().max(255).nullable().optional(),
    file_size: z.number().int().positive().nullable().optional(),
    reply_to_id: z.string().uuid().nullable().optional(),
});

export const EditMessageSchema = z.object({
    content: z.string().min(1).max(4000),
});

export const UploadFileSchema = z
    .object({
        channel_id: z.string().uuid(),
        file: z.instanceof(File),
        message_type: z.enum(['file', 'image']).optional(),
    })
    .refine((data) => data.file.size <= 10 * 1024 * 1024, {
        message: 'Archivo supera 10 MB',
        path: ['file'],
    })
    .refine(
        (data) =>
            ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(data.file.type),
        { message: 'Solo imágenes y PDFs permitidos', path: ['file'] },
    );

// Type exports
export type ChatChannelType = z.infer<typeof ChatChannelTypeSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
export type ChatChannel = z.infer<typeof ChatChannelSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatMessageRealtime = z.infer<typeof ChatMessageRealtimeSchema>;
export type CreateDirectChannel = z.infer<typeof CreateDirectChannelSchema>;
export type CreateGroupChannel = z.infer<typeof CreateGroupChannelSchema>;
export type CreatePropertyChannel = z.infer<typeof CreatePropertyChannelSchema>;
export type CreateLeadChannel = z.infer<typeof CreateLeadChannelSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type EditMessage = z.infer<typeof EditMessageSchema>;
export type UploadFile = z.infer<typeof UploadFileSchema>;

// Validation helpers with discriminated union return types
export function validateChatMessageRealtime(
    data: unknown,
): { valid: true; data: ChatMessageRealtime } | { valid: false; error: string } {
    const result = ChatMessageRealtimeSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateSendMessage(
    data: unknown,
): { valid: true; data: SendMessage } | { valid: false; error: string } {
    const result = SendMessageSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateUploadFile(data: unknown): { valid: boolean; error?: string } {
    const result = UploadFileSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true };
}
