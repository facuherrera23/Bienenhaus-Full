import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../supabase';
import { from } from '../../test/setup';
import {
    addParticipant,
    CHANNEL_TYPE_LABEL,
    createDirectChannel,
    createGroupChannel,
    createLeadChannel,
    createPropertyChannel,
    editMessage,
    fetchChannel,
    fetchChannels,
    fetchMessage,
    fetchMessages,
    markAsRead,
    markChannelAsRead,
    MESSAGE_TYPE_LABEL,
    removeParticipant,
    sendMessage,
    softDeleteMessage,
    subscribeToChannelMessages,
    updateLastRead,
} from '../chat';
import type { ChatChannel, ChatMessage } from '../chat';

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function mockFrom(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const chain = buildChain(overrides);
    (from as unknown as Mock).mockReturnValue(chain);
    return chain;
}

// ============================================================
// Fixtures
// ============================================================

function makeMessageRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'm1',
        channel_id: 'c1',
        sender_id: 'a1',
        content: 'Hola',
        message_type: 'text',
        file_url: null,
        file_name: null,
        file_size: null,
        reply_to_id: null,
        edited_at: null,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
        deleted_at: null,
        sender: { name: 'Ana', photo_url: 'photo1' },
        reply_to: null,
        reads: [
            {
                id: 'r1',
                message_id: 'm1',
                agent_id: 'a2',
                read_at: '2026-01-01T11:00:00.000Z',
                agent: { name: 'Pedro' },
            },
        ],
        ...overrides,
    };
}

const replyRow = makeMessageRow({ id: 'm0', content: 'Mensaje original' });

const messageWithReply = makeMessageRow({
    id: 'm2',
    content: 'Respuesta',
    reply_to_id: 'm0',
    reply_to: replyRow,
});

function makeChannelRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'c1',
        type: 'direct',
        name: null,
        property_id: null,
        lead_id: null,
        created_by: 'a1',
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
        deleted_at: null,
        participants: [
            {
                id: 'p1',
                channel_id: 'c1',
                agent_id: 'a1',
                joined_at: '2026-01-01T10:00:00.000Z',
                last_read_at: null,
                notifications_enabled: true,
                agent: { name: 'Ana', email: 'ana@x.com', photo_url: 'photo1' },
            },
        ],
        last_message: [makeMessageRow()],
        ...overrides,
    };
}

// ============================================================
// Constantes
// ============================================================

describe('constantes de chat', () => {
    it('MESSAGE_TYPE_LABEL traduce todos los tipos de mensaje', () => {
        expect(MESSAGE_TYPE_LABEL).toEqual({
            text: 'Texto',
            system: 'Sistema',
            file: 'Archivo',
            image: 'Imagen',
        });
    });

    it('CHANNEL_TYPE_LABEL traduce todos los tipos de canal', () => {
        expect(CHANNEL_TYPE_LABEL).toEqual({
            direct: 'Directo',
            group: 'Grupo',
            property: 'Propiedad',
            lead: 'Lead',
        });
    });
});

// ============================================================
// Canales
// ============================================================

describe('fetchChannels', () => {
    it('devuelve los canales del agente con participantes y last_message', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [makeChannelRow()], error: null }),
        });
        const rows = await fetchChannels('a1');
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('c1');
        expect(rows[0].type).toBe('direct');
        expect(rows[0].unread_count).toBe(0);
        expect(rows[0].participants[0].agent_name).toBe('Ana');
        expect(rows[0].participants[0].agent_email).toBe('ana@x.com');
        expect(rows[0].participants[0].agent_photo_url).toBe('photo1');
        expect(rows[0].last_message?.sender_name).toBe('Ana');
        expect(chain.select).toHaveBeenCalledWith(
            expect.stringContaining('last_message:chat_messages!chat_messages_channel_id_fkey'),
        );
        expect(chain.eq).toHaveBeenCalledWith('chat_channel_participants.agent_id', 'a1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('updated_at', {
            ascending: false,
            foreignTable: 'last_message',
        });
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'ch err' } }),
        });
        await expect(fetchChannels('a1')).rejects.toThrow('ch err');
    });

    it('devuelve un arreglo vacío si no hay canales', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchChannels('a1')).resolves.toEqual([]);
    });
});

