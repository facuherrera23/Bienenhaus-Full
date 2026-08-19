// ============================================================================
// migrate-valuation-images — Edge Function temporal para migrar imágenes base64
// a Supabase Storage. Ejecutar una sola vez tras crear el bucket.
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const BATCH_SIZE = 50;
const BUCKET = "valuation-images";

interface ValuationImageRow {
    id: string;
    valuation_id: string;
    url: string;
    tipo: "fachada" | "comparable";
    orden: number;
    comparable_id: string | null;
}

async function isBase64(url: string): boolean {
    return url.startsWith("data:image/") || (url.length > 100 && !url.startsWith("http"));
}

function base64ToBlob(base64: string): { blob: Uint8Array; mimeType: string; ext: string } {
    // data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
    const matches = base64.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 format");
    const mimeType = matches[1];
    const base64Data = matches[2];
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = mimeType.split("/")[1] || "jpg";
    return { blob: bytes, mimeType, ext };
}

async function uploadToStorage(
    supabase: ReturnType<typeof createClient>,
    fileBytes: Uint8Array,
    path: string,
    mimeType: string,
): Promise<string> {
    const { error } = await supabase.storage
        .from("valuation-images")
        .upload(path, fileBytes, {
            contentType: mimeType,
            upsert: false,
        });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("valuation-images").getPublicUrl(path);
    return data.publicUrl;
}

async function processBatch(
    supabase: ReturnType<typeof createClient>,
    images: ValuationImageRow[],
): Promise<{ updated: number; errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const img of images) {
        try {
            if (!isBase64(img.url)) continue;

            const { blob, mimeType, ext } = base64ToBlob(img.url);
            const path = `${img.valuation_id}/${img.tipo}_${img.orden}_${crypto.randomUUID()}.${img.tipo === "fachada" ? "fachada" : "comp"}.${ext.split("/")[1] || "jpg"}`;

            const publicUrl = await uploadToStorage(
                supabase,
                blob,
                path,
                mimeType,
            );

            const { error } = await supabase
                .from("valuation_images")
                .update({ url: publicUrl })
                .eq("id", img.id);

            if (error) throw new Error(error.message);
            updated++;
        } catch (e) {
            errors.push(`Image ${img.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    return { updated, errors };
}

Deno.serve(async (req: Request) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verificar que sea staff
    const { data: user } = await supabase.auth.getUser(token);
    if (!user.user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { data: profile } = await supabase
        .from("admin_users")
        .select("role")
        .eq("id", user.user.id)
        .maybeSingle();

    if (!profile || !["super_admin", "admin", "staff"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Obtener todas las imágenes con base64
    const { data: images, error } = await supabase
        .from("valuation_images")
        .select("id, valuation_id, url, tipo, orden, comparable_id")
        .like("url", "data:image/%");

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!images || images.length === 0) {
        return new Response(
            JSON.stringify({ message: "No base64 images to migrate", migrated: 0 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    }

    const total = images.length;
    let totalUpdated = 0;
    const allErrors: string[] = [];

    // Procesar en batches
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE);
        const { updated, errors } = await processBatch(supabase, batch);
        totalUpdated += updated;
        allErrors.push(...errors);

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 100));
    }

    return new Response(
        JSON.stringify({
            totalFound: total,
            migrated: totalUpdated,
            errors: allErrors.length > 0 ? allErrors : undefined,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
    );
});