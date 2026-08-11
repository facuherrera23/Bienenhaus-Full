import sharp from 'npm:sharp@0.33';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
        const quality = Number(formData.get('quality') ?? '85');
        const maxWidth = Number(formData.get('maxWidth') ?? '2000');

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
        
        // Convert to WebP with Sharp
        const output = await sharp(buffer)
            .resize({ width: maxWidth, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

        return new Response(output, {
            headers: {
                'Content-Type': 'image/webp',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        console.error('[convert-image] Error:', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
});