describe('fetchChannel', () => {
    it('devuelve el canal por id', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: makeChannelRow(), error: null }),
        });
        const row = await fetchChannel('c1');
        expect(row.id).toBe('c1');
        expect(row.participants).toHaveLength(1);
        expect(chain.select).toHaveBeenCalledWith(
            expect.stringContaining('participants:chat_channel_participants!inner'),
        );
        expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'ch2 err' } }),
        });
        await expect(fetchChannel('c1')).rejects.toThrow('ch2 err');
    });

    it('lanza error si el canal no existe', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(fetchChannel('c1')).rejects.toThrow('Canal no encontrado');
    });
});

describe('createDirectChannel', () => {
    const existingMatch = {
        id: 'c1',
        type: 'direct',
        participants: [{ agent_id: 'a1' }, { agent_id: 'a2' }],
    };
    const existingNoMatch = {
        id: 'c9',
        type: 'direct',
        participants: [{ agent_id: 'a3' }, { agent_id: 'a4' }],
    };

    it('reutiliza un canal directo existente entre los mismos agentes', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [existingMatch], error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: makeChannelRow(), error: null }),
        });
        const result = await createDirectChannel(['a1', 'a2'], 'a1');
        expect(result.id).toBe('c1');
        expect(chain.insert).not.toHaveBeenCalled();
        expect(chain.select).toHaveBeenCalledWith(
            expect.stringContaining('participants:chat_channel_participants!inner(agent_id)'),
        );
        expect(chain.eq).toHaveBeenCalledWith('type', 'direct');
        expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
    });

    it('crea un canal nuevo si los participantes no coinciden', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [existingNoMatch], error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c2' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: makeChannelRow(), error: null }),
        });
        const result = await createDirectChannel(['a1', 'a2'], 'a1');
        expect(result.id).toBe('c1');
        expect(chain.insert).toHaveBeenCalledWith({ type: 'direct', created_by: 'a1' });
        expect(chain.insert).toHaveBeenCalledWith([
            { channel_id: 'c2', agent_id: 'a1' },
            { channel_id: 'c2', agent_id: 'a2' },
        ]);
    });

    it('crea un canal nuevo si no existe ninguno previo', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c2' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: makeChannelRow(), error: null }),
        });
        await createDirectChannel(['a1', 'a2'], 'a1');
        expect(chain.insert).toHaveBeenCalledWith({ type: 'direct', created_by: 'a1' });
    });

    it('lanza error si falla la creación del canal', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'ins err' } }),
        });
        await expect(createDirectChannel(['a1', 'a2'], 'a1')).rejects.toThrow('ins err');
    });

    it('lanza error si falla la inserción de participantes', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c2' }, error: null }),
            insert: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockImplementationOnce(() => ({ error: { message: 'part err' } })),
        });
        await expect(createDirectChannel(['a1', 'a2'], 'a1')).rejects.toThrow('part err');
    });
});

describe('createGroupChannel', () => {
    it('crea un canal grupal y agrega los participantes', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'c3' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: makeChannelRow(), error: null }),
        });
        const result = await createGroupChannel('Equipo Ventas', ['a1', 'a2'], 'a1');
        expect(result.id).toBe('c1');
        expect(chain.insert).toHaveBeenCalledWith({
            type: 'group',
            name: 'Equipo Ventas',
            created_by: 'a1',
        });
        expect(chain.insert).toHaveBeenCalledWith([
            { channel_id: 'c3', agent_id: 'a1' },
            { channel_id: 'c3', agent_id: 'a2' },
        ]);
    });

    it('lanza error si falla la creación del canal', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'grp err' } }),
        });
        await expect(createGroupChannel('Equipo', ['a1'], 'a1')).rejects.toThrow('grp err');
    });

    it('lanza error si falla la inserción de participantes', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'c3' }, error: null }),
            insert: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockImplementationOnce(() => ({ error: { message: 'part err' } })),
        });
        await expect(createGroupChannel('Equipo', ['a1'], 'a1')).rejects.toThrow('part err');
    });
});

