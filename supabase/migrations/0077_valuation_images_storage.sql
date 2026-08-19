-- ============================================================================
-- 0077_valuation_images_storage.sql
-- Storage bucket para imágenes de tasaciones (fachada + comparables)
-- Reemplaza el almacenamiento base64 en valuation_images.url
-- ============================================================================

-- ============================================================
-- Bucket: valuation-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'valuation-images',
    'valuation-images',
    true,
    5242880, -- 5MB límite
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- Políticas RLS para valuation-images
-- ============================================================

-- Público puede leer (imágenes públicas de tasaciones finalizadas)
CREATE POLICY "valuation_images_public_read" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'valuation-images'
        AND EXISTS (
            SELECT 1 FROM public.property_valuations pv
            JOIN public.valuation_images vi ON vi.valuation_id = pv.id
            WHERE vi.url LIKE '%' || storage.objects.name || '%'
              AND pv.finalized_at IS NOT NULL
              AND pv.deleted_at IS NULL
        )
    );

-- Staff puede subir/actualizar/eliminar
CREATE POLICY "valuation_images_staff_write" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'valuation-images'
        AND public.is_staff()
    );

CREATE POLICY "valuation_images_staff_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'valuation-images'
        AND public.is_staff()
    );

CREATE POLICY "valuation_images_staff_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'valuation-images'
        AND public.is_staff()
    );

-- ============================================================
-- Grants
-- ============================================================
GRANT ALL ON storage.objects TO service_role;
GRANT SELECT ON storage.objects TO authenticated;