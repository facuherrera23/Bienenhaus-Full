import sharp from 'npm:sharp@0.33';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

Deno.serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const channelId = formData.get('channelId') as string;
        const senderId = formData.get('senderId') as string;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return new Response(JSON.stringify({ error: `Tipo no permitido: ${file.type}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return new Response(JSON.stringify({ error: `Archivo supera ${MAX_SIZE / 1024 / 1024} MB` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const buffer = new Uint8Array(await file.arrayBuffer());
        
        // Upload original
        const path = `chat-files/${channelId}/${Date.now()}-${file.name}`;
        await supabase.storage.from('chat-files').upload(path, buffer, { contentType: file.type });

        let thumbnailUrl = null;
        if (file.type.startsWith('image/')) {
            const thumbBuffer = await sharp(buffer)
                .resize(300, 300, { fit: 'inside' })
                .webp({ quality: 80 })
                .toBuffer();
            const thumbPath = `chat-files/${channelId}/thumb-${Date.now()}.webp`;
            await supabase.storage.from('chat-files').upload(thumbPath, thumbBuffer, { contentType: 'image/webp' });
            thumbnailUrl = supabase.storage.from('chat-files').getPublicUrl(thumbPath).data.publicUrl;
        }

        const publicUrl = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;

        // Insert message
        const { data: msg } = await supabase.from('chat_messages').insert({
            channel_id: channelId,
            sender_id: senderId,
            content: file.name,
            message_type: file.type.startsWith('image/') ? 'image' : 'file',
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            thumbnail_url: thumbnailUrl,
        }).select(MESSAGE_SELECT).single();

        return new Response(JSON.stringify(msg), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    } catch (err) {
        console.error('[chat-upload] Error:', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
});