describe('createPropertyChannel', () => {
    it('usa el título de la propiedad como nombre del canal', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockImplementationOnce(() => ({ data: { title: 'Depto Centro' }, error: null }))
                .mockResolvedValue({ data: makeChannelRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c4' }, error: null }),
        });
        const result = await createPropertyChannel('p1', ['a1'], 'a1');
        expect(result.id).toBe('c1');
        expect(chain.insert).toHaveBeenCalledWith({
            type: 'property',
            name: 'Depto Centro',
            property_id: 'p1',
            created_by: 'a1',
        });
    });

    it('usa un nombre genérico si la propiedad no existe', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockImplementationOnce(() => ({ data: null, error: null }))
                .mockResolvedValue({ data: makeChannelRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c4' }, error: null }),
        });
        await createPropertyChannel('p1', ['a1'], 'a1');
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'property', name: 'Propiedad', property_id: 'p1' }),
        );
    });

    it('lanza error si falla la creación del canal', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'prop err' } }),
        });
        await expect(createPropertyChannel('p1', ['a1'], 'a1')).rejects.toThrow('prop err');
    });
});

describe('createLeadChannel', () => {
    it('arma el nombre con nombre y apellido del lead', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockImplementationOnce(() => ({ data: { name: 'Juan', last_name: 'Pérez' }, error: null }))
                .mockResolvedValue({ data: makeChannelRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c5' }, error: null }),
        });
        const result = await createLeadChannel('l1', ['a1'], 'a1');
        expect(result.id).toBe('c1');
        expect(chain.insert).toHaveBeenCalledWith({
            type: 'lead',
            name: 'Juan Pérez',
            lead_id: 'l1',
            created_by: 'a1',
        });
    });

    it('usa un nombre genérico si el lead no existe', async () => {
        const chain = mockFrom({
            maybeSingle: vi
                .fn()
                .mockImplementationOnce(() => ({ data: null, error: null }))
                .mockResolvedValue({ data: makeChannelRow(), error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'c5' }, error: null }),
        });
        await createLeadChannel('l1', ['a1'], 'a1');
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'lead', name: 'Lead', lead_id: 'l1' }),
        );
    });

    it('lanza error si falla la creación del canal', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'lead err' } }),
        });
        await expect(createLeadChannel('l1', ['a1'], 'a1')).rejects.toThrow('lead err');
    });
});

describe('addParticipant', () => {
    it('agrega un participante al canal', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await addParticipant('c1', 'a2');
        expect(chain.insert).toHaveBeenCalledWith({ channel_id: 'c1', agent_id: 'a2' });
        expect(chain.select).toHaveBeenCalledWith();
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'add err' } }),
        });
        await expect(addParticipant('c1', 'a2')).rejects.toThrow('add err');
    });
});

describe('removeParticipant', () => {
    it('elimina un participante del canal', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: null }),
        });
        await removeParticipant('c1', 'a2');
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('channel_id', 'c1');
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a2');
    });

    it('lanza error si el delete falla', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: { message: 'rm err' } }),
        });
        await expect(removeParticipant('c1', 'a2')).rejects.toThrow('rm err');
    });
});

// ============================================================
// Mensajes
// ============================================================

