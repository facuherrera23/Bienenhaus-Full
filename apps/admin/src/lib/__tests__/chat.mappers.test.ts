import { describe, expect, it } from 'vitest';
import {
    embedAgentEmail,
    embedAgentIsAi,
    embedAgentName,
    embedAgentPhoto,
    toChannelRow,
    toMessageRow,
} from '../chat';

describe('Chat embed helpers', () => {
    describe('embedAgentName', () => {
        it('returns null for null input', () => {
            expect(embedAgentName(null)).toBeNull();
        });

        it('returns null for undefined input', () => {
            expect(embedAgentName(undefined)).toBeNull();
        });

        it('returns name from single object', () => {
            expect(embedAgentName({ name: 'Juan Pérez' })).toBe('Juan Pérez');
        });

        it('returns name from first element of array', () => {
            expect(embedAgentName([{ name: 'Juan Pérez' }, { name: 'María García' }])).toBe('Juan Pérez');
        });

        it('returns null for empty array', () => {
            expect(embedAgentName([])).toBeNull();
        });
    });

    describe('embedAgentEmail', () => {
        it('returns null for null input', () => {
            expect(embedAgentEmail(null)).toBeNull();
        });

        it('returns email from single object', () => {
            expect(embedAgentEmail({ email: 'juan@test.com' })).toBe('juan@test.com');
        });

        it('returns email from first element of array', () => {
            expect(embedAgentEmail([{ email: 'juan@test.com' }, { email: 'maria@test.com' }])).toBe('juan@test.com');
        });

        it('returns null for null email', () => {
            expect(embedAgentEmail({ email: null })).toBeNull();
        });
    });

    describe('embedAgentPhoto', () => {
        it('returns null for null input', () => {
            expect(embedAgentPhoto(null)).toBeNull();
        });

        it('returns photo_url from single object', () => {
            expect(embedAgentPhoto({ photo_url: 'https://img.com/photo.jpg' })).toBe('https://img.com/photo.jpg');
        });

        it('returns null for null photo_url', () => {
            expect(embedAgentPhoto({ photo_url: null })).toBeNull();
        });
    });

    describe('embedAgentIsAi', () => {
        it('returns false for null input', () => {
            expect(embedAgentIsAi(null)).toBe(false);
        });

        it('returns is_ai from single object', () => {
            expect(embedAgentIsAi({ is_ai: true })).toBe(true);
            expect(embedAgentIsAi({ is_ai: false })).toBe(false);
        });

        it('returns is_ai from first element of array', () => {
            expect(embedAgentIsAi([{ is_ai: true }, { is_ai: false }])).toBe(true);
        });
    });
});

describe('Chat mappers', () => {
    const baseChannel = {
        id: 'channel-1',
        type: 'direct' as const,
        name: null,
        property_id: null,
        lead_id: null,
        created_by: 'agent-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        participants: [
            {
                id: 'part-1',
                channel_id: 'channel-1',
                agent_id: 'agent-1',
                joined_at: '2024-01-01T00:00:00Z',
                last_read_at: '2024-01-01T00:00:00Z',
                notifications_enabled: true,
                agent: [{ name: 'Juan Pérez', email: 'juan@test.com', photo_url: 'https://img.com/juan.jpg', is_ai: false }],
            },
        ],
        last_message: [
            {
                id: 'msg-1',
                channel_id: 'channel-1',
                sender_id: 'agent-1',
                content: 'Hola',
                message_type: 'text',
                file_url: null,
                file_name: null,
                file_size: null,
                reply_to_id: null,
                edited_at: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                deleted_at: null,
                sender: [{ name: 'Juan Pérez', photo_url: 'https://img.com/juan.jpg' }],
                reply_to: null,
                reads: [],
            },
        ],
    };

    describe('toChannelRow', () => {
        it('maps channel with participants and last message', () => {
            const result = toChannelRow(baseChannel);
            expect(result.id).toBe('channel-1');
            expect(result.type).toBe('direct');
            expect(result.participants).toHaveLength(1);
            expect(result.participants[0].agent_name).toBe('Juan Pérez');
            expect(result.participants[0].agent_email).toBe('juan@test.com');
            expect(result.participants[0].agent_photo_url).toBe('https://img.com/juan.jpg');
            expect(result.participants[0].is_ai).toBe(false);
            expect(result.last_message).not.toBeNull();
            expect(result.last_message?.content).toBe('Hola');
            expect(result.unread_count).toBe(0);
        });

        it('handles channel without participants', () => {
            const result = toChannelRow({ ...baseChannel, participants: null });
            expect(result.participants).toEqual([]);
        });

        it('handles channel without last message', () => {
            const result = toChannelRow({ ...baseChannel, last_message: [] });
            expect(result.last_message).toBeNull();
        });

        it('maps AI participant correctly', () => {
            const result = toChannelRow({
                ...baseChannel,
                participants: [
                    {
                        ...baseChannel.participants![0],
                        agent: [{ name: 'Asistente IA', email: null, photo_url: null, is_ai: true }],
                    },
                ],
            });
            expect(result.participants[0].is_ai).toBe(true);
            expect(result.participants[0].agent_name).toBe('Asistente IA');
        });
    });

    describe('toMessageRow', () => {
        const baseMessage = {
            id: 'msg-1',
            channel_id: 'channel-1',
            sender_id: 'agent-1',
            content: 'Hola mundo',
            message_type: 'text' as const,
            file_url: null,
            file_name: null,
            file_size: null,
            reply_to_id: null,
            edited_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            deleted_at: null,
            sender: [{ name: 'Juan Pérez', photo_url: 'https://img.com/juan.jpg' }],
            reply_to: null,
            reads: [],
        };

        it('maps message with sender', () => {
            const result = toMessageRow(baseMessage);
            expect(result.id).toBe('msg-1');
            expect(result.content).toBe('Hola mundo');
            expect(result.message_type).toBe('text');
            expect(result.sender_name).toBe('Juan Pérez');
            expect(result.sender_photo_url).toBe('https://img.com/juan.jpg');
            expect(result.reply_to).toBeNull();
            expect(result.read_by).toEqual([]);
        });

        it('maps reply_to message', () => {
            const result = toMessageRow({
                ...baseMessage,
                reply_to: [
                    {
                        ...baseMessage,
                        id: 'msg-0',
                        content: 'Mensaje anterior',
                        reply_to: null,
                        sender: [{ name: 'María García', photo_url: 'https://img.com/maria.jpg' }],
                    },
                ],
            });
            expect(result.reply_to).not.toBeNull();
            expect(result.reply_to?.id).toBe('msg-0');
            expect(result.reply_to?.content).toBe('Mensaje anterior');
            expect(result.reply_to?.sender_name).toBe('María García');
        });

        it('maps read_by agents', () => {
            const result = toMessageRow({
                ...baseMessage,
                reads: [
                    {
                        id: 'read-1',
                        message_id: 'msg-1',
                        agent_id: 'agent-2',
                        read_at: '2024-01-01T00:01:00Z',
                        agent: [{ name: 'María García' }],
                    },
                ],
            });
            expect(result.read_by).toHaveLength(1);
            expect(result.read_by[0].agent_name).toBe('María García');
        });

        it('handles file message type', () => {
            const result = toMessageRow({
                ...baseMessage,
                message_type: 'file',
                file_url: 'https://files.com/doc.pdf',
                file_name: 'documento.pdf',
                file_size: 1024,
            });
            expect(result.message_type).toBe('file');
            expect(result.file_url).toBe('https://files.com/doc.pdf');
            expect(result.file_name).toBe('documento.pdf');
            expect(result.file_size).toBe(1024);
        });
    });
});