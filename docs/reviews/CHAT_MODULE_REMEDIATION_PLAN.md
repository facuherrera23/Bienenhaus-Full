# Plan de Remediación Completa — Módulo Chat Interno

**Objetivo:** Llevar el módulo Chat de **~85% funcional → 100% production-ready** con realtime robusto, file sharing, search, notifications, message threading y observabilidad.

---

## 📍 Estado Actual (Resumen)

| Área                                  | % Completo | Bloqueadores para 100%                                         |
| ------------------------------------- | ---------- | -------------------------------------------------------------- |
| Canales (Direct/Group/Property/Lead)  | 95%        | Creación OK, participantes, unread count                       |
| Mensajes (Texto/Archivo/Imagen/Reply) | 90%        | Send/edit/delete/read receipts OK                              |
| Realtime (Supabase Realtime)          | 85%        | Funciona pero sin reconnection handling, sin offline queue     |
| File Sharing                          | 75%        | Upload a Storage OK, pero sin preview generado, sin virus scan |
| Search                                | 10%        | Solo client-side filter, sin full-text search                  |
| Notifications                         | 40%        | Solo in-app badge, sin push/email, sin sonido                  |
| **Type Safety**                       | **75%**    | `any` en realtime payloads, `as ChatMessage` casts             |
| **Testing**                           | **5%**     | Cero tests, sin E2E                                            |
| **Observabilidad**                    | **30%**    | Logs básicos, sin métricas latency, delivery                   |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ Realtime Robusto

- [ ] Reconnection automática con backoff exponencial
- [ ] Offline message queue (IndexedDB) → flush al reconectar
- [ ] Presence indicators (online/offline/typing)
- [ ] Message ordering garantizado (server timestamp)

### ✅ File Sharing Completo

- [ ] Upload progresivo con progress bar
- [ ] Thumbnail generation para imágenes (Sharp Edge Function)
- [ ] Virus scan (ClamAV o similar) antes de servir
- [ ] Preview en lightbox (imágenes) / download (PDFs)
- [ ] Límite tamaño configurable (default 10MB)

### ✅ Message Threading & UX

- [ ] Reply threads visuales (indent + "X replies" expandible)
- [ ] Edit history (ver versiones previas)
- [ ] Reactions (emoji) en mensajes
- [ ] Markdown rendering (code blocks, links, bold)
- [ ] Mention @agent con autocomplete + notification

### ✅ Search & Archivo

- [ ] Full-text search (PostgreSQL tsvector + trigram)
- [ ] Filtros: canal, remitente, tipo, fecha, tiene archivo
- [ ] Export conversación (PDF/CSV)
- [ ] Archived channels (soft delete + restore)

### ✅ Notificaciones Multi-canal

- [ ] Push notifications (Web Push API + Service Worker)
- [ ] Email digest (configurable: immediate/daily/weekly)
- [ ] Sound notifications (configurables por canal)
- [ ] Do Not Disturb schedule por agente

### ✅ Type Safety (Strict)

- [ ] **Cero `any`** en `chat.ts`, `ChatPage.tsx`, realtime handlers
- [ ] **Cero casts** `as ChatMessage` — Zod schemas para realtime payloads
- [ ] Realtime payload types discriminados por event (INSERT/UPDATE/DELETE)

### ✅ Testing (Cobertura Mínima)

| Tipo        | Cobertura    | Archivos Objetivo                                                    |
| ----------- | ------------ | -------------------------------------------------------------------- |
| Unit        | **80%**      | mappers, channel creation logic, message threading, file upload      |
| Integration | **50%**      | create channel → send → realtime receive → read receipt              |
| E2E         | **3 flujos** | Direct chat + file, Group chat + mentions, Property channel + search |

### ✅ Observabilidad

- [ ] Métricas: `messages_sent`, `realtime_latency_ms`, `file_upload_duration`, `notification_delivery_rate`
- [ ] Dashboard: active channels, messages/day, unread distribution
- [ ] Alertas: realtime disconnects > 5%, file upload failures, notification queue backlog

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Fundamentos Realtime) — **~3 días**

#### 1.1 Realtime Robusto + Offline Queue

**Archivo nuevo:** `apps/admin/src/hooks/useRealtimeChannel.ts`

```typescript
import { useEffect, useRef, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase';

interface QueuedMessage {
    channelId: string;
    content: string;
    options?: SendMessageOptions;
    timestamp: number;
    retries: number;
}

export function useRealtimeChannel(channelId: string, onMessage: (msg: ChatMessage) => void) {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const offlineQueueRef = useRef<QueuedMessage[]>([]);
    const isOnlineRef = useRef(true);

    const flushQueue = useCallback(async () => {
        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];
        for (const msg of queue) {
            try {
                await sendMessage(msg.channelId, currentUserId, msg.content, msg.options);
            } catch {
                offlineQueueRef.current.push(msg); // re-queue
            }
        }
    }, []);

    useEffect(() => {
        // Online/offline detection
        const handleOnline = () => {
            isOnlineRef.current = true;
            flushQueue();
        };
        const handleOffline = () => {
            isOnlineRef.current = false;
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Realtime channel con reconnection
        const channel = supabase
            .channel(`chat:${channelId}`, {
                config: { broadcast: { self: false } },
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${channelId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        fetchMessage(payload.new.id).then(onMessage).catch(console.error);
                    }
                },
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') flushQueue();
            });

        channelRef.current = channel;

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            channel.unsubscribe();
        };
    }, [channelId]);

    const sendMessageOffline = useCallback((content: string, options?: SendMessageOptions) => {
        if (isOnlineRef.current) {
            return sendMessage(channelId, currentUserId, content, options);
        } else {
            offlineQueueRef.current.push({
                channelId,
                content,
                options,
                timestamp: Date.now(),
                retries: 0,
            });
        }
    }, []);

    return { sendMessage: sendMessageOffline, isOnline: isOnlineRef.current };
}
```