describe('fetchMessages', () => {
    const older = makeMessageRow({ id: 'm-a', created_at: '2026-01-01T10:00:00.000Z' });
    const newer = makeMessageRow({ id: 'm-b', created_at: '2026-01-02T10:00:00.000Z' });

    it('devuelve los mensajes en orden cronológico ascendente', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [newer, older], error: null }),
        });
        const rows = await fetchMessages('c1');
        expect(rows.map((m) => m.id)).toEqual(['m-a', 'm-b']);
        expect(rows[0].sender_name).toBe('Ana');
        expect(chain.select).toHaveBeenCalledWith(
            expect.stringContaining('reply_to:chat_messages!chat_messages_reply_to_id_fkey'),
        );
        expect(chain.eq).toHaveBeenCalledWith('channel_id', 'c1');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.limit).toHaveBeenCalledWith(50);
        expect(chain.lt).not.toHaveBeenCalled();
    });

    it('paginación hacia atrás con before', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [older], error: null }),
        });
        const rows = await fetchMessages('c1', 20, '2026-01-02T00:00:00.000Z');
        expect(rows).toHaveLength(1);
        expect(chain.limit).toHaveBeenCalledWith(20);
        expect(chain.lt).toHaveBeenCalledWith('created_at', '2026-01-02T00:00:00.000Z');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'msg err' } }),
        });
        await expect(fetchMessages('c1')).rejects.toThrow('msg err');
    });

    it('devuelve un arreglo vacío si no hay mensajes', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchMessages('c1')).resolves.toEqual([]);
    });
});

describe('fetchMessage', () => {
    it('devuelve un mensaje con reply_to y lecturas mapeadas', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: messageWithReply, error: null }),
        });
        const msg: ChatMessage = await fetchMessage('m2');
        expect(msg.id).toBe('m2');
        expect(msg.sender_name).toBe('Ana');
        expect(msg.sender_photo_url).toBe('photo1');
        expect(msg.reply_to?.id).toBe('m0');
        expect(msg.reply_to?.content).toBe('Mensaje original');
        expect(msg.reply_to?.sender_name).toBe('Ana');
        expect(msg.reply_to?.reply_to).toBeNull();
        expect(msg.read_by[0].agent_name).toBe('Pedro');
        expect(chain.select).toHaveBeenCalledWith(
            expect.stringContaining('reply_to:chat_messages!chat_messages_reply_to_id_fkey'),
        );
        expect(chain.eq).toHaveBeenCalledWith('id', 'm2');
        expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('lanza error si el mensaje no existe', async () => {
        mockFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(fetchMessage('m9')).rejects.toThrow('Mensaje no encontrado');
    });

    it('lanza error si la consulta falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'fm err' } }),
        });
        await expect(fetchMessage('m9')).rejects.toThrow('fm err');
    });
});

describe('sendMessage', () => {
    it('envía un mensaje de texto con los valores por defecto', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: makeMessageRow(), error: null }),
        });
        const msg = await sendMessage('c1', 'a1', 'Hola');
        expect(msg.content).toBe('Hola');
        expect(msg.message_type).toBe('text');
        expect(chain.insert).toHaveBeenCalledWith({
            channel_id: 'c1',
            sender_id: 'a1',
            content: 'Hola',
            message_type: 'text',
            file_url: null,
            file_name: null,
            file_size: null,
            reply_to_id: null,
        });
    });

    it('envía un mensaje con archivo y reply', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: makeMessageRow(), error: null }),
        });
        await sendMessage('c1', 'a1', '', {
            message_type: 'file',
            file_url: 'https://x.com/f.pdf',
            file_name: 'f.pdf',
            file_size: 1024,
            reply_to_id: 'm0',
        });
        expect(chain.insert).toHaveBeenCalledWith({
            channel_id: 'c1',
            sender_id: 'a1',
            content: '',
            message_type: 'file',
            file_url: 'https://x.com/f.pdf',
            file_name: 'f.pdf',
            file_size: 1024,
            reply_to_id: 'm0',
        });
    });

    it('lanza error si el insert falla', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'send err' } }),
        });
        await expect(sendMessage('c1', 'a1', 'Hola')).rejects.toThrow('send err');
    });
});

// ============================================================
// Timestamps automáticos
// ============================================================

