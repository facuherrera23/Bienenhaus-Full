import { describe, expect, it } from 'vitest';

// Mock message data for testing threading logic
const mockMessages = [
    {
        id: 'msg-1',
        channel_id: 'ch-1',
        sender_id: 'agent-1',
        content: 'Hola',
        message_type: 'text',
        reply_to_id: null,
        created_at: '2024-01-01T10:00:00Z',
    },
    {
        id: 'msg-2',
        channel_id: 'ch-1',
        sender_id: 'agent-2',
        content: 'Hola!',
        message_type: 'text',
        reply_to_id: 'msg-1',
        created_at: '2024-01-01T10:05:00Z',
    },
    {
        id: 'msg-3',
        channel_id: 'ch-1',
        sender_id: 'agent-1',
        content: '¿Cómo estás?',
        message_type: 'text',
        reply_to_id: 'msg-2',
        created_at: '2024-01-01T10:10:00Z',
    },
    {
        id: 'msg-4',
        channel_id: 'ch-1',
        sender_id: 'agent-1',
        content: 'Otro tema',
        message_type: 'text',
        reply_to_id: null,
        created_at: '2024-01-01T11:00:00Z',
    },
];

describe('chat threading', () => {
    // Helper to build thread tree
    function buildThreadTree(messages: any[]): any[] {
        const messageMap = new Map(messages.map((m) => [m.id, { ...m, replies: [] }]));
        const roots: any[] = [];

        for (const msg of messages) {
            const node = messageMap.get(msg.id);
            if (msg.reply_to_id) {
                const parent = messageMap.get(msg.reply_to_id);
                if (parent) {
                    parent.replies.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    describe('thread tree building', () => {
        it('builds correct thread hierarchy', () => {
            const tree = buildThreadTree(mockMessages);

            expect(tree).toHaveLength(2); // msg-1 and msg-4 are roots

            const thread1 = tree[0];
            expect(thread1.id).toBe('msg-1');
            expect(thread1.replies).toHaveLength(1);

            const reply1 = thread1.replies[0];
            expect(reply1.id).toBe('msg-2');
            expect(reply1.replies).toHaveLength(1);

            const reply2 = reply1.replies[0];
            expect(reply2.id).toBe('msg-3');
            expect(reply2.replies).toHaveLength(0);

            const thread2 = tree[1];
            expect(thread2.id).toBe('msg-4');
            expect(thread2.replies).toHaveLength(0);
        });

        it('handles empty messages', () => {
            const tree = buildThreadTree([]);
            expect(tree).toHaveLength(0);
        });

        it('handles single message', () => {
            const tree = buildThreadTree([mockMessages[0]]);
            expect(tree).toHaveLength(1);
            expect(tree[0].id).toBe('msg-1');
            expect(tree[0].replies).toHaveLength(0);
        });
    });

    describe('reply depth calculation', () => {
        function getDepth(message: any, messages: any[]): number {
            let depth = 0;
            let current = message;
            while (current.reply_to_id) {
                const parent = messages.find((m) => m.id === current.reply_to_id);
                if (!parent) break;
                depth++;
                current = parent;
            }
            return depth;
        }

        it('calculates correct depth', () => {
            const messages = mockMessages;
            expect(getDepth(messages[0], messages)).toBe(0); // msg-1
            expect(getDepth(messages[1], messages)).toBe(1); // msg-2
            expect(getDepth(messages[2], messages)).toBe(2); // msg-3
            expect(getDepth(messages[3], messages)).toBe(0); // msg-4
        });
    });

    describe('reply chain traversal', () => {
        function getReplyChain(message: any, messages: any[]): any[] {
            const chain = [message];
            let current = message;
            while (current.reply_to_id) {
                const parent = messages.find((m) => m.id === current.reply_to_id);
                if (!parent) break;
                chain.unshift(parent);
                current = parent;
            }
            return chain;
        }

        it('builds correct reply chain', () => {
            const chain = getReplyChain(mockMessages[2], mockMessages); // msg-3
            expect(chain).toHaveLength(3);
            expect(chain[0].id).toBe('msg-1');
            expect(chain[1].id).toBe('msg-2');
            expect(chain[2].id).toBe('msg-3');
        });

        it('returns single message for root', () => {
            const chain = getReplyChain(mockMessages[0], mockMessages);
            expect(chain).toHaveLength(1);
            expect(chain[0].id).toBe('msg-1');
        });
    });
});
