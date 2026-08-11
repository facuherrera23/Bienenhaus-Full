import sharp from 'npm:sharp@0.33';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const SIGNED_URL_TTL = 60 * 60; // 1 hour
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

const MESSAGE_SELECT = `
    id,
    channel_id,
    sender_id,
    content,
    message_type,
    file_url,
    file_name,
    file_size,
    created_at,
    updated_at
`;

const json = (
    req: Request,
    status: number,
    body: Record<string, unknown>,
): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(req),
        },
    });

function corsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('Origin');

    // Keep the function usable from the admin app without allowing arbitrary
    // origins. Configure additional origins through CORS_ALLOWED_ORIGINS.
    const configuredOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    const allowedOrigins = new Set([
        'https://bienenhaus.com.ar',
        'https://www.bienenhaus.com.ar',
        ...configuredOrigins,
    ]);

    return {
        'Access-Control-Allow-Origin':
            origin && allowedOrigins.has(origin)
                ? origin
                : 'https://bienenhaus.com.ar',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
    };
}

function getBearerToken(req: Request): string | null {
    const header = req.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) return null;

    const token = header.slice('Bearer '.length).trim();
    return token || null;
}

function safeFileName(name: string): string {
    const normalized = name
        .normalize('NFKC')
        .replace(/[/\\]/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .slice(0, 180);

    return normalized || 'attachment';
}

function getFileExtension(type: string): string {
    switch (type) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'image/gif':
            return '.gif';
        case 'application/pdf':
            return '.pdf';
        default:
            return '';
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(req),
        });
    }

    if (req.method !== 'POST') {
        return json(req, 405, { error: 'Method not allowed' });
    }

    try {
        const token = getBearerToken(req);
        if (!token) {
            return json(req, 401, { error: 'Missing authorization token' });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[chat-upload] Supabase service configuration is missing');
            return json(req, 500, { error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        // The Edge Function platform verifies the JWT by default, but we also
        // resolve it here so the service-role client cannot be abused with an
        // arbitrary sender/channel supplied by the caller.
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return json(req, 401, { error: 'Invalid authorization token' });
        }

        const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('id, email, is_active')
            .eq('id', user.id)
            .maybeSingle();

        if (adminError || !adminUser?.is_active) {
            return json(req, 403, { error: 'Staff access required' });
        }

        // agents.id is intentionally independent from auth.users.id in this
        // schema, so resolve the caller's agent record by its unique email.
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('id, email, is_active')
            .eq('email', adminUser.email)
            .maybeSingle();

        if (agentError || !agent?.is_active) {
            return json(req, 403, { error: 'Active agent profile required' });
        }

        const formData = await req.formData();
        const fileValue = formData.get('file');
        const channelId = String(formData.get('channelId') ?? '');

        if (!(fileValue instanceof File)) {
            return json(req, 400, { error: 'No file provided' });
        }

        if (!channelId) {
            return json(req, 400, { error: 'channelId is required' });
        }

        if (!ALLOWED_TYPES.has(fileValue.type)) {
            return json(req, 400, {
                error: `Tipo no permitido: ${fileValue.type || 'desconocido'}`,
            });
        }

        if (fileValue.size <= 0 || fileValue.size > MAX_SIZE) {
            return json(req, 400, {
                error: `El archivo debe pesar entre 1 byte y ${MAX_SIZE / 1024 / 1024} MB`,
            });
        }

        // Do not trust a client-provided senderId. The authenticated user's
        // agent is always the sender.
        const { data: participant, error: participantError } = await supabase
            .from('chat_channel_participants')
            .select('id')
            .eq('channel_id', channelId)
            .eq('agent_id', agent.id)
            .maybeSingle();

        if (participantError) {
            console.error('[chat-upload] Participant lookup failed:', participantError);
            return json(req, 500, { error: 'Unable to validate channel access' });
        }

        if (!participant) {
            return json(req, 403, {
                error: 'You are not a participant of this channel',
            });
        }

        const buffer = new Uint8Array(await fileValue.arrayBuffer());
        const timestamp = Date.now();
        const randomId = crypto.randomUUID();
        const originalName = safeFileName(fileValue.name);
        const extension = getFileExtension(fileValue.type);

        // Keep the object path independent of the original filename to prevent
        // path traversal/collisions and to avoid exposing user input in storage.
        const path = `chat-files/${channelId}/${timestamp}-${randomId}${extension}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(path, buffer, {
                contentType: fileValue.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('[chat-upload] Storage upload failed:', uploadError);
            return json(req, 500, { error: 'Failed to upload file' });
        }

        let messageType: 'file' | 'image' = 'file';

        if (fileValue.type.startsWith('image/')) {
            // Decode the image with Sharp before accepting it. This rejects
            // many files whose MIME type was merely spoofed by the client.
            await sharp(buffer).metadata();
            messageType = 'image';
        }

        const { data: signed, error: signedError } = await supabase.storage
            .from('chat-files')
            .createSignedUrl(path, SIGNED_URL_TTL);

        if (signedError || !signed?.signedUrl) {
            await supabase.storage.from('chat-files').remove([path]);
            console.error('[chat-upload] Signed URL creation failed:', signedError);
            return json(req, 500, { error: 'Failed to create file URL' });
        }

        const { data: message, error: messageError } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: agent.id,
                content: originalName,
                message_type: messageType,
                file_url: signed.signedUrl,
                file_name: originalName,
                file_size: fileValue.size,
            })
            .select(MESSAGE_SELECT)
            .single();

        if (messageError || !message) {
            await supabase.storage.from('chat-files').remove([path]);
            console.error('[chat-upload] Message insert failed:', messageError);
            return json(req, 500, { error: 'Failed to create chat message' });
        }

        return new Response(JSON.stringify(message), {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders(req),
            },
        });
    } catch (err) {
        console.error('[chat-upload] Error:', err);
        return json(req, 500, {
            error: err instanceof Error ? err.message : 'Unexpected server error',
        });
    }
});
