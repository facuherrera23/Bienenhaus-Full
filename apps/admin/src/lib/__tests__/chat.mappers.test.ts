import { describe, expect, it } from 'vitest';
import {
    type ChannelApiRow,
    embedAgentEmail,
    embedAgentName,
    embedAgentPhoto,
    type MessageApiRow,
    toChannelRow,
    toMessageRow,
} from '../chat';

describe('chat mappers', () => {
    const baseChannelApiRow: ChannelApiRow = {
        id: 'channel-1',
        type: 'direct',
        name: null,
        property_id: null,
        lead_id: null,
        created_by: 'user-1',
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
                agent: [
                    {
                        name: 'Agente 1',
                        email: 'agente1@test.com',
                        photo_url: 'https://img.com/agent1.jpg',
                        is_ai: false,
                    },
                ],
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
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                deleted_at: null,
                sender: [{ name: 'Agente 1', photo_url: 'https://img.com/agent1.jpg' }],
                reply_to: null,
                reads: [
                    {
                        id: 'read-1',
                        message_id: 'msg-1',
                        agent_id: 'agent-2',
                        read_at: '2024-01-01T10:05:00Z',
                        agent: [{ name: 'Agente 2' }],
                    },
                ],
            },
        ],
    };

    const baseMessageEmbedded: MessageApiRow = {
        id: 'msg-1',
        channel_id: 'channel-1',
        sender_id: 'agent-1',
        content: 'Hola mundo',
        message_type: 'text',
        file_url: null,
        file_name: null,
        file_size: null,
        reply_to_id: null,
        edited_at: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        deleted_at: null,
        sender: [{ name: 'Agente 1', photo_url: 'https://img.com/agent1.jpg' }],
        reply_to: null,
        reads: [
            {
                id: 'read-1',
                message_id: 'msg-1',
                agent_id: 'agent-2',
                read_at: '2024-01-01T10:05:00Z',
                agent: [{ name: 'Agente 2' }],
            },
        ],
    };

    describe('toChannelRow', () => {
        it('maps channel with participants and last message', () => {
            const mapped = toChannelRow(baseChannelApiRow);
            expect(mapped.id).toBe('channel-1');
            expect(mapped.type).toBe('direct');
            expect(mapped.participants).toHaveLength(1);
            expect(mapped.participants[0].agent_name).toBe('Agente 1');
            expect(mapped.participants[0].agent_email).toBe('agente1@test.com');
            expect(mapped.participants[0].agent_photo_url).toBe('https://img.com/agent1.jpg');
            expect(mapped.last_message).not.toBeNull();
            expect(mapped.last_message?.content).toBe('Hola');
        });

        it('handles channel without last_message', () => {
            const row = { ...baseChannelApiRow, last_message: [] };
            const mapped = toChannelRow(row);
            expect(mapped.last_message).toBeNull();
        });

        it('handles null participants', () => {
            const row = { ...baseChannelApiRow, participants: null };
            const mapped = toChannelRow(row);
            expect(mapped.participants).toHaveLength(0);
        });
    });

    describe('toMessageRow', () => {
        it('maps message with all fields', () => {
            const mapped = toMessageRow(baseMessageEmbedded);
            expect(mapped.id).toBe('msg-1');
            expect(mapped.content).toBe('Hola mundo');
            expect(mapped.message_type).toBe('text');
            expect(mapped.sender_name).toBe('Agente 1');
            expect(mapped.sender_photo_url).toBe('https://img.com/agent1.jpg');
            expect(mapped.reply_to).toBeNull();
            expect(mapped.read_by).toHaveLength(1);
            expect(mapped.read_by[0].agent_name).toBe('Agente 2');
        });

        it('handles reply_to message', () => {
            const msgWithReply = {
                ...baseMessageEmbedded,
                reply_to: [
                    {
                        id: 'msg-reply',
                        channel_id: 'channel-1',
                        sender_id: 'agent-2',
                        content: 'Mensaje original',
                        message_type: 'text',
                        file_url: null,
                        file_name: null,
                        file_size: null,
                        reply_to_id: null,
                        edited_at: null,
                        created_at: '2024-01-01T09:00:00Z',
                        updated_at: '2024-01-01T09:00:00Z',
                        deleted_at: null,
                        sender: [{ name: 'Agente 2', photo_url: 'https://img.com/agent2.jpg' }],
                        reply_to: null,
                        reads: [],
                    },
                ],
            };
            const mapped = toMessageRow(msgWithReply);
            expect(mapped.reply_to).not.toBeNull();
            expect(mapped.reply_to?.content).toBe('Mensaje original');
        });

        it('handles message with file', () => {
            const msgWithFile = {
                ...baseMessageEmbedded,
                message_type: 'image',
                file_url: 'https://img.com/image.jpg',
                file_name: 'foto.jpg',
                file_size: 1024000,
            };
            const mapped = toMessageRow(msgWithFile);
            expect(mapped.message_type).toBe('image');
            expect(mapped.file_url).toBe('https://img.com/image.jpg');
            expect(mapped.file_name).toBe('foto.jpg');
            expect(mapped.file_size).toBe(1024000);
        });

        it('handles null sender', () => {
            const msg = { ...baseMessageEmbedded, sender: null };
            const mapped = toMessageRow(msg);
            expect(mapped.sender_name).toBeNull();
            expect(mapped.sender_photo_url).toBeNull();
        });

        it('handles null reply_to', () => {
            const mapped = toMessageRow(baseMessageEmbedded);
            expect(mapped.reply_to).toBeNull();
        });
    });

    describe('embedAgentName', () => {
        it('handles null', () => {
            expect(embedAgentName(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedAgentName({ name: 'Agente 1' })).toBe('Agente 1');
        });

        it('handles array', () => {
            expect(embedAgentName([{ name: 'Agente 1' }])).toBe('Agente 1');
        });

        it('handles empty array', () => {
            expect(embedAgentName([])).toBeNull();
        });
    });

    describe('embedAgentEmail', () => {
        it('handles null', () => {
            expect(embedAgentEmail(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedAgentEmail({ email: 'test@test.com' })).toBe('test@test.com');
        });

        it('handles array', () => {
            expect(embedAgentEmail([{ email: 'test@test.com' }])).toBe('test@test.com');
        });
    });

    describe('embedAgentPhoto', () => {
        it('handles null', () => {
            expect(embedAgentPhoto(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedAgentPhoto({ photo_url: 'https://img.com/agent.jpg' })).toBe(
                'https://img.com/agent.jpg',
            );
        });

        it('handles array', () => {
            expect(embedAgentPhoto([{ photo_url: 'https://img.com/agent.jpg' }])).toBe(
                'https://img.com/agent.jpg',
            );
        });
    });
});
