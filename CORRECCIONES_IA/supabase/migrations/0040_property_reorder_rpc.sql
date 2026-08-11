-- Migración: RPC para reorder_property_images transaccional
-- Permite reordenar imágenes atómicamente evitando race conditions

CREATE OR REPLACE FUNCTION reorder_property_images(p_property_id uuid, p_image_ids uuid[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    img_id uuid;
    pos int := 0;
BEGIN
    FOREACH img_id IN ARRAY p_image_ids LOOP
        UPDATE property_images
        SET position = pos
        WHERE id = img_id AND property_id = p_property_id;
        pos := pos + 1;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ninguna imagen actualizada';
    END IF;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION reorder_property_images(uuid, uuid[]) IS 'Reordena imágenes de una propiedad atómicamente. p_image_ids debe ser array de UUIDs en el nuevo orden.';