#### 1.2 Zod Schemas para Realtime Payloads

**Archivo nuevo:** `supabase/functions/_shared/chat-validation.ts`

```typescript
import { z } from 'zod';

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
        new: z.object({ id: z.string().uuid(), content: z.string(), edited_at: z.string().datetime() }),
        old: z.object({ id: z.string().uuid(), content: z.string() }),
    }),
    z.object({
        eventType: z.literal('DELETE'),
        old: z.object({ id: z.string().uuid() }),
    }),
];

// Uso en handler:
const parsed = ChatMessageRealtimeSchema.safeParse(payload);
if (!parsed.success) { console.error('Invalid realtime payload', parsed.error); return; }
```

#### 1.3 File Upload con Thumbnails + Virus Scan

**Edge Function:** `supabase/functions/chat-upload/index.ts`

```typescript
import sharp from 'npm:sharp@0.33';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

Deno.serve(async (req) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const channelId = formData.get('channelId') as string;

    if (!file) return jsonResponse(400, { error: 'No file' });
    if (file.size > MAX_SIZE) return jsonResponse(400, { error: 'Max 10MB' });
    if (!ALLOWED_TYPES.includes(file.type)) return jsonResponse(400, { error: 'Type not allowed' });

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Virus scan (placeholder - integrar ClamAV)
    // const clean = await scanVirus(file);
    // if (!clean) return jsonResponse(400, { error: 'Virus detected' });

    const path = `chat-files/${channelId}/${Date.now()}-${file.name}`;

    // Upload original
    await supabase.storage.from('chat-files').upload(path, buffer, { contentType: file.type });

    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
        const thumbBuffer = await sharp(buffer)
            .resize(300, 300, { fit: 'inside' })
            .webp({ quality: 80 })
            .toBuffer();
        const thumbPath = `chat-files/${channelId}/thumb-${Date.now()}.webp`;
        await supabase.storage
            .from('chat-files')
            .upload(thumbPath, thumbBuffer, { contentType: 'image/webp' });
        thumbnailUrl = supabase.storage.from('chat-files').getPublicUrl(thumbPath).data.publicUrl;
    }

    const publicUrl = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;

    // Insert message
    const { data: msg } = await supabase
        .from('chat_messages')
        .insert({
            channel_id: channelId,
            sender_id: userId,
            content: file.name,
            message_type: file.type.startsWith('image/') ? 'image' : 'file',
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            thumbnail_url: thumbnailUrl, // nuevo campo
        })
        .select(MESSAGE_SELECT)
        .single();

    return jsonResponse(200, toMessageRow(msg));
});
```

---

### FASE 2 — ALTO (UX Avanzada) — **~4 días**

#### 2.1 Message Threading (Reply Visual)

**En `ChatPage.tsx` — componente `MessageThread`:**

```tsx
const MessageThread = ({ message, depth = 0 }: { message: ChatMessage; depth?: number }) => {
    const [expanded, setExpanded] = useState(false);
    const replies = messages.filter((m) => m.reply_to_id === message.id);

    return (
        <div
            style={{
                marginLeft: `${depth * 24}px`,
                borderLeft: depth > 0 ? '2px solid var(--bh-border)' : 'none',
                paddingLeft: '12px',
            }}
        >
            <MessageBubble message={message} />
            {replies.length > 0 && (
                <div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="btn btn--ghost btn--sm"
                    >
                        {expanded
                            ? 'Ocultar'
                            : `Ver ${replies.length} respuesta${replies.length > 1 ? 's' : ''}`}
                    </button>
                    {expanded &&
                        replies.map((r) => (
                            <MessageThread key={r.id} message={r} depth={depth + 1} />
                        ))}
                </div>
            )}
        </div>
    );
};
```

#### 2.2 Mentions @agent + Notificaciones

**En `chat.ts` — `sendMessage`:**

```typescript
// Detectar @mentions en content
const mentionRegex = /@(\w+)/g;
const mentions = content.match(mentionRegex)?.map((m) => m.slice(1)) ?? [];

if (mentions.length) {
    // Buscar agent_ids por name
    const { data: agents } = await supabase.from('agents').select('id, name').in('name', mentions);

    // Crear notificaciones
    for (const agent of agents ?? []) {
        if (agent.id !== senderId) {
            await supabase.from('notifications').insert({
                agent_id: agent.id,
                type: 'mention',
                title: `Te mencionaron en ${channelName}`,
                content: content.slice(0, 100),
                reference_id: messageId,
                reference_type: 'chat_message',
            });
        }
    }
}
```