describe('timestamps automáticos', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('editMessage actualiza el contenido y edited_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await editMessage('m1', 'Nuevo contenido');
        expect(chain.update).toHaveBeenCalledWith({
            content: 'Nuevo contenido',
            edited_at: '2026-01-15T10:00:00.000Z',
        });
        expect(chain.eq).toHaveBeenCalledWith('id', 'm1');
    });

    it('editMessage lanza error si falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'ed err' } }) });
        await expect(editMessage('m1', 'X')).rejects.toThrow('ed err');
    });

    it('softDeleteMessage marca deleted_at y reemplaza el contenido', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await softDeleteMessage('m1');
        expect(chain.update).toHaveBeenCalledWith({
            deleted_at: '2026-01-15T10:00:00.000Z',
            content: '[Mensaje eliminado]',
        });
        expect(chain.eq).toHaveBeenCalledWith('id', 'm1');
    });

    it('softDeleteMessage lanza error si falla', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'del err' } }) });
        await expect(softDeleteMessage('m1')).rejects.toThrow('del err');
    });

    it('markAsRead inserta la lectura con read_at', async () => {
        const chain = mockFrom({ upsert: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await markAsRead('m1', 'a1');
        expect(chain.upsert).toHaveBeenCalledWith({
            message_id: 'm1',
            agent_id: 'a1',
            read_at: '2026-01-15T10:00:00.000Z',
        });
    });

    it('markAsRead lanza error si falla', async () => {
        mockFrom({
            upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'read err' } }),
        });
        await expect(markAsRead('m1', 'a1')).rejects.toThrow('read err');
    });

    it('markChannelAsRead marca los no leídos y actualiza last_read_at', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => ({ data: [{ message_id: 'm1' }], error: null }))
                .mockImplementationOnce(() => chain)
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: null }),
            not: vi.fn().mockResolvedValue({
                data: [{ id: 'm9' }, { id: 'm10' }],
                error: null,
            }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await markChannelAsRead('c1', 'a1');
        expect(chain.not).toHaveBeenCalledWith('id', 'in', '(m1)');
        expect(chain.upsert).toHaveBeenCalledWith([
            { message_id: 'm9', agent_id: 'a1', read_at: '2026-01-15T10:00:00.000Z' },
            { message_id: 'm10', agent_id: 'a1', read_at: '2026-01-15T10:00:00.000Z' },
        ]);
        expect(chain.update).toHaveBeenCalledWith({ last_read_at: '2026-01-15T10:00:00.000Z' });
        expect(chain.eq).toHaveBeenCalledWith('channel_id', 'c1');
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a1');
    });

    it('markChannelAsRead no inserta reads si no hay mensajes no leídos', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => ({ data: [{ message_id: 'm1' }], error: null }))
                .mockImplementationOnce(() => chain)
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: null }),
            not: vi.fn().mockResolvedValue({ data: [], error: null }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await markChannelAsRead('c1', 'a1');
        expect(chain.upsert).not.toHaveBeenCalled();
        expect(chain.update).toHaveBeenCalledWith({ last_read_at: '2026-01-15T10:00:00.000Z' });
    });

    it('markChannelAsRead no filtra por not si no hay lecturas previas', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => ({ data: null, error: null }))
                .mockImplementationOnce(() => chain)
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: null }),
            is: vi.fn().mockResolvedValue({ data: [{ id: 'm9' }], error: null }),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await markChannelAsRead('c1', 'a1');
        expect(chain.not).not.toHaveBeenCalled();
        expect(chain.upsert).toHaveBeenCalledWith([
            { message_id: 'm9', agent_id: 'a1', read_at: '2026-01-15T10:00:00.000Z' },
        ]);
    });
});

describe('updateLastRead', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('actualiza last_read_at del participante', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: null }),
        });
        await updateLastRead('c1', 'a1');
        expect(chain.update).toHaveBeenCalledWith({ last_read_at: '2026-01-15T10:00:00.000Z' });
        expect(chain.eq).toHaveBeenCalledWith('channel_id', 'c1');
        expect(chain.eq).toHaveBeenCalledWith('agent_id', 'a1');
    });

    it('lanza error si falla', async () => {
        let chain: Record<string, unknown>;
        chain = mockFrom({
            eq: vi
                .fn()
                .mockImplementationOnce(() => chain)
                .mockResolvedValue({ data: null, error: { message: 'lr err' } }),
        });
        await expect(updateLastRead('c1', 'a1')).rejects.toThrow('lr err');
    });
});