**UI:** Autocomplete @ al escribir (dropdown con agents del canal).

#### 2.3 Full-Text Search

**Migración:** `supabase/migrations/0046_chat_search.sql`

```sql
ALTER TABLE chat_messages ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('spanish', coalesce(content, '') || ' ' || coalesce(file_name, ''))
    ) STORED;

CREATE INDEX idx_chat_messages_search ON chat_messages USING GIN(search_vector);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_chat_messages_content_trgm ON chat_messages USING GIN(content gin_trgm_ops);
```

**Hook:** `apps/admin/src/hooks/useChatSearch.ts`

```typescript
export function useChatSearch(query: string, channelId?: string) {
    return useQuery({
        queryKey: ['chat-search', query, channelId],
        queryFn: async () => {
            let q = supabase
                .from('chat_messages')
                .select(MESSAGE_SELECT)
                .textSearch('search_vector', query, { type: 'websearch' });
            if (channelId) q = q.eq('channel_id', channelId);
            const { data } = await q.limit(50);
            return data?.map(toMessageRow) ?? [];
        },
        enabled: query.length >= 2,
    });
}
```

#### 2.4 Push Notifications (Web Push)

**Service Worker:** `apps/landing/public/sw.js` — extender

```javascript
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.content,
        icon: '/pwa-192x192.png',
        badge: '/pwa-badge.png',
        data: { url: data.url },
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'dismiss', title: 'Descartar' },
        ],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'open') {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
```

**Edge Function:** `supabase/functions/send-push/index.ts` — VAPID keys, subscription management.

---

### FASE 3 — MEDIO (Polish) — **~2 días**

#### 3.1 Testing

- Unit: mappers, channel creation logic, message threading, file upload
- Integration: realtime receive → UI update, file upload → thumbnail → message insert
- E2E: Direct chat + file, Group chat + mentions, Property channel + search

#### 3.2 Observabilidad

- Structured logs: message_id, channel_id, sender_id, latency_ms
- Metrics: realtime_latency_p95, file_upload_success_rate, push_delivery_rate
- Dashboard: messages/hour, active channels, unread distribution

---

## 📁 Archivos a Crear / Modificar

### Nuevos

- [ ] `apps/admin/src/hooks/useRealtimeChannel.ts`
- [ ] `supabase/functions/_shared/chat-validation.ts`
- [ ] `supabase/functions/chat-upload/index.ts`
- [ ] `supabase/functions/send-push/index.ts`
- [ ] `supabase/migrations/0046_chat_search.sql`
- [ ] `supabase/migrations/0047_chat_thumbnails.sql` (campo thumbnail_url)
- [ ] `apps/admin/src/lib/__tests__/chat.mappers.test.ts`
- [ ] `apps/admin/src/lib/__tests__/chat.channel.test.ts`
- [ ] `apps/admin/src/lib/__tests__/chat.threading.test.ts`
- [ ] `apps/admin/e2e/chat-flows.spec.ts`

### Modificar

- [ ] `apps/admin/src/lib/chat.ts` — mentions, threading helpers, Zod validation
- [ ] `apps/admin/src/pages/ChatPage.tsx` — useRealtimeChannel, threading UI, mentions autocomplete, search, file progress
- [ ] `apps/admin/src/components/ImageLightbox.tsx` — support thumbnail_url
- [ ] `apps/landing/public/sw.js` — push notifications handler

---

## 📊 Métricas de Éxito

| KPI                        | Baseline | Target     |
| -------------------------- | -------- | ---------- |
| Realtime latency (p95)     | ~500ms   | **<200ms** |
| File upload success rate   | ~90%     | **>99%**   |
| Push notification delivery | 0%       | **>95%**   |
| Search latency             | N/A      | **<300ms** |
| TypeScript errors          | ~12      | **0**      |
| Test coverage              | 5%       | **≥80%**   |

---

## 📅 Cronograma (1 semana)

| Día | Entregables                                               |
| --- | --------------------------------------------------------- |
| 1   | Realtime robusto + offline queue, Zod schemas realtime    |
| 2   | File upload thumbnails + virus scan, message threading UI |
| 3   | Mentions @agent, full-text search, push notifications     |
| 4   | Unit tests, integration tests, E2E 3 flujos               |
| 5   | Observabilidad, performance, code review                  |

---

## ⚠️ Riesgos

| Riesgo                                   | Mitigación                                      |
| ---------------------------------------- | ----------------------------------------------- |
| Realtime disconnects frecuentes          | Exponential backoff + offline queue persistente |
| Push notifications requieren HTTPS + PWA | Solo en producción, fallback email              |
| File upload memory en archivos grandes   | Streaming upload + chunked                      |
| Search index size growth                 | Partition por mes, limpiar deleted_at           |

---

**Documento vivo** — Actualizar conforme se completan tareas.