// ============================================================
// Realtime
// ============================================================

describe('subscribeToChannelMessages', () => {
    let handlers: Record<string, (payload: unknown) => void>;
    let channelMock: { on: Mock; subscribe: Mock; unsubscribe: Mock };

    beforeEach(() => {
        handlers = {};
        const ch: { on: Mock; subscribe: Mock; unsubscribe: Mock } = {
            on: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        };
        ch.on = vi.fn((evt: string, cfg: { event: string }, cb: (payload: unknown) => void) => {
            handlers[cfg.event] = cb;
            return ch;
        });
        // El cliente real devuelve el canal desde subscribe()
        ch.subscribe = vi.fn(() => ch);
        channelMock = ch;
        (supabase.channel as unknown as Mock).mockImplementation(() => ch);
    });

    it('se suscribe al canal con el filtro correcto', () => {
        subscribeToChannelMessages('c1', vi.fn(), vi.fn(), vi.fn());
        expect(supabase.channel).toHaveBeenCalledWith('chat:c1');
        expect(channelMock.subscribe).toHaveBeenCalled();
        expect(channelMock.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({ event: 'INSERT', table: 'chat_messages', filter: 'channel_id=eq.c1' }),
            expect.any(Function),
        );
    });

    it('llama onMessage cuando llega un INSERT', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: makeMessageRow(), error: null }),
        });
        const onMessage = vi.fn();
        subscribeToChannelMessages('c1', onMessage, vi.fn(), vi.fn());
        handlers.INSERT({ new: { id: 'm1' } });
        await vi.waitFor(() => expect(onMessage).toHaveBeenCalled());
        expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1', sender_name: 'Ana' }));
        expect(chain.eq).toHaveBeenCalledWith('id', 'm1');
    });

    it('llama onUpdate cuando llega un UPDATE', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: makeMessageRow(), error: null }),
        });
        const onUpdate = vi.fn();
        subscribeToChannelMessages('c1', vi.fn(), onUpdate, vi.fn());
        handlers.UPDATE({ new: { id: 'm1' } });
        await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
    });

    it('llama onDelete con el id cuando llega un DELETE', () => {
        const onDelete = vi.fn();
        subscribeToChannelMessages('c1', vi.fn(), vi.fn(), onDelete);
        handlers.DELETE({ old: { id: 'm1' } });
        expect(onDelete).toHaveBeenCalledWith('m1');
    });

    it('devuelve una función de limpieza que remueve el canal', () => {
        const unsubscribe = subscribeToChannelMessages('c1', vi.fn(), vi.fn(), vi.fn());
        unsubscribe();
        expect(supabase.removeChannel).toHaveBeenCalledWith(channelMock);
    });

    it('no llama onMessage si fetchMessage falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'fetch err' } }),
        });
        const onMessage = vi.fn();
        subscribeToChannelMessages('c1', onMessage, vi.fn(), vi.fn());
        handlers.INSERT({ new: { id: 'm1' } });
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(onMessage).not.toHaveBeenCalled();
    });

    it('no llama onUpdate si fetchMessage falla', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'fetch err' } }),
        });
        const onUpdate = vi.fn();
        subscribeToChannelMessages('c1', vi.fn(), onUpdate, vi.fn());
        handlers.UPDATE({ new: { id: 'm1' } });
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(onUpdate).not.toHaveBeenCalled();
    });
});

// ============================================================
// Mappers privados (cubiertos vía API pública)
// ============================================================

describe('mapeo de canales', () => {
    it('desnormaliza participantes y last_message desde fetchChannels', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [makeChannelRow()], error: null }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        const row = rows[0];
        expect(row.participants[0]).toEqual(
            expect.objectContaining({
                id: 'p1',
                channel_id: 'c1',
                agent_id: 'a1',
                notifications_enabled: true,
                agent_name: 'Ana',
                agent_email: 'ana@x.com',
                agent_photo_url: 'photo1',
            }),
        );
        expect(row.last_message).toEqual(
            expect.objectContaining({ id: 'm1', content: 'Hola', sender_name: 'Ana' }),
        );
    });

    it('maneja last_message vacío como null', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [makeChannelRow({ last_message: [] })],
                error: null,
            }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        expect(rows[0].last_message).toBeNull();
    });

    it('maneja participantes sin embed como arreglo vacío', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [makeChannelRow({ participants: null })],
                error: null,
            }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        expect(rows[0].participants).toEqual([]);
    });
});

// ============================================================
// Mappers - casos límite (nulls, arrays, fallbacks)
// ============================================================

describe('mappers - casos límite', () => {
    it('trata agent nulo como null en los embeds', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    makeChannelRow({
                        participants: [
                            {
                                id: 'p1',
                                channel_id: 'c1',
                                agent_id: 'a1',
                                joined_at: '2026-01-01T10:00:00.000Z',
                                last_read_at: null,
                                notifications_enabled: true,
                                agent: null,
                            },
                        ],
                    }),
                ],
                error: null,
            }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        expect(rows[0].participants[0].agent_name).toBeNull();
        expect(rows[0].participants[0].agent_email).toBeNull();
        expect(rows[0].participants[0].agent_photo_url).toBeNull();
    });

    it('acepta embeds de agente como array', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    makeChannelRow({
                        participants: [
                            {
                                id: 'p1',
                                channel_id: 'c1',
                                agent_id: 'a1',
                                joined_at: '2026-01-01T10:00:00.000Z',
                                last_read_at: null,
                                notifications_enabled: true,
                                agent: [{ name: 'Ana', email: 'ana@x.com', photo_url: 'photo1' }],
                            },
                        ],
                        last_message: [
                            makeMessageRow({ sender: [{ name: 'Ana', photo_url: 'photo1' }] }),
                        ],
                    }),
                ],
                error: null,
            }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        expect(rows[0].participants[0].agent_name).toBe('Ana');
        expect(rows[0].last_message?.sender_name).toBe('Ana');
        expect(rows[0].last_message?.sender_photo_url).toBe('photo1');
    });

    it('maneja embeds de agente vacíos y fallbacks como null', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    makeChannelRow({
                        participants: [
                            {
                                id: 'p1',
                                channel_id: 'c1',
                                agent_id: 'a1',
                                joined_at: '2026-01-01T10:00:00.000Z',
                                last_read_at: null,
                                notifications_enabled: null,
                                agent: [],
                            },
                        ],
                        last_message: [makeMessageRow({ sender: [], reads: null })],
                    }),
                ],
                error: null,
            }),
        });
        const rows: ChatChannel[] = await fetchChannels('a1');
        expect(rows[0].participants[0].agent_name).toBeNull();
        expect(rows[0].participants[0].notifications_enabled).toBe(false);
        expect(rows[0].last_message?.sender_name).toBeNull();
        expect(rows[0].last_message?.read_by).toEqual([]);
    });

    it('devuelve [] si fetchChannels devuelve data null', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(fetchChannels('a1')).resolves.toEqual([]);
    });

    it('devuelve [] si fetchMessages devuelve data null', async () => {
        mockFrom({ returns: vi.fn().mockResolvedValue({ data: null, error: null }) });
        await expect(fetchMessages('c1')).resolves.toEqual([]);
    });

    it('mapea un mensaje con reads null a read_by vacío', async () => {
        mockFrom({
            maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: makeMessageRow({ reads: null }), error: null }),
        });
        const msg: ChatMessage = await fetchMessage('m1');
        expect(msg.read_by).toEqual([]);
    });